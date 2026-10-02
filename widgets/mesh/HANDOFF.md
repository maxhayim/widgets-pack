# mesh — Mesh widget

Live stats from the user's own MeshMonitor server: the connected node, nodes heard in the last hour, day, and week, and the latest channel message.

A cross-platform desktop widget in the Widgets Pack, spun off from the desktop on maxhayim.com. Its code goes in this folder.

Read `../../docs/GUIDE.md` first: platform (Tauri 2, still to confirm), look and feel, what changes when leaving the website, and releases. The site's source is linked from the guide.

## On the site
Search the site's `App.jsx` for: `MeshWidget`, `MeshMonitorSettings`, `loadMeshSnapshot`, `meshMonitorFetch`.

## Data
The user's MeshMonitor (github.com/Yeraze/meshmonitor), v1 API: `/api/v1/sources`, `/sources/{id}/nodes`, `/status`, `/messages`, with an `Authorization: Bearer mm_v1_…` token.

## Notes
- Never show direct messages; only channel broadcasts (to `!ffffffff`).
- Keep the token in the OS keychain.
- As a native app it doesn't need MeshMonitor's `ALLOWED_ORIGINS`, and plain-http LAN servers work. Say so in the setup text.
- Supports picking the source (Meshtastic or MeshCore).
