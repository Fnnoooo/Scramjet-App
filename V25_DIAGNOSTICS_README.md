# NEXUS V25 — diagnostic-only build

Deploy the ZIP contents as your existing Render project. Visit `https://YOUR-RENDER-DOMAIN/diagnostics.html` on a personal device and click **Copy results**.

No changes to `public/nexus.js`, game loading, calculator, or service worker. Adds a read-only fixed-destination HTTPS test endpoint and standalone diagnostic page.

**Critical existing configuration finding:** `src/index.js` has `hostname_blacklist: [/example\.com/]`. Consequently, `example.com` is intentionally denied through Wisp and should NOT be used as a proxy TLS test. Try `https://www.wikipedia.org/` in NEXUS. The diagnostic page separately checks server-side HTTPS to both example.com and Wikipedia.

A successful WebSocket handshake does not prove Wisp data forwarding works; successful server-side fetch does not prove libcurl works. Compare these checks with the result of navigating to Wikipedia through NEXUS.
