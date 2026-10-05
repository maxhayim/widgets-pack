# Changelog

All notable changes to Widgets Pack are documented here.

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
