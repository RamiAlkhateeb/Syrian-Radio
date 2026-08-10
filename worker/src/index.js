const STREAM_URL = "http://ninarfm.grtvstream.com:8896/";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store"
};

export default {
    async fetch(request) {
        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== "GET" && request.method !== "HEAD") {
            return new Response("Method not allowed", {
                status: 405,
                headers: { ...corsHeaders, Allow: "GET, HEAD, OPTIONS" }
            });
        }

        const headers = new Headers();
        const range = request.headers.get("Range");
        if (range) headers.set("Range", range);

        const upstream = await fetch(STREAM_URL, {
            method: request.method,
            headers,
            cf: { cacheTtl: 0, cacheEverything: false }
        });

        const responseHeaders = new Headers(upstream.headers);
        for (const [name, value] of Object.entries(corsHeaders)) {
            responseHeaders.set(name, value);
        }

        return new Response(upstream.body, {
            status: upstream.status,
            statusText: upstream.statusText,
            headers: responseHeaders
        });
    }
};
