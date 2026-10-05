# Widgets Pack — developer guide

The pack is one [Zebar](https://github.com/glzr-io/zebar) widget pack (`zpack.json` at the repo root) holding every widget. Zebar is a free, open-source host for desktop widgets on Windows, macOS, and Linux; each widget is a small frameless, transparent window running a web page.

The widgets started as the desktop widgets on [maxhayim.com](https://maxhayim.com). Their original code is the site's source at v2.16.3 (commit 2f12bef): [`App.jsx`](https://github.com/maxhayim/maxhayim.github.io/blob/2f12befddf1075111af43c3fd26b4b7c261df78b/src/App.jsx) and [`index.css`](https://github.com/maxhayim/maxhayim.github.io/blob/2f12befddf1075111af43c3fd26b4b7c261df78b/src/index.css).

## Layout

```
zpack.json            the 13 widgets: window options, default placement, allowed programs
widgets/<name>/       index.html + main.jsx: one widget
src/shared/
  shell.jsx           the frame: drag, settings side, window fitting, shared settings
  desktop.js          everything that talks to Zebar and the window (safe outside Zebar)
  store.js            settings storage and the shared settings
  time.jsx            time zones, formatting, the small analog clock
  theme.css           the look: tokens, every widget's styles, Tailwind
dist/                 the build Zebar runs (committed)
```

Stack: React 19, Tailwind 4, lucide-react, built by Vite into `dist/<name>/index.html`. A widget is `mountWidget({ id, label, Widget, Settings })`; `Settings` is optional and appears above the shared settings.

## How the frame works

- **Window size:** a `ResizeObserver` on the widget sets the window to exactly its size (plus 12px around for the shadow). `zpack.json` heights are only a first guess.
- **Drag:** Zebar widgets can't use Tauri's built-in window drag, so a pointer drag moves the window with `setPosition`. A press that moves less than 4px stays a click. On release it snaps to 16px and is kept on its monitor, and the spot is saved per monitor layout.
- **Settings side:** gear on hover or right-click. The widget stays mounted underneath, so a playing radio keeps playing.
- **Layer:** `setZOrder` with `normal`, `top_most`, or `bottom_most`, saved per widget.
- **Links:** `openUrl` runs `open` (macOS), `xdg-open` (Linux), or `explorer` (Windows) through Zebar's `shellExec`. `zpack.json` allows only those programs, and only with a single https URL.
- **Storage:** Zebar gives each pack its own browser storage, served from `http://127.0.0.1:6124`. Keys are prefixed `widgets-pack:`. Photos are in IndexedDB (`widgets-pack-photos`).
- **Location:** the weather's "near me" uses Zebar's `ip` provider (city level, no permission prompt) instead of browser geolocation, which web views often don't offer.

## Adding a widget

1. Make `widgets/<name>/index.html` (copy one) and `main.jsx`.
2. Add it to `zpack.json`.
3. `npm run build`, commit, and reload Zebar's widget packs.

Keep to the look: 196px wide, 26px corners, `--os-*` and `--w-*` tokens from `theme.css`, light and dark both. Before adding a radio station, check it plays in an `<audio>` element from a normal web page and that the broadcaster allows playback from other sites. Never work around a service that deliberately blocks other sites.

## Releases

Semver, in `package.json` and `zpack.json`, with an entry in `CHANGELOG.md` and the README's Versioning list. Each GitHub release gets plain-language notes written from the actual changes and a `widgets-pack-<version>.zip` holding `zpack.json`, `dist/`, `docs/assets/`, `README.md`, and `LICENSE`, to unzip into Zebar's folder. The pack can also be published to Zebar's marketplace with `zebar publish` (free, needs a glzr.io API token).
