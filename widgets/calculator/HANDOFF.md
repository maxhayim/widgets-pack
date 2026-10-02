# calculator — Calculator widget

A working calculator after the Braun ET66 (Dieter Rams and Dietrich Lubs): dark body, round keys, a yellow equals key, and a grey LCD.

A cross-platform desktop widget in the Widgets Pack, spun off from the desktop on maxhayim.com. Its code goes in this folder.

Read `../../docs/GUIDE.md` first: platform (Tauri 2, still to confirm), look and feel, what changes when leaving the website, and releases. The site's source is linked from the guide.

## On the site
Search the site's `App.jsx` for: `CalculatorWidget`, `calcStep`, `formatCalc`, `CALC_KEYS`.

## Data
None.

## Notes
- Left-to-right pocket-calculator math (2 + 3 × 4 = 20); percent works as on a real calculator (50 × 10 % = 5, 200 + 10 % = 220).
- Full keyboard support; Escape clears.
