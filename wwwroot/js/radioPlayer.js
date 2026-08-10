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

export function play(streamUrl) {
    if (!audioEl) return;

    const sourceUrl = globalThis.NINAR_FM_PROXY_URL || streamUrl;

    // Reassigning src forces a fresh connection to the live stream
    // (important for live radio: just calling .play() on a stalled
    // stream often won't recover, but a fresh src does).
    if (audioEl.src !== sourceUrl) {
        audioEl.src = sourceUrl;
    }
    audioEl.load();
    audioEl.play().catch(() => {
        if (dotNetRef) dotNetRef.invokeMethodAsync("OnStatusChanged", "error");
    });
}

export function pause() {
    if (!audioEl) return;
    audioEl.pause();
    // Fully detach the source on pause/stop so the browser stops
    // buffering a live stream in the background.
    audioEl.removeAttribute("src");
    audioEl.load();
}

export function setVolume(value) {
    if (!audioEl) return;
    audioEl.volume = Math.min(1, Math.max(0, value));
}
