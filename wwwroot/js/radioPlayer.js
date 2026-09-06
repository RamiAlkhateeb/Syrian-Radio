// Thin wrapper around the <audio> element so Blazor can control it
// and receive status callbacks (playing / waiting / error) back via JSInterop.

let audioEl = null;
let dotNetRef = null;

export function init(elementId, dotNetHelper) {
    audioEl = document.getElementById(elementId);
    dotNetRef = dotNetHelper;

    if (!audioEl) {
        console.error("radioPlayer: audio element not found:", elementId);
        return;
    }

    audioEl.addEventListener("playing", () => dotNetRef.invokeMethodAsync("OnStatusChanged", "live"));
    audioEl.addEventListener("waiting", () => dotNetRef.invokeMethodAsync("OnStatusChanged", "buffering"));
    audioEl.addEventListener("pause", () => dotNetRef.invokeMethodAsync("OnStatusChanged", "paused"));
    audioEl.addEventListener("error", () => dotNetRef.invokeMethodAsync("OnStatusChanged", "error"));
    audioEl.addEventListener("stalled", () => dotNetRef.invokeMethodAsync("OnStatusChanged", "error"));
}

function notifyStatus(status) {
    if (dotNetRef) dotNetRef.invokeMethodAsync("OnStatusChanged", status);
}

function clearSource() {
    if (!audioEl) return;
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
}

function startNativePlayback(sourceUrl) {
    if (!audioEl) return;

    audioEl.src = sourceUrl;
    audioEl.load();
    audioEl.play().catch(() => notifyStatus("error"));
}

export function play(streamUrl, useNinarProxy) {
    if (!audioEl) return;

    const sourceUrl = useNinarProxy
        ? globalThis.NINAR_FM_PROXY_URL || streamUrl
        : streamUrl;

    clearSource();

    startNativePlayback(sourceUrl);
}

export function pause() {
    clearSource();
}

export function setVolume(value) {
    if (!audioEl) return;
    audioEl.volume = Math.min(1, Math.max(0, value));
}

export async function shareStation(title, text, url) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text,
                url: url
            });
            return { success: true, method: "native" };
        } catch (err) {
            if (err.name === "AbortError") {
                return { success: true, method: "aborted" };
            }
        }
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(`${text} ${url}`);
            return { success: true, method: "clipboard" };
        }
    } catch (e) { }

    return { success: false, method: "none" };
}

export function dispose() {
    clearSource();
    audioEl = null;
    dotNetRef = null;
}

