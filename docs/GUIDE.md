# Widgets Pack — developer guide

The pack is one [Zebar](https://github.com/glzr-io/zebar) widget pack (`zpack.json` at the repo root) holding every widget. Zebar is a free, open-source host for desktop widgets on Windows, macOS, and Linux; each widget is a small frameless, transparent window running a web page.

The widgets started as the desktop widgets on [maxhayim.com](https://maxhayim.com). Their original code is the site's source at v2.16.3 (commit 2f12bef): [`App.jsx`](https://github.com/maxhayim/maxhayim.github.io/blob/2f12befddf1075111af43c3fd26b4b7c261df78b/src/App.jsx) and [`index.css`](https://github.com/maxhayim/maxhayim.github.io/blob/2f12befddf1075111af43c3fd26b4b7c261df78b/src/index.css).

## Layout

```
zpack.json            the 13 widgets: window options, default placement, allowed programs, caching
widgets/<name>/
  widget.jsx          the widget: export default { id, label, Widget, Settings? }
  main.jsx            starts it as a Zebar widget (two lines)
  index.html          the Zebar page
widgets/index.js      every widget, for the library
src/shared/
  host.jsx            the host: everything a widget needs from where it runs, with plain-browser defaults
  shell.jsx           Zebar only: the frame (drag, settings side, window fitting) and the Zebar host
  desktop.js          Zebar only: the window, links, IP location
  frame-audio.js      Zebar only: audio played outside Zebar's cache
  ui.jsx              small shared UI (choices, colors, links); no Zebar
  store.js            settings storage (through the host) and the shared settings
  time.jsx            time zones, formatting, the small analog clock
  widgets.css         every widget and settings style, as plain CSS
  theme.css           Zebar pages: fonts, Tailwind, the --os-* tokens, and widgets.css
src/lib/index.js      the library entry
dist/                 the build Zebar runs (committed)
lib/                  the library web pages install (committed)
```

Stack: React 19, Tailwind 4, lucide-react, built by Vite: `npm run build` makes both `dist/` (Zebar) and `lib/` (web pages). Each widget is `{ id, label, Widget, Settings? }` in `widget.jsx`; Zebar starts it with `mountWidget`, and a web page renders `Widget` and `Settings` itself. `Settings` appears above the shared settings.

## How the frame works

- **Window size:** a `ResizeObserver` on the widget sets the window to exactly its size (plus 12px around for the shadow). `zpack.json` heights are only a first guess.
- **Drag:** Zebar widgets can't use Tauri's built-in window drag, so a pointer drag moves the window with `setPosition`. A press that moves less than 4px stays a click. On release it snaps to 16px and is kept on its monitor, and the spot is saved per monitor layout.
- **Settings side:** gear on hover or right-click. The widget stays mounted underneath, so a playing radio keeps playing.
- **Layer:** `setZOrder` with `normal`, `top_most`, or `bottom_most`, saved per widget.
- **Links:** `openUrl` runs `open` (macOS), `xdg-open` (Linux), or `explorer` (Windows) through Zebar's `shellExec`. `zpack.json` allows only those programs, and only with a single https URL.
- **Storage:** Zebar gives each pack its own browser storage, served from `http://127.0.0.1:6124`. Keys are prefixed `widgets-pack:`. Photos are in IndexedDB (`widgets-pack-photos`).
- **Location:** the weather's "near me" uses Zebar's `ip` provider (city level, no permission prompt) instead of browser geolocation, which web views often don't offer.
- **Zebar's cache:** Zebar sends every outside request through a service worker that keeps each answer for the `caching` time in `zpack.json`. API answers are kept for 0 seconds so data stays live; only Google Fonts are kept for a week. The worker stores each answer whole before passing it on, so a live radio stream would never start: the Zebar host plays audio in a hidden `data:` frame, which the worker doesn't control (`frame-audio.js`).

## Using the widgets on a web page

The pack is also a library. Install it from a release:

```
npm install github:maxhayim/widgets-pack#v1.4.1
```

```jsx
import { WidgetHost, clock, weather } from "widgets-pack";
import "widgets-pack/widgets.css";

<WidgetHost host={{ clockMark: "", locate: myLocate, useShared: useMyLanguageAndUnits }}>
  <clock.Widget />
  <clock.Settings />
</WidgetHost>
```

`WIDGETS` lists every widget as `{ id, label, Widget, Settings? }`. Stocks and Mesh take an `openSettings` prop. React 19 is a peer dependency; the library imports nothing else from the page.

The page also needs:
- **Tailwind 4** scanning the library, because the widgets use Tailwind classes: `@source "../node_modules/widgets-pack/lib";` (the path from your CSS file).
- **These color tokens**, for light and dark: `--os-case`, `--os-card`, `--os-ink`, `--os-ink-2`, `--os-ink-3`, `--os-line`, `--os-hover`, `--os-accent`, `--os-ok`, `--os-warn`, `--os-knob-top`, `--os-knob-bot`, and `--os-shadow`. See `src/shared/theme.css` for the pack's values.
- Optionally `--font-sans`; otherwise the widgets use Instrument Sans, then Helvetica.

### The host

Everything a widget needs from where it runs comes from the host. Anything you leave out uses the plain-browser default (`browserHost` in `host.jsx`):

| Field | What it is | Default |
| --- | --- | --- |
| `storage` | `{ get(key), set(key, value \| null), subscribe?(key, onChange) }`, strings by key | `localStorage`, keys prefixed `widgets-pack:` |
| `openUrl(url)` | opens a link | https links in a new tab |
| `locate()` | resolves to `{ name, lat, lon }` | browser geolocation, rounded to about a kilometer |
| `useShared` | a hook returning `[{ locale, temperature, clock, theme, timeZone? }, update]`; `timeZone` (an IANA zone or `"auto"`) is what the Clock's "automatic" time zone follows | the pack's own shared settings |
| `sound` | `{ attach(audio), detach(audio), openSettings?() }`; the host sets volume and mute | none: the radio's own volume slider |
| `createAudio()` | makes the radio's audio element | `new Audio()` |
| `photos` | `{ usePhotos(), add(files), remove(id) }` | the pack's own IndexedDB store |
| `clockMark` | text on the clock face when it has no name or flag | none |
| `origin` | the address MeshMonitor has to allow | the page's own |

`useShared` and `photos.usePhotos` are hooks: pass the same function for the whole time the page is open. The radio is one player for the whole page, so it keeps playing if a widget is unmounted and mounted elsewhere.

### Radio controls

The radio keeps playing when its widget is unmounted, so a page can control it from outside:

```jsx
import { useRadio, stopRadio, toggleRadio } from "widgets-pack";

const { status } = useRadio(); // "off" | "tuning" | "on" | "error"; also `stream`
stopRadio();   // e.g. when your CD player starts, another user signs in, or the Radio widget is removed
toggleRadio(); // a keyboard shortcut: on with the mounted Radio widget's station, or off
```

`toggleRadio()` can only turn the radio on while a Radio widget is mounted, since the widget knows the station and volume.

## Adding a widget

1. Make `widgets/<name>/index.html` and `main.jsx` (copy another widget's), and `widget.jsx`, ending with `export default { id: "<name>", label, Widget, Settings }`.
2. Add it to `zpack.json` and `widgets/index.js`.
3. Import UI from `src/shared/ui.jsx` and anything about where it runs from the host (`useHost()`), never from `shell.jsx` or `desktop.js`.
4. `npm run build`, commit `dist/` and `lib/`, and reload Zebar's widget packs.

Keep to the look: 196px wide, 26px corners, `--os-*` and `--w-*` tokens from `theme.css`, light and dark both. Before adding a radio station, check it plays in an `<audio>` element from a normal web page and that the broadcaster allows playback from other sites. Never work around a service that deliberately blocks other sites.

## Releases

Semver, in `package.json` and `zpack.json`, with an entry in `CHANGELOG.md` and the README's Versioning list. Each GitHub release gets a tag (web pages install by tag), plain-language notes written from the actual changes and a `widgets-pack-<version>.zip` holding `zpack.json`, `dist/`, `docs/assets/`, `README.md`, and `LICENSE`, to unzip into Zebar's folder. The pack can also be published to Zebar's marketplace with `zebar publish` (free, needs a glzr.io API token).
