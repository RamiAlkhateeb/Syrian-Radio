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

export function dispose() {
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

