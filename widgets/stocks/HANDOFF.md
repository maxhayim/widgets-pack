# stocks — Stocks widget

A watchlist of up to 8 symbols with price and daily change in green or red.

A cross-platform desktop widget in the Widgets Pack, spun off from the desktop on maxhayim.com. Its code goes in this folder.

Read `../../docs/GUIDE.md` first: platform (Tauri 2, still to confirm), look and feel, what changes when leaving the website, and releases. The site's source is linked from the guide.

## On the site
Search the site's `App.jsx` for: `StocksWidget`, `StocksSettings`, `loadQuotes`, `CRYPTO_IDS`.

## Data
CoinGecko (crypto, no key) and Finnhub (stocks, the user's own free key).

## Notes
- Keep the Finnhub key in the OS keychain.
- A native app may be able to use keyless quote sources the browser blocked; check their terms.
