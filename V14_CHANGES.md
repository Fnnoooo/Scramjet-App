# V14 — Single Learning window

- Removes Document Picture-in-Picture creation, so Share tab no longer opens a second Learning window.
- Uses the existing `/learning.html` popup and preserves its calculator unlock (`0003` then `=`).
- Share tab requests Chrome tab sharing directly. Where supported, CaptureController requests focus on the selected tab after the picker. Chrome may override this behavior.
- Preserves AIAPK, Ask, Solve this page, Stop sharing, and the existing games and proxy code from V13.
- Games 2v2.io and Fallzone.io may still freeze at 99%; this release does not claim to fix that separate proxy/game-server problem.
