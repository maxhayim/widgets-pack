import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";
import flagFont from "country-flag-emoji-polyfill/dist/TwemojiCountryFlags.woff2?url";

/* Country flags as emoji. Windows has no flag emoji, so there they come from a bundled Twemoji font
   (only loaded where it's needed). Use the `wp-flag` class, or put "Twemoji Country Flags" first in a font stack. */
polyfillCountryFlagEmojis("Twemoji Country Flags", flagFont);

export const flagEmoji = (code) =>
  /^[A-Z]{2}$/.test(code || "") ? String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "";

// Every country and territory the system can name, sorted by name in the given language
const NOT_PLACES = new Set(["EU", "EZ", "UN", "QO", "XA", "XB", "ZZ"]);
export function countries(locale) {
  let names;
  try {
    names = new Intl.DisplayNames([locale, "en"], { type: "region", fallback: "none" });
  } catch {
    return [];
  }
  const list = [];
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      if (NOT_PLACES.has(code)) continue;
      const name = names.of(code);
      if (name && name !== code) list.push({ code, name });
    }
  }
  return list.sort((x, y) => x.name.localeCompare(y.name, locale));
}
