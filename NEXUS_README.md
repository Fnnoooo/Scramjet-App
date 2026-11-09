# NEXUS Browser V8 — performance and games

Deploy this project to the existing GitHub repository connected to Render, not the main Netlify website.

Changes:
- Ten game entries with thumbnails, each loaded only after selection. Leaving or restarting destroys the iframe.
- Existing browser iframe is destroyed when leaving a site, preventing its audio/video from continuing.
- Canvas stars now use 1x rendering, up to 65 stars, and a ~24fps cap; animations stop when a website or game is active or the tab is hidden.
- Removed automatic about:blank popup and blocked popup banner. Manual cloak button is in Settings only.
- Learning window requests Document Picture-in-Picture on first Share tab click when supported. Click Share tab again in the floating panel to select the browser tab. If PiP is unavailable, sharing still works in the normal window but may fall behind.

Important: third-party games may refuse embedding or block proxy access; use the Open game directly fallback. Device performance and browser permissions vary. The AI service remains external. No claim is made that Chrome will always allow floating mode.
