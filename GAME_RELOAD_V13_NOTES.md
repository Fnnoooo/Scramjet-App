# NEXUS Browser V13 — fresh game sessions

Changes from V12:
- On leaving a game, the host page reloads and returns automatically to the Games library. This terminates the prior Scramjet controller, transport, WebGL context and game frame rather than reusing a contaminated frame.
- Restart reloads the host page and reopens the same game with a new controller/frame.
- Game service-worker keepalive during gameplay (15-second interval) to mitigate idle-worker routing loss.
- Return to Games/Home is restored automatically after cleanup; the calculator is not re-prompted during this internal reload.
- No clearing cookies, game storage, or other user data.
- All games use the same cleanup workflow. AIAPK, Learning, calculator, shortcuts and settings remain unchanged.

Caveat: This mitigates proxy lifecycle problems but cannot guarantee compatibility with remote game servers. Test first/second/third loads after deploying.
