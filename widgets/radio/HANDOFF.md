# radio — Radio widget

A pocket radio after the Braun T3: perforated grille, a display, a numbered tuning wheel (click to change station, shift-click or arrow keys to go back), and a power button.

A cross-platform desktop widget in the Widgets Pack, spun off from the desktop on maxhayim.com. Its code goes in this folder.

Read `../../docs/GUIDE.md` first: platform (Tauri 2, still to confirm), look and feel, what changes when leaving the website, and releases. The site's source is linked from the guide.

## On the site
Search the site's `App.jsx` for: `RadioWidget`, `RADIO_STATIONS`, `radioStart` / `radioStop` / `radioTune`, `useNowPlaying`.

## Data
Radio Paradise (main and mellow), KEXP, FIP, FIP Jazz, NTS 1, Galgalatz, Kiss Country 99.9 (WKIS Miami via Audacy), Revolution 93.5 (Miami). Stream URLs are in `RADIO_STATIONS`.

## Notes
- Now-playing is shown for KEXP (api.kexp.org) and NTS (nts.live). Without the browser's limits, more stations' now-playing feeds may be reachable; check each station's terms first.
- SomaFM was dropped on the site because it blocks other websites by referrer. Don't work around that.
- Give the app its own volume; the site routed the radio through its global sound system (`playSound`, `applyMedia`).
- Kiss Country means Miami's WKIS, not WKSF in North Carolina.
