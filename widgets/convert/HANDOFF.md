# convert — Convert widget

Converts length, weight, volume, speed, area, temperature, and currency.

A cross-platform desktop widget in the Widgets Pack, spun off from the desktop on maxhayim.com. Its code goes in this folder.

Read `../../docs/GUIDE.md` first: platform (Tauri 2, still to confirm), look and feel, what changes when leaving the website, and releases. The site's source is linked from the guide.

## On the site
Search the site's `App.jsx` for: `ConvertWidget`, `UNIT_GROUPS`, `convertTemperature`, `loadRate`.

## Data
Frankfurter (api.frankfurter.dev, European Central Bank rates, about 30 currencies).

## Notes
- Cache rates for an hour, and show the rate's date.
