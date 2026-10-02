# world-clock — World Clock widget

Three cities with small analog clocks, local times, and whether it's yesterday, today, or tomorrow there.

A cross-platform desktop widget in the Widgets Pack, spun off from the desktop on maxhayim.com. Its code goes in this folder.

Read `../../docs/GUIDE.md` first: platform (Tauri 2, still to confirm), look and feel, what changes when leaving the website, and releases. The site's source is linked from the guide.

## On the site
Search the site's `App.jsx` for: `WorldClockWidget`, `WORLD_PREFS`, `TIME_ZONES`, `dayOffset`.

## Data
None.

## Notes
- Defaults: Tel Aviv, London, Tokyo. Let the user choose from any IANA time zone, not just the site's 13-city list.
