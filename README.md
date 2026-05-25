# Rustboom Login Helper

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-coming%20soon-yellow?logo=googlechrome)](https://github.com/RustBoom/rustboom-extension)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-coming%20soon-orange?logo=firefox)](https://github.com/RustBoom/rustboom-extension)

A tiny browser extension that makes **Steam login on [rustboom.gg](https://rustboom.gg)** work without any per-device setup. Install once — the login flow becomes transparent.

---

## Why this exists

Facepunch runs a companion auth endpoint at `companion-rust.facepunch.com`. After Steam OpenID it redirects back to the caller — but **only if** the `returnUrl` is either:

- `http(s)://localhost` (any port), or
- the `rust-plus://` deep-link scheme used by their mobile app

Any normal HTTPS hostname (e.g. `api-vending-dev.rustboom.gg`) gets a React Native WebView page that alerts *"Failed to send login message to the Rust+ app"* and never redirects.

This extension bridges that gap entirely at the network layer — no content scripts, no DOM access, no changes needed to rustboom.gg itself.

---

## How it works

Three steps, all in the background service worker:

```
Browser                     Extension                  Facepunch
  │                             │                          │
  │──GET /login?returnUrl=───►  │  capture original URL    │
  │  (dnr rewrites returnUrl    │  in tabReturnUrls map     │
  │   to rust-plus://…)         │──GET /login?returnUrl=──►│
  │                             │    rust-plus://…         │
  │                             │◄─ 302 → /app ───────────│
  │                             │                          │
  │──GET /app ─────────────────►│  read Location header    │
  │                             │◄─ 302 Location: ────────│
  │                             │    rust-plus://…         │
  │                             │    ?steamId=…&token=…    │
  │                             │                          │
  │◄─ tabs.update(originalURL+token) ──────────────────────│
  │    → /auth/steam/callback?session=…&token=…            │
```

1. **`rules.json`** — a `declarativeNetRequest` static rule rewrites the outgoing `returnUrl` query param to `rust-plus://rustboom-ext/callback`. Facepunch now sees a value it accepts and issues a proper 302.

2. **`webRequest.onBeforeRequest`** — fires *before* the dnr rule applies, so the original `returnUrl` is still visible. It is stored in an in-memory `Map<tabId, url>`.

3. **`webRequest.onHeadersReceived`** — reads the `Location` header of Facepunch's 302 from `/app` (which now contains `steamId` + `token`), looks up the original returnUrl, and calls `chrome.tabs.update` to navigate the tab to the real backend callback with the token appended.

The user never sees the `rust-plus://` address — the explicit `tabs.update` call preempts the browser's attempt to open the unregistered custom scheme.

---

## Permissions

| Permission | Why |
|---|---|
| `declarativeNetRequestWithHostAccess` | Lets the static rule in `rules.json` rewrite `returnUrl` on requests to `companion-rust.facepunch.com/login` |
| `webRequest` | Observe (non-blocking) the original `/login` request before it is rewritten, and read the 302 `Location` header from `/app` |
| `tabs` | `chrome.tabs.update(tabId, {url})` — navigate the tab to the real backend callback |
| `host_permissions: companion-rust.facepunch.com/*` | Required for both of the above to apply on Facepunch's domain |

The extension has **no permission** for `rustboom.gg` or any other domain. It reads no page content and injects no scripts anywhere.

---

## Install

### From the browser stores (recommended)

> Store listings are coming soon. Until they are approved, use the manual install below.

### Manual install (load unpacked)

#### Chrome / Edge

1. Download the [latest release](https://github.com/RustBoom/rustboom-extension/releases) and unzip, **or** clone the repo and run `pnpm build:chrome`.
2. Open `chrome://extensions` (or `edge://extensions`).
3. Enable **Developer mode** (toggle, top-right).
4. Click **Load unpacked** → select the `dist-chrome/` directory.

#### Firefox

1. Download the [latest release](https://github.com/RustBoom/rustboom-extension/releases) and unzip, **or** clone the repo and run `pnpm build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on** → pick `dist-firefox/manifest.json`.

> Firefox temporary add-ons unload on browser close. A permanent install requires the Firefox AMO listing (coming soon).

---

## Build from source

**Requirements:** Node 20+, pnpm

```bash
git clone https://github.com/RustBoom/rustboom-extension.git
cd rustboom-extension
pnpm build              # produces dist-chrome/ and dist-firefox/
pnpm build:chrome       # Chrome/Edge only
pnpm build:firefox      # Firefox only
pnpm zip:chrome         # dist-chrome/ → rustboom-extension-chrome.zip
pnpm zip:firefox        # dist-firefox/ → rustboom-extension-firefox.zip
pnpm clean              # remove dist-* and zip files
```

No dependencies are installed. The build script (`build.js`) is plain Node — it copies the right manifest and shared source files into each dist directory.

---

## Verify it's working

1. Install the extension (see above).
2. Open a fresh private/incognito window.
3. Go to `https://www.rustboom.gg` and click **Login with Steam**.
4. You should land on `https://www.rustboom.gg/vending-machines?paired=1`.

**Check the service-worker log** (Chrome: `chrome://extensions` → extension card → "service worker"):
```
[rustboom-ext] captured original returnUrl for tab 42 https://api-vending.rustboom.gg/api/v1/auth/steam/callback?session=…
[rustboom-ext] forwarding tab 42 → https://api-vending.rustboom.gg/api/v1/auth/steam/callback?session=…&token=…&steamId=…
```

**Negative test:** disable the extension and retry — you'll see Facepunch's *"Failed to send login message"* alert, confirming the extension is the only moving part.

---

## Browser support

| Browser | Status |
|---|---|
| Chrome 116+ | ✅ |
| Edge (Chromium) | ✅ — installs Chrome Web Store extensions natively |
| Firefox 121+ | ✅ |
| Safari | ❌ — requires a separate Xcode project; out of scope for v1 |

---

## Project structure

```
manifest.chrome.json   Chrome/Edge MV3 manifest
manifest.firefox.json  Firefox MV3 manifest
background.js          Service-worker: webRequest listeners + tabs.update logic
rules.json             declarativeNetRequest rule: rewrites returnUrl
build.js               Build script: copies files into dist-chrome/ and dist-firefox/
package.json           pnpm scripts (build, zip, clean)
icons/                 PNG icons (16/32/48/128 px) — add before store submission
```

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

## License

[MIT](LICENSE) © 2026 RustBoom
