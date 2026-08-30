# Syrian Radio Player

A Blazor WebAssembly directory and live player for Ninar FM.
The home page links to the official live-radio pages for Sham FM and Radio Damascus.

## Run locally

Prerequisite: install the .NET 9 SDK.

```powershell
dotnet restore
dotnet run
```

Open the `https://localhost:<port>` address printed by the command. Stop the server with `Ctrl+C`.

## Project structure

- `Pages/Index.razor`: three-station home page.
- `Pages/NinarFm.razor`: Ninar FM player page.
- `Shared/RadioPlayer.razor`: player UI and Blazor JavaScript interop.
- `wwwroot/js/radioPlayer.js`: native audio control and status events.
- `wwwroot/css/app.css`: visual styling.

## Stream sources

Ninar FM's origin is HTTP-only. It works when the player is served locally over HTTP. An HTTPS site must use an HTTPS proxy because browsers block HTTP audio as mixed content. The included Cloudflare Worker is used only for Ninar FM.

Sham FM and Radio Damascus open their respective official live-radio websites from the station directory.

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
