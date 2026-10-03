# Widgets Pack

Thirteen Braun-inspired desktop widgets for [Zebar](https://github.com/glzr-io/zebar), on Windows, macOS, and Linux. Warm white plastic in light mode, graphite in dark mode, with an orange accent. Spun off from the desktop on [maxhayim.com](https://maxhayim.com).

| Widget | What it does | Data from |
| --- | --- | --- |
| `clock` | Wall clock after the Braun ABW 41, any time zone | this computer |
| `world-clock` | Three cities at a glance | this computer |
| `calendar` | This month, in your language | this computer |
| `weather` | Now and five days ahead; any city, or near you | [Open-Meteo](https://open-meteo.com/) |
| `radio` | Nine stations on a tuning wheel, after the Braun T3 | the stations' own streams |
| `calculator` | After the Braun ET66; works with the keyboard | this computer |
| `sticky-notes` | Notes in five colors that save as you type | this computer |
| `convert` | Units and currencies | [Frankfurter](https://frankfurter.dev/) (ECB rates) |
| `translator` | Eleven languages | [MyMemory](https://mymemory.translated.net/) |
| `flight-tracker` | A flight's airline and route, with a live map link | [adsbdb](https://www.adsbdb.com/) |
| `stocks` | Up to 8 symbols; crypto without a key | CoinGecko, [Finnhub](https://finnhub.io/) (free key) |
| `mesh` | Your Meshtastic mesh, live from your own MeshMonitor | your MeshMonitor |
| `photo-gallery` | Your photos in a frame, with a large view | this computer |

## Install

1. Install [Zebar](https://github.com/glzr-io/zebar/releases) (free).
2. Put this repo in Zebar's folder, `~/.glzr/zebar/` (on Windows, `%USERPROFILE%\.glzr\zebar\`):
   ```
   git clone https://github.com/maxhayim/widgets-pack ~/.glzr/zebar/widgets-pack
   ```
   Or download the ZIP and unzip it there. The built widgets are included, so there's nothing to build.
3. Restart Zebar, then turn widgets on from its tray icon: **Widget packs → widgets-pack → (a widget)**. Choose **Run on startup** there to keep one.

## Using them

- **Move:** drag a widget anywhere. It snaps to a 16px grid, stays fully on screen, and comes back to the same spot next time (remembered per monitor setup).
- **Settings:** the gear in the bottom-left corner (on hover), or right-click. Each widget has its own settings, plus ones shared by all of them: language, 12 or 24 hours, °F or °C, and light, dark, or automatic.
- **Layer:** in settings, choose whether a widget sits below other windows, normally, or always on top.
- Links (station sites, live flight maps) open in your default browser.

Settings, notes, and photos stay on this computer, in Zebar's storage for this pack. API keys and the MeshMonitor token are kept there too, in plain storage rather than the system keychain, so use a read-only MeshMonitor token.

**Mesh:** in MeshMonitor, add `http://127.0.0.1:6124` (the address Zebar serves widgets from) to `ALLOWED_ORIGINS`.

## Changing them

Needs [Node.js](https://nodejs.org/). See [`docs/GUIDE.md`](docs/GUIDE.md).

```
npm install
npm run build     # or: npm run dev, to rebuild on every save
```

Then reload the widget from Zebar's tray menu. Commit `dist/` along with your changes, since Zebar runs the built files.

MIT licensed.
