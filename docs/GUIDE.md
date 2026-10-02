# Widgets Pack — shared guide

The Widgets Pack is **one repo holding every widget**. Each widget is a small cross-platform desktop widget for Windows, macOS, and Linux, spun off from the desktop on [maxhayim.com](https://maxhayim.com) (GitHub `maxhayim/maxhayim.github.io`).

The owner is Max Hayim (GitHub `maxhayim`). Each widget has its own folder, `widgets/<name>/`, with its brief in `HANDOFF.md`. Shared across all widgets:
- this guide (`docs/GUIDE.md`)
- the site's source at v2.16.3 (commit 2f12bef): [`App.jsx`](https://github.com/maxhayim/maxhayim.github.io/blob/2f12befddf1075111af43c3fd26b4b7c261df78b/src/App.jsx) and [`index.css`](https://github.com/maxhayim/maxhayim.github.io/blob/2f12befddf1075111af43c3fd26b4b7c261df78b/src/index.css). Each brief names the functions to search for.

## Platform: confirm with Max in the first project

Max asked for "whatever cross-platform is popular now". The recommendation is **Tauri 2**:
- The widgets are already React plus CSS, and Tauri runs that code as native windows on Windows, macOS, and Linux.
- Apps are small (about 10 MB, versus 100+ MB with Electron).
- Tauri windows can be frameless, transparent, pinned to the desktop layer, and remembered per monitor.
- The native widget systems (macOS WidgetKit, the Windows 11 Widgets board, KDE Plasma) are each tied to one platform and can't run this web code.

Each widget becomes one small app: a frameless widget window, plus a tray or menu-bar icon with Settings, Always on top, and Quit. Once the first widget is built, reuse its setup for the rest: share the Tauri config, the look-and-feel CSS, and helpers across `widgets/` instead of copying them.

## Look and feel, shared by every widget

The design is Braun-inspired: rounded 26px cases, 196px wide, warm off-whites in light mode and warm near-blacks in dark mode, with an orange accent. The tokens are the `--os-*` variables (`:root` and the dark-mode blocks) and `--w-*` (on `.widget`) in the site's `index.css`; the widget styles are under `/* ---------- Widgets:` and the following blocks. Follow the OS light/dark setting.

## What changes when leaving the website

- **Preferences:** the site's `usePrefs` / `readPrefs` save to browser cookies. Use Tauri's store plugin instead. Keep API keys in the OS keychain, not in plain files.
- **Clicks that open System Preferences** (`openPreferences(...)`): replace with the widget's own settings window.
- **Language and clock:** widgets read the site's Language and Date & Time prefs (`REGION_PREFS`, `TIME_PREFS`, `formatTime`, `clockParts`). Use the OS locale and the OS 12/24-hour setting instead, with an override in settings.
- **Network:** browsers block sites from calling many data services (CORS). A Tauri app can make requests from its Rust side, where that limit doesn't apply. That opens up data the site couldn't use. Check each service's terms first, and never get around a service that deliberately blocks other apps (for example by stripping referrers).
- **Drag:** each widget is a whole window that the user drags. Snap it to a 16px grid and keep it fully on screen (as on the site since v2.15), and remember the position per monitor.

## Releases

Follow the site's habits: semver GitHub releases with plain-language notes written from the actual changes, with installers attached per OS (`.dmg`, `.msi` or `.exe`, and `.AppImage` or `.deb`). Each widget still ships as its own app with its own installers; tag releases per widget (for example `clock-v1.0.0`) or for the whole pack, to be decided with Max. Ship unsigned: Max does not pay for Apple notarization or Windows code signing. Ask Max about the repo's visibility and the license before the first public release.
