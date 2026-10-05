<p align="center">
  <img src="docs/assets/logo.png" alt="widgets pack" width="200"/>
  <img src="docs/assets/screenshot.png" alt="All thirteen widgets on a desktop" width="760"/>
</p>
<p align="center">
  <a href="https://github.com/glzr-io/zebar">
    <img src="https://img.shields.io/badge/Zebar-3.x-orange" alt="Zebar 3.x">
  </a>
  <img src="https://img.shields.io/badge/Platforms-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey" alt="Windows, macOS, Linux">
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
  </a>
</p>

# 🧩 Widgets Pack

Thirteen Braun-inspired desktop widgets for [**Zebar**](https://github.com/glzr-io/zebar), on **Windows, macOS, and Linux**. Warm white plastic in light mode, graphite in dark mode, with an orange accent. See them live on [maxhayim.com](https://maxhayim.com).

This repository contains:
- **zpack.json** — the Zebar widget pack: all 13 widgets, their window options, default placement, and allowed programs
- **dist/** — the built widgets Zebar runs (included, so there's nothing to build)
- **widgets/** and **src/** — the source: React 19 and Tailwind 4, built with Vite
- **lib/** — the same widgets as a library for web pages (see [docs/GUIDE.md](docs/GUIDE.md#using-the-widgets-on-a-web-page))
- **docs/** — the developer guide and the screenshot

---

## The widgets

| Widget | What it does | Data from |
| --- | --- | --- |
| **Clock** | Wall clock after the Braun ABW 41, any time zone, with your own name and country flag on the face | [your computer](http://localhost) |
| **World Clock** | Three cities at a glance | [your computer](http://localhost) |
| **Calendar** | This month, in your language | [your computer](http://localhost) |
| **Weather** | Now and five days ahead; any city, or near you | [Open-Meteo](https://open-meteo.com/) |
| **Radio** | Nine stations on a tuning wheel, after the Braun T3, plus your own streams | the stations' own streams |
| **Calculator** | After the Braun ET66; works with the keyboard | [your computer](http://localhost) |
| **Sticky Notes** | Notes in five colors that save as you type | [your computer](http://localhost) |
| **Convert** | Units and currencies | [Frankfurter](https://frankfurter.dev/) (ECB rates) |
| **Translator** | Eleven languages | [MyMemory](https://mymemory.translated.net/) |
| **Flight Tracker** | A flight's airline and route, with a live map link | [adsbdb](https://www.adsbdb.com/) |
| **Stocks** | Up to 8 symbols; crypto without a key | CoinGecko, [Finnhub](https://finnhub.io/) (free key) |
| **Mesh** | Your mesh, live from your own [MeshMonitor](https://github.com/Yeraze/MeshMonitor) | [your MeshMonitor](http://localhost:8080) |
| **Photo Gallery** | Your photos in a frame, with a large view | [your computer](http://localhost) |

Design goals:
- One look across every widget, in light and dark
- Free data sources only; no accounts needed except an optional Finnhub key
- Settings, notes, and photos stay on your computer
- Nothing to build or install beyond Zebar

---

## Installing

1. Install [Zebar](https://github.com/glzr-io/zebar/releases) (free).
2. Put the pack in Zebar's folder, `~/.glzr/zebar/` (on Windows, `%USERPROFILE%\.glzr\zebar\`). Either:
   - download `widgets-pack-<version>.zip` from the [latest release](https://github.com/maxhayim/widgets-pack/releases/latest) and unzip it there, or
   - clone it:
     ```
     git clone https://github.com/maxhayim/widgets-pack ~/.glzr/zebar/widgets-pack
     ```
3. Restart Zebar. From its tray icon, open **Widget packs → widgets-pack** and turn on the widgets you want. Choose **Run on startup** to keep them.

### Updating

Download the new release ZIP over the old folder, or run `git pull` in `~/.glzr/zebar/widgets-pack`. Then restart Zebar.

---

## Using them

- **Move:** drag a widget anywhere. It snaps to a 16px grid, stays fully on screen, and comes back to the same spot next time (remembered per monitor setup).
- **Settings:** right-click a widget, or click it and use the gear in its bottom-left corner. Each widget has its own settings, plus ones shared by all of them: language, 12 or 24 hours, °F or °C, and light, dark, or automatic.
- **Layer:** in settings, choose whether a widget sits below other windows, normally, or always on top.
- **Links** (station sites, live flight maps) open in your default browser.

### Mesh

In MeshMonitor, create an API token (a read-only user is plenty) and add `http://127.0.0.1:6124` to `ALLOWED_ORIGINS`. That's the address Zebar serves widgets from. Then enter the address and token in the Mesh widget's settings.

### Radio

To add your own station, open the Radio's settings and enter a name and the stream's direct address (often ending in `/stream`, `.mp3`, or `.aac`, not a `.pls` or `.m3u` playlist or a web page). The pack tries the stream first and turns away addresses that can't play. The dial holds 16 stations in all.

### Clock

In the Clock's settings, give it a name (Home, Office, Mom…) and a country flag. They sit on the face under the 12. Flags show on Windows too, from a bundled font.

### Colors

In settings, pick from Braun-palette swatches or any color:
- **Calendar:** the month name and today's circle, and the case (text switches between dark and light to stay readable)
- **Clock** and **World Clock:** the second hand
- **Weather:** the temperature bars and locate button

### Stocks

Crypto (BTC, ETH, SOL…) works without a key. For stock prices, get a [free Finnhub key](https://finnhub.io/register) and add it in the Stocks widget's settings.

---

## Privacy

- Settings, notes, and photos are kept in Zebar's storage for this pack, on this computer. Nothing is uploaded.
- The Finnhub key and MeshMonitor token are kept there too, in plain storage rather than the system keychain. Use a read-only MeshMonitor token.
- The weather's "near me" uses your internet address for a city-level location. It's off until you press the locate button.
- Widgets can run only `open`, `xdg-open`, or `explorer`, and only with a single https link, to open pages in your browser.

---

## Repository layout

```
zpack.json            the 13 widgets for Zebar
dist/                 the built widgets for Zebar (committed)
lib/                  the widgets as a library for web pages (committed)
widgets/<name>/       one widget: widget.jsx, plus main.jsx + index.html for Zebar
src/shared/           the host, the Zebar frame, settings storage, time helpers, and the look
docs/GUIDE.md         developer guide
docs/assets/          screenshot
```

---

## Changing them

Needs [Node.js](https://nodejs.org/). See [docs/GUIDE.md](docs/GUIDE.md).

```
npm install
npm run build     # or: npm run dev, to rebuild on every save
```

Then restart Zebar. Commit `dist/` and `lib/` along with your changes, since Zebar and web pages use the built files.

---

## Versioning

This project follows semantic versioning.

- **v1.4.0** — the widgets as a library for web pages; live data and a working radio inside Zebar
- **v1.3.0** — choose colors: the Calendar's accent and case, the Clock and World Clock second hands, and the Weather bars
- **v1.2.0** — add your own radio streams; a name and country flag on the Clock
- **v1.1.0** — screenshot, release downloads, contributing, code of conduct, and security policy
- **v1.0.1** — fixes found running inside Zebar: text sizes, drop-downs, and the settings gear
- **v1.0.0** — the thirteen widgets as a Zebar widget pack

See [CHANGELOG.md](CHANGELOG.md) for details.

---

## License

This project is licensed under the MIT License.

See the [LICENSE](LICENSE) file for details.  
Full license text: https://opensource.org/licenses/MIT

---

## Contributing

Pull requests are welcome. Open an issue first to discuss ideas or report bugs. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## Acknowledgments

* [Zebar](https://github.com/glzr-io/zebar) by glzr.io
* [MeshMonitor](https://github.com/Yeraze/MeshMonitor) built by [Yeraze](https://github.com/Yeraze)
* Design after the work of [Dieter Rams](https://en.wikipedia.org/wiki/Dieter_Rams) and [Dietrich Lubs](https://en.wikipedia.org/wiki/Dietrich_Lubs) at [Braun](https://www.braun.com/)
* Country flags on Windows: [Twemoji Country Flags](https://github.com/talkjs/country-flag-emoji-polyfill)

Data from:
* [Open-Meteo](https://open-meteo.com/) — weather forecasts and city search
* [Frankfurter](https://frankfurter.dev/) — European Central Bank exchange rates
* [MyMemory](https://mymemory.translated.net/) — translations
* [adsbdb](https://www.adsbdb.com/) — flight routes
* [CoinGecko](https://www.coingecko.com/) — crypto prices
* [Finnhub](https://finnhub.io/) — stock prices
