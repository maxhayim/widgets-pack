# weather — Weather widget

A Braun-style weather station: current temperature (tap to switch °F/°C), conditions, feels-like, humidity, wind, and a five-day high/low range meter.

A cross-platform desktop widget in the Widgets Pack, spun off from the desktop on maxhayim.com. Its code goes in this folder.

Read `../../docs/GUIDE.md` first: platform (Tauri 2, still to confirm), look and feel, what changes when leaving the website, and releases. The site's source is linked from the guide.

## On the site
Search the site's `App.jsx` for: `WeatherWidget`, `useWeather`, `describeWeather`, `WEATHER_HOME`.

## Data
Open-Meteo (free, no key).

## Notes
- Miami by default; a locate button switches to the user's location (rounded to about 1 km).
- Refreshes every 15 minutes.
