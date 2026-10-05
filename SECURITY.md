# Security Policy

Widgets Pack keeps some sensitive settings on your computer, so treat them carefully.

## Do not publish

Do not include any of the following in GitHub issues, pull requests, screenshots, or example logs:

- Finnhub API keys or MeshMonitor API tokens
- MeshMonitor addresses that aren't meant to be public
- Private mesh node names, IDs, locations, or messages
- Your location or internet address
- Personal photos

## Where things are kept

- Settings, notes, photos, the Finnhub key, and the MeshMonitor token are kept in Zebar's browser storage for this pack, on your computer. They are not encrypted and not in the system keychain, because Zebar widgets can't reach it.
- Use a **read-only** MeshMonitor token.
- Removing the pack from `~/.glzr/zebar/` may not clear that storage. Disconnect in the Mesh widget's settings and clear the Finnhub key first.

## Shell privileges

Zebar runs only the programs a widget pack allows. `zpack.json` allows `open` (macOS), `xdg-open` (Linux), and `explorer` (Windows), and only when the whole argument is a single `https://` URL. Pull requests that widen this will not be accepted without a clear reason.

## Reporting a vulnerability

For security-sensitive reports, contact the repository owner privately through an appropriate GitHub contact method instead of opening a public issue.
