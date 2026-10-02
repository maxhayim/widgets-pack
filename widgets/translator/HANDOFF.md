# translator — Translator widget

Translates between 11 languages, including Hebrew, with a swap button; Enter translates.

A cross-platform desktop widget in the Widgets Pack, spun off from the desktop on maxhayim.com. Its code goes in this folder.

Read `../../docs/GUIDE.md` first: platform (Tauri 2, still to confirm), look and feel, what changes when leaving the website, and releases. The site's source is linked from the guide.

## On the site
Search the site's `App.jsx` for: `TranslatorWidget`, `translateText`, `TRANSLATE_LANGS`.

## Data
On the site: Chrome's on-device Translator API, falling back to MyMemory.

## Notes
- Chrome's on-device translator doesn't exist in a Tauri app. Choose: MyMemory (free; the text leaves the device), a local model (private but large), or a key-based service. Tell the user clearly where their text goes.
