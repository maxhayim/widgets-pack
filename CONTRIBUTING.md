# Contributing

Contributions are welcome.

## Before opening a pull request

1. Open an issue describing the proposed change or bug.
2. Keep to the look: 196px wide, 26px corners, the `--os-*` and `--w-*` tokens in `src/shared/theme.css`, and both light and dark modes.
3. Use free data sources that allow requests from other sites. Never work around a service that deliberately blocks other sites (for example by stripping the referrer).
4. Before adding a radio station, check that it plays in an `<audio>` element from a normal web page and that the broadcaster allows playback from other sites.
5. Keep settings, notes, and photos on the user's computer. Don't send them anywhere.
6. Don't widen the shell privileges in `zpack.json` beyond opening https links.
7. Run `npm run build` and commit `dist/` with your changes, since Zebar runs the built files.
8. Test inside Zebar, not only in a browser. Zebar's web views differ (for example, its injected `normalize.css`).
9. Do not include API keys, MeshMonitor tokens, node data, or personal photos in commits or screenshots.

## Pull requests

Include:
- A concise description of the change
- Which widgets it affects
- How it was tested, and on which systems (Windows, macOS, Linux)
- Screenshots in light and dark mode for visual changes
