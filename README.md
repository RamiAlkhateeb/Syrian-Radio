# Ninar FM Player

A Blazor WebAssembly single-page player for Ninar FM's live stream.

## Run locally

Prerequisite: install the .NET 9 SDK.

```powershell
dotnet restore
dotnet run
```

Open the `https://localhost:<port>` address printed by the command. Stop the server with `Ctrl+C`.

## Project structure

- `Pages/Index.razor`: home page and stream URL configuration.
- `Shared/RadioPlayer.razor`: player UI and Blazor JavaScript interop.
- `wwwroot/js/radioPlayer.js`: native audio element control and events.
- `wwwroot/css/app.css`: visual styling.

## Stream source

The radio origin is online and sends `Access-Control-Allow-Origin: *`, but it is HTTP-only. It works when the player is served locally over HTTP. An HTTPS site must use an HTTPS proxy because browsers block HTTP audio as mixed content.

This project includes a locked-down Cloudflare Worker in `worker/`; it relays only the Ninar FM stream and supports streaming response bodies and range requests. Do not use a public generic proxy for production.

1. Install Node.js, then run these commands from the project root:
   ```powershell
   cd worker
   npx wrangler login
   npx wrangler deploy
   ```
2. Copy the emitted `https://...workers.dev` URL into `wwwroot/config.js`:
   ```js
   globalThis.NINAR_FM_PROXY_URL = "https://your-worker.workers.dev/";
   ```
3. Rebuild and deploy the player. Keep `NINAR_FM_PROXY_URL` blank for local HTTP development.
