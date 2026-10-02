# photo-gallery — Photo Gallery widget

The user's own photos in a frame, changing every 20 seconds; click for a full-screen gallery with a thumbnail strip and arrow keys.

A cross-platform desktop widget in the Widgets Pack, spun off from the desktop on maxhayim.com. Its code goes in this folder.

Read `../../docs/GUIDE.md` first: platform (Tauri 2, still to confirm), look and feel, what changes when leaving the website, and releases. The site's source is linked from the guide.

## On the site
Search the site's `App.jsx` for: `PhotosWidget`, `PhotoGalleryViewer`, `savePictureFile`, `shrinkImage`.

## Data
The user's own pictures.

## Notes
- On the site, photos were shrunk to 1200 px and kept in IndexedDB. In the app, point it at a folder, or copy chosen photos into the app's data folder.
- Nothing is uploaded anywhere.
