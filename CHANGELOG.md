# Changelog

All notable changes to Widgets Pack are documented here.

## [1.4.3] - 2026-10-05

### Added
- **Pack logo:** first of the pack's preview images in `zpack.json` (shown in Zebar's marketplace), before the screenshot.
- **Widget icon:** every widget page uses a 256px copy of the logo as its icon (seen when a widget is opened in a browser).

## [1.4.2] - 2026-10-05

### Added
- **Photo Gallery settings:** every photo as a thumbnail you can remove, plus **add…**. Works with the pack's own photos and with a host's `photos`.
- **Radio "muted" and "turn sound on":** a host's `sound` can offer `useMuted()` (a hook) and `unmute()`. While the radio plays with the page's sound muted, it says **muted**, its light stays off, and a **turn sound on** link calls `unmute()`.

## [1.4.1] - 2026-10-05

### Added
- **Radio controls for web pages:** `useRadio()` (`{ status, stream }`), `stopRadio()`, and `toggleRadio()`. The radio keeps playing when its widget is unmounted, so a page can now stop it from outside: a keyboard shortcut, its own music player starting, another user signing in, or the Radio widget being removed. `toggleRadio()` turns it on with the mounted Radio widget's station.
- **Host time zone:** `useShared()` can carry an optional `timeZone` (an IANA zone or `"auto"`), and the Clock's "automatic" time zone follows it. Zebar's shared settings have none, so the Zebar Clock is unchanged.

## [1.4.0] - 2026-10-05

### Added
- **The widgets as a library for web pages** (`lib/index.js`, plus `widgets-pack/widgets.css`). Install with `npm install github:maxhayim/widgets-pack#v1.4.0`; React 19 is a peer dependency, and nothing from Zebar or Tauri is included.
- **The host** (`<WidgetHost host={...}>`): storage, links, location, language and units, sound, photos, the clock's mark, and the address MeshMonitor allows all come from where the widgets run. Anything left out uses a plain-browser default. See the guide.
- **Clock mark:** with no name or flag, the clock shows the host's mark, if it has one.

### Changed
- Each widget is now `widget.jsx` (the widget) plus a two-line `main.jsx` that starts it in Zebar.
- Widget styles moved to `src/shared/widgets.css`, plain CSS a web page can import.
- The radio is one player for the whole page, so it keeps playing when a widget moves.
- `package.json`: Zebar, Tauri, and react-dom are development-only now.

### Fixed
- **Live data in Zebar:** Zebar kept every API answer for a week (the `caching` setting), so weather, exchange rates, prices, flights, mesh numbers, and now-playing could be days old. API answers are now kept for 0 seconds; only Google Fonts are kept for a week.
- **The radio plays in Zebar:** Zebar's cache stores each answer whole before passing it on, so a live stream never started. Audio now plays in a hidden frame outside the cache. Adding your own stations tests them the same way.

## [1.3.0] - 2026-10-05

### Added
- **Colors** in settings, from Braun-palette swatches or any color from the system picker; "default" goes back to the original.
  - **Calendar:** the accent (month name and today's circle) and the case color. On a custom case, text switches between dark and light to stay readable.
  - **Clock:** the second hand.
  - **World Clock:** the second hands.
  - **Weather:** the accent (temperature bars and locate button).

## [1.2.0] - 2026-10-05

### Added
- **Your own radio streams** (Radio settings → your stations): a name and a direct stream address. The stream is tried first; addresses that can't play (web pages, playlists, wrong hosts) are turned away. The dial holds 16 stations, and its numbers shrink to fit past 12.
- **Clock name and flag:** an optional name (up to 18 characters) and a country flag on the face, under the 12. Flags come from a bundled Twemoji font on Windows, which has no flag emoji.

### Changed
- The Radio remembers its station by name rather than position, so adding or removing stations never changes the one playing. The station picked in v1.1.0 or earlier resets to Radio Paradise once.
- README: data sources and design credits are listed one per line with links; "your computer" and "your MeshMonitor" link to their local addresses.

## [1.1.0] - 2026-10-05

### Added
- **Screenshot** of all thirteen widgets, at the top of the README and as the pack's preview image in `zpack.json`.
- **Release downloads:** each release has a `widgets-pack-<version>.zip` to unzip into Zebar's folder, no git needed.
- **Community files:** `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md`.

### Changed
- README rewritten: widget table, install and update steps, privacy notes, repository layout, and versioning.

## [1.0.1] - 2026-10-02

### Fixed
Found by running the pack inside Zebar 3.3.1 on macOS.
- **Text sizes:** Zebar adds its own `normalize.css` to every widget, outside any cascade layer, so it overrode the widgets' font sizes on buttons and inputs. The widgets now remove it; Tailwind's preflight does the same job.
- **Drop-downs** used the large native macOS style and cut off text like "English". They now look the same on every system, with a small chevron.
- **Settings gear and credits** showed all the time, because WebKit reported the pointer over windows it never entered. They now show while the widget is the active window (after a click on it). Right-click opens settings at any time.

## [1.0.0] - 2026-10-02

### Added
- **Thirteen widgets as one Zebar widget pack:** Clock, World Clock, Calendar, Weather, Radio, Calculator, Sticky Notes, Convert, Translator, Flight Tracker, Stocks, Mesh, and Photo Gallery.
- **Drag anywhere:** snaps to a 16px grid, stays on screen, and is remembered per monitor setup.
- **Settings side** on every widget (gear or right-click), with shared settings for language, 12/24 hours, °F/°C, and light/dark/auto.
- **Layer** per widget: below other windows, normal, or always on top.
- **Window fitting:** each window is always exactly the size of its widget.
- Weather city search (Open-Meteo) and "near me" from Zebar's IP location.
- Photo Gallery large view, which grows the widget's window.
- Links open in the default browser through Zebar's shell privileges, limited to `open`, `xdg-open`, and `explorer` with one https URL.
