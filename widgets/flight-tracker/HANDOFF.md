# flight-tracker — Flight Tracker widget

Type a flight number (LY1, AA100, BAW2) to see the airline, route, airports, and distance.

A cross-platform desktop widget in the Widgets Pack, spun off from the desktop on maxhayim.com. Its code goes in this folder.

Read `../../docs/GUIDE.md` first: platform (Tauri 2, still to confirm), look and feel, what changes when leaving the website, and releases. The site's source is linked from the guide.

## On the site
Search the site's `App.jsx` for: `FlightWidget`, `lookupFlight`, `flightCandidates`, `AIRLINE_ICAO`.

## Data
adsbdb (routes); ADS-B Exchange for the live map link.

## Notes
- The site couldn't show live positions because adsb.lol, airplanes.live, and OpenSky block websites. A native app can request them; check each service's terms. Live position, altitude, and progress along the route become possible.
- Ties to Max's Sky and Sea Alert MeshMonitor script.
