# Google Analytics (GA4) — Setup Guide

This project is wired to load **Google Analytics 4 (GA4)** automatically, but it is
**disabled by default** so it sends nothing until you paste in your own
Measurement ID. Follow the steps below to turn it on and start seeing visitor data.

---

## How it works (technical overview)

| File | Role |
| --- | --- |
| `wwwroot/config.js` | Holds `GA_MEASUREMENT_ID`. This is the **only** file you edit. |
| `wwwroot/js/analytics.js` | Reads that ID, injects the GA4 `gtag.js` snippet, and exposes a `trackPageView()` helper. |
| `wwwroot/index.html` | Loads `config.js` then `js/analytics.js` before the Blazor app. |
| `App.razor` | Calls `trackPageView()` on every client-side route change (/, /about, /install, /ninar-fm). |

When `GA_MEASUREMENT_ID` is empty, `analytics.js` does nothing — no external
request is made and no data is collected.

---

## Step-by-step configuration

### Step 1 — Create a Google Analytics property

1. Go to <https://analytics.google.com> and sign in with your Google account.
2. Click **Admin** (the gear icon, bottom-left).
3. In the **Account** column, select an existing account or create a new one.
4. In the **Property** column, click **+ Create Property**.
5. Enter a name (e.g. "Radio Syria Player"), choose your reporting time zone and currency, then click **Next**.
6. On the "Business details" screen, fill in whatever applies (category, size) and click **Create**.
7. When asked for a platform, choose **Web**.

### Step 2 — Get your Measurement ID

1. On the "Web stream details" screen, you will see a **Measurement ID** in the
   top-right, formatted like `G-XXXXXXXXXX`.
2. Copy that value.

> You can find it again anytime: **Admin → Property → Data Streams → (your web
> stream) → Measurement ID**.

### Step 3 — Paste the ID into the project

Open `wwwroot/config.js` and set the value:

```js
globalThis.GA_MEASUREMENT_ID = "G-XXXXXXXXXX";
```

(Replace `G-XXXXXXXXXX` with the ID you copied.)

### Step 4 — Rebuild and deploy

The ID is read from a plain config file, but Blazor WebAssembly bundles the
static files at publish time, so deploy a fresh build:

```powershell
dotnet publish -c Release -o output
```

Then upload the `output/wwwroot` contents (or run your normal deploy pipeline)
so the updated `config.js` reaches the server.

> Tip: because `config.js` is a normal static file, you can also edit it directly
> on the server after deploying — but editing it in the repo keeps it safe from
> being overwritten on the next publish.

### Step 5 — Verify data is arriving

1. Open your live site in a browser.
2. In Google Analytics, go to **Reports → Realtime**.
3. You should see yourself listed as an active user within a few seconds.

If nothing appears in Realtime, check that:
- `GA_MEASUREMENT_ID` is set and has no stray spaces or quotes.
- The deployed `config.js` actually contains the ID (view-source on the page).
- No ad-blocker is blocking `googletagmanager.com`.

---

## Viewing visitor information

Once data flows, these reports answer common questions:

| Question | Where to look |
| --- | --- |
| How many visitors (now / today) | **Reports → Realtime** and **Reports → Home** |
| New vs returning visitors | **Reports → Retention** or **Reports → Home → Users** |
| Which pages they visit | **Reports → Engagement → Pages and screens** |
| Where visitors come from | **Reports → Acquisition → Traffic acquisition** |
| What device / browser they use | **Reports → Tech → Tech overview** |
| Which country/city | **Reports → Demographics → Demographic details** (enable Google Signals for best results) |
| How long they stay | **Reports → Engagement → Engagement overview** |

> GA4 usually shows new data within a few minutes, but some reports (e.g.
> Demographics) can take 24–48 hours to populate for the first time.

---

## Optional extras

### Track a custom event (e.g. when someone taps "listen")

Add a one-liner anywhere in a `.razor` page:

```csharp
await JS.InvokeVoidAsync("gtag", "event", "listen_click", new { station = "Ninar FM" });
```

Then see it under **Reports → Engagement → Events**.

### Disable analytics again

Set the ID back to empty and redeploy:

```js
globalThis.GA_MEASUREMENT_ID = "";
```

---

## Privacy notes

- Analytics stays **off** until you set an ID — no tracker loads otherwise.
- `anonymize_ip: true` is already set in `analytics.js`, so IP addresses are
  anonymized before processing.
- Consider linking to a privacy policy from the About page and mentioning that
  you use Google Analytics.
