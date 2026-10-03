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
    audioEl.addEventListener("playing", () => { retries = 0; });
    audioEl.addEventListener("error", () => handleDrop());
    audioEl.addEventListener("stalled", () => { if (audioEl.readyState < 3) handleDrop(); });
}

// Live streams drop now and then; retry quietly a few times before telling the UI.
let wantPlaying = false;
let currentSource = null;
let retries = 0;
let retryTimer = null;
let hls = null;
const MAX_RETRIES = 3;

function handleDrop() {
    if (!wantPlaying || !currentSource) return;
    if (retries >= MAX_RETRIES) {
        wantPlaying = false;
        notifyStatus("error");
        return;
    }
    retries++;
    notifyStatus("buffering");
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => { if (wantPlaying) startNativePlayback(currentSource); }, 1500 * retries);
}

let hlsLoader = null;
function loadHlsLib() {
    if (globalThis.Hls) return Promise.resolve(globalThis.Hls);
    hlsLoader ??= new Promise((resolve, reject) => {
        const el = document.createElement("script");
        el.src = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";
        el.onload = () => resolve(globalThis.Hls);
        el.onerror = () => reject(new Error("hls.js failed to load"));
        document.head.appendChild(el);
    });
    return hlsLoader;
}

function notifyStatus(status) {
    if (dotNetRef) dotNetRef.invokeMethodAsync("OnStatusChanged", status);
}

function clearSource() {
    if (!audioEl) return;
    if (hls) { hls.destroy(); hls = null; }
    audioEl.pause();
    audioEl.removeAttribute("src");
    audioEl.load();
}

function startNativePlayback(sourceUrl) {
    if (!audioEl) return;
    if (hls) { hls.destroy(); hls = null; }

    if (/\.m3u8(\?|$)/i.test(sourceUrl) && !audioEl.canPlayType("application/vnd.apple.mpegurl")) {
        // Chrome/Firefox/Edge have no native HLS: use hls.js.
        loadHlsLib().then((Hls) => {
            if (!audioEl || currentSource !== sourceUrl || !wantPlaying) return;
            if (!Hls.isSupported()) { handleDrop(); return; }
            hls = new Hls();
            hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) handleDrop(); });
            hls.loadSource(sourceUrl);
            hls.attachMedia(audioEl);
            audioEl.play().catch(() => notifyStatus("error"));
        }).catch(() => handleDrop());
        return;
    }

    audioEl.src = sourceUrl;
    audioEl.load();
    audioEl.play().catch(() => handleDrop());
}

export function play(streamUrl, useNinarProxy) {
    if (!audioEl) return;

    const sourceUrl = useNinarProxy
        ? globalThis.NINAR_FM_PROXY_URL || streamUrl
        : streamUrl;

    clearSource();

    wantPlaying = true;
    retries = 0;
    currentSource = sourceUrl;
    startNativePlayback(sourceUrl);
}

export function pause() {
    wantPlaying = false;
    clearTimeout(retryTimer);
    clearSource();
}

/** Lock-screen / notification controls. Actions call back into Blazor. */
export function setMediaSession(title, artist, artworkUrl, dotNetHelper) {
    if (!("mediaSession" in navigator)) return;
    const artwork = artworkUrl ? [{ src: new URL(artworkUrl, document.baseURI).href }] : [];
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist, artwork });
    const handlers = {
        play: "MediaPlay", pause: "MediaPause", nexttrack: "MediaNext", previoustrack: "MediaPrevious"
    };
    for (const [action, method] of Object.entries(handlers)) {
        try { navigator.mediaSession.setActionHandler(action, () => dotNetHelper.invokeMethodAsync(method)); } catch { /* unsupported action */ }
    }
}

export function setVolume(value) {
    if (!audioEl) return;
    const boundedVolume = Math.min(1, Math.max(0, value));
    audioEl.volume = boundedVolume;
    if (staticGain) {
        staticGain.gain.value = boundedVolume * 0.15;
    }
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

let audioCtx = null;
let staticNode = null;
let staticGain = null;

function initWebAudio() {
    if (audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
}

function getWhiteNoiseBuffer() {
    const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

export function playStatic(volumeLevel) {
    if (!audioCtx) initWebAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (staticNode) return; // already playing
    
    const buffer = getWhiteNoiseBuffer();
    staticNode = audioCtx.createBufferSource();
    staticNode.buffer = buffer;
    staticNode.loop = true;
    
    staticGain = audioCtx.createGain();
    staticGain.gain.value = volumeLevel * 0.15; // static shouldn't be too loud
    
    staticNode.connect(staticGain);
    staticGain.connect(audioCtx.destination);
    
    staticNode.start();
}

export function stopStatic() {
    if (staticNode) {
        staticNode.stop();
        staticNode.disconnect();
        staticNode = null;
    }
    if (staticGain) {
        staticGain.disconnect();
        staticGain = null;
    }
}

let tunerDotNetRef = null;
let tunerTrack = null;
let tunerViewport = null;
let minFrequency = 86.0;
let maxFrequency = 106.0;
let pxScale = 70.0;
let currentTunerFreq = 89.6;
let cleanupTunerFn = null;

export function initTuner(viewportId, trackId, dotNetHelper, minF, maxF, pxMhz) {
    tunerViewport = document.getElementById(viewportId);
    tunerTrack = document.getElementById(trackId);
    tunerDotNetRef = dotNetHelper;
    minFrequency = minF || 86.0;
    maxFrequency = maxF || 106.0;
    pxScale = pxMhz || 70.0;

    if (!tunerViewport || !tunerTrack) return;

    let isDragging = false;
    let startX = 0;
    let startFreq = currentTunerFreq;
    let hasMoved = false;

    function onPointerDown(e) {
        if (e.button !== undefined && e.button !== 0) return;
        isDragging = true;
        hasMoved = false;
        startX = e.clientX;
        startFreq = currentTunerFreq;
        try { tunerViewport.setPointerCapture(e.pointerId); } catch (_) {}
        tunerTrack.classList.add("dragging");
        tunerViewport.classList.add("is-dragging");
    }

    function onPointerMove(e) {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 3) {
            hasMoved = true;
        }
        // Dragging left (negative dx) moves forward in frequency
        const freqDiff = -dx / pxScale;
        let newFreq = Math.round((startFreq + freqDiff) * 10) / 10;
        newFreq = Math.min(maxFrequency, Math.max(minFrequency, newFreq));

        if (newFreq !== currentTunerFreq) {
            currentTunerFreq = newFreq;
            applyTunerTransform(currentTunerFreq);
            if (tunerDotNetRef) {
                tunerDotNetRef.invokeMethodAsync("OnTunerScrolled", currentTunerFreq);
            }
        }
    }

    function onPointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        try { tunerViewport.releasePointerCapture(e.pointerId); } catch (_) {}
        tunerTrack.classList.remove("dragging");
        tunerViewport.classList.remove("is-dragging");

        if (hasMoved && tunerDotNetRef) {
            tunerDotNetRef.invokeMethodAsync("OnTunerReleased", currentTunerFreq);
        }
    }

    function onWheel(e) {
        e.preventDefault();
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const freqStep = (delta > 0 ? 0.1 : -0.1);
        let newFreq = Math.round((currentTunerFreq + freqStep) * 10) / 10;
        newFreq = Math.min(maxFrequency, Math.max(minFrequency, newFreq));
        if (newFreq !== currentTunerFreq) {
            currentTunerFreq = newFreq;
            applyTunerTransform(currentTunerFreq);
            if (tunerDotNetRef) {
                tunerDotNetRef.invokeMethodAsync("OnTunerScrolled", currentTunerFreq);
            }
        }
    }

    tunerViewport.addEventListener("pointerdown", onPointerDown);
    tunerViewport.addEventListener("pointermove", onPointerMove);
    tunerViewport.addEventListener("pointerup", onPointerUp);
    tunerViewport.addEventListener("pointercancel", onPointerUp);
    tunerViewport.addEventListener("wheel", onWheel, { passive: false });

    cleanupTunerFn = () => {
        if (tunerViewport) {
            tunerViewport.removeEventListener("pointerdown", onPointerDown);
            tunerViewport.removeEventListener("pointermove", onPointerMove);
            tunerViewport.removeEventListener("pointerup", onPointerUp);
            tunerViewport.removeEventListener("pointercancel", onPointerUp);
            tunerViewport.removeEventListener("wheel", onWheel);
        }
    };
}

export function updateTunerPosition(freq) {
    currentTunerFreq = freq;
    applyTunerTransform(freq);
}

function applyTunerTransform(freq) {
    if (!tunerTrack) return;
    const offsetPx = -((freq - minFrequency) * pxScale);
    tunerTrack.style.transform = `translateX(${offsetPx.toFixed(1)}px)`;
}

let embedTimer = null;

export function watchEmbed(frameId, dotNetHelper, timeoutMs) {
    clearTimeout(embedTimer);
    // The iframe is rendered after this call; wait a tick for Blazor to put it in the DOM.
    setTimeout(() => {
        const frame = document.getElementById(frameId);
        if (!frame) return;
        let loaded = false;
        frame.addEventListener("load", () => { loaded = true; clearTimeout(embedTimer); }, { once: true });
        embedTimer = setTimeout(() => { if (!loaded) dotNetHelper.invokeMethodAsync("OnEmbedTimeout"); }, timeoutMs);
    }, 50);
}

export function dispose() {
    clearTimeout(embedTimer);
    clearTimeout(retryTimer);
    wantPlaying = false;
    clearSource();
    stopStatic();
    if (cleanupTunerFn) {
        cleanupTunerFn();
        cleanupTunerFn = null;
    }
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
    audioEl = null;
    dotNetRef = null;
    tunerDotNetRef = null;
    tunerViewport = null;
    tunerTrack = null;
}

