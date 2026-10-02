# clock — Clock widget

A wall clock after the Braun ABW 41: round face, flat black hands, a yellow sweep second hand with a round counterweight. No maker's mark.

A cross-platform desktop widget in the Widgets Pack, spun off from the desktop on maxhayim.com. Its code goes in this folder.

Read `../../docs/GUIDE.md` first: platform (Tauri 2, still to confirm), look and feel, what changes when leaving the website, and releases. The site's source is linked from the guide.

## On the site
Search the site's `App.jsx` for: `ClockWidget`, `AnalogClock`, `clockParts`, `formatTime`.

## Data
None.

## Notes
- Follows the time zone and the 12/24-hour setting.
- On the site, clicking it opens Date & Time; give it its own settings instead (time zone, second hand on or off).
