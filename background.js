/**
 * Rustboom Login Helper — background service worker.
 *
 * What it does
 * ------------
 * Facepunch's /app endpoint only completes the Steam login flow (302 with token)
 * when the returnUrl hostname is "localhost" OR the scheme is "rust-plus://".
 * For any other URL it returns a React Native WebView page that shows an alert
 * and refuses to redirect. This extension makes the flow work for rustboom.gg
 * (and any environment of it) by:
 *
 *   1. A declarativeNetRequest rule (rules.json) rewrites the `returnUrl` query
 *      param on requests to companion-rust.facepunch.com/login to
 *      "rust-plus://rustboom-ext/callback" — a value Facepunch accepts.
 *
 *   2. webRequest.onBeforeRequest captures the ORIGINAL returnUrl (which fires
 *      before the dnr rule applies) and stores it keyed by tabId.
 *
 *   3. webRequest.onHeadersReceived reads Facepunch's 302 Location header
 *      from /app — which now looks like:
 *        rust-plus://rustboom-ext/callback?steamId=<id>&token=<jwt>
 *      Extracts steamId + token, looks up the original returnUrl, and
 *      navigates the tab to it with the token query params appended.
 *
 * The user never sees the rust-plus:// URL — chrome.tabs.update preempts the
 * browser's attempt to follow the unhandled custom-scheme redirect.
 */

const FACEPUNCH_LOGIN_URL = "https://companion-rust.facepunch.com/login*";
const FACEPUNCH_APP_URL = "https://companion-rust.facepunch.com/app*";

// Map<tabId, originalReturnUrl> — populated on /login, drained on /app response.
const tabReturnUrls = new Map();

/**
 * Step 2 — capture the original returnUrl before the dnr rule rewrites it.
 * This listener also fires for the rewritten request (after dnr redirects);
 * we filter that out by ignoring returnUrls that already begin with "rust-plus:".
 */
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.tabId < 0) return; // background / non-tab request
    try {
      const url = new URL(details.url);
      const orig = url.searchParams.get("returnUrl");
      if (!orig) return;
      if (orig.startsWith("rust-plus:")) return; // post-dnr request, already rewritten
      tabReturnUrls.set(details.tabId, orig);
      console.log("[rustboom-ext] captured original returnUrl for tab", details.tabId, orig);
    } catch (err) {
      console.warn("[rustboom-ext] failed to parse /login URL", err);
    }
  },
  { urls: [FACEPUNCH_LOGIN_URL] }
);

/**
 * Step 3 — read the 302 Location header from /app and navigate the tab to
 * the real backend callback URL with token + steamId appended.
 */
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId < 0) return;
    try {
      const locationHeader = details.responseHeaders?.find(
        (h) => h.name.toLowerCase() === "location"
      );
      const location = locationHeader?.value;
      if (!location || !location.startsWith("rust-plus://")) return;

      const queryIdx = location.indexOf("?");
      if (queryIdx === -1) {
        console.warn("[rustboom-ext] /app Location has no query string:", location);
        return;
      }
      const params = new URLSearchParams(location.substring(queryIdx + 1));
      const token = params.get("token");
      const steamId = params.get("steamId");
      if (!token) {
        console.warn("[rustboom-ext] /app Location missing token:", location);
        return;
      }

      const orig = tabReturnUrls.get(details.tabId);
      if (!orig) {
        console.warn("[rustboom-ext] no captured returnUrl for tab", details.tabId);
        return;
      }
      tabReturnUrls.delete(details.tabId);

      const finalUrl = new URL(orig);
      finalUrl.searchParams.set("token", token);
      if (steamId) finalUrl.searchParams.set("steamId", steamId);

      console.log("[rustboom-ext] forwarding tab", details.tabId, "→", finalUrl.toString());
      chrome.tabs.update(details.tabId, { url: finalUrl.toString() });
    } catch (err) {
      console.error("[rustboom-ext] onHeadersReceived error", err);
    }
  },
  { urls: [FACEPUNCH_APP_URL] },
  ["responseHeaders"]
);

/** Clean up any orphaned entries when tabs close. */
chrome.tabs.onRemoved.addListener((tabId) => {
  tabReturnUrls.delete(tabId);
});

console.log("[rustboom-ext] background service worker initialized");
