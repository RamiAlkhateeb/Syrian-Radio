# Syrian Radio Player

A Blazor WebAssembly radio for Syrian stations: Ninar FM, Sham FM, Radio Damascus, Rozana FM and Radio Syria.
It has an FM-style tuner, live playback, favorites, a sleep timer, lock-screen controls and an AI assistant that picks a station or suggests a song.

## Run locally

Prerequisite: install the .NET 10 SDK.

```powershell
dotnet restore
dotnet run
```

Open the `https://localhost:<port>` address printed by the command. Stop the server with `Ctrl+C`.

## Project structure

- `Pages/Index.razor`: the radio (tuner, player, station sheet, favorites, sleep timer, embedded station pages).
- `Pages/Assistant.razor`: AI assistant (station picks, news pointers, song suggestions with YouTube links).
- `Shared/RadioStations.cs`: the station list shared by the player and the assistant.
- `wwwroot/js/radioPlayer.js`: native audio (incl. HLS via hls.js), auto-reconnect, Media Session, tuner.
- `wwwroot/css/app.css`: visual styling.
- `lib/Nxt.UI`: shared UI library (git submodule).

## Stream sources

- Ninar FM's origin is HTTP-only, so HTTPS deployments play it through the Cloudflare Worker in `worker/`.
- Rozana FM (radio.co) and Sham FM (Shoutcast over HTTPS) play directly.
- Radio Damascus is an HLS stream (`.m3u8`); browsers without native HLS load hls.js from jsDelivr on demand.
- If a native stream keeps failing, stations with an `EmbedUrl` show their own website inside the app instead.
- Radio Syria (syria.tv) has no usable stream or embeddable page, so it opens the official site.
