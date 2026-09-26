// Google Analytics (GA4) loader.
// Reads the Measurement ID from globalThis.GA_MEASUREMENT_ID (set in config.js).
// When the ID is blank, analytics stays disabled and nothing is sent.

(function () {
    const id = globalThis.GA_MEASUREMENT_ID;

    if (!id || typeof id !== "string" || id.trim() === "") {
        return; // Analytics disabled — no tracker is injected.
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
        window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", id, { anonymize_ip: true });
})();

// Called by the Blazor app (App.razor) on every client-side navigation so that
// SPA route changes (/, /about, /install) are tracked as page views.
window.trackPageView = function (path) {
    if (!window.gtag) return;
    window.gtag("event", "page_view", { page_path: path });
};
