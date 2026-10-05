import { useHost } from "./host.jsx";

/* The small UI pieces widgets share. Nothing here touches Zebar or the desktop, so web pages can use them too. */

// A small segmented control
export function Choice({ label, value, options, onChange }) {
  return (
    <div className="wp-field" role="radiogroup" aria-label={label}>
      {label}
      <div className="flex gap-1">
        {options.map(([id, text]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            onClick={() => onChange(id)}
            className={`wp-btn flex-1 px-1 ${value === id ? "wp-btn-main" : ""}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

// Opens in the default browser rather than inside the widget
export function ExternalLink({ href, className, children, ...rest }) {
  const { openUrl } = useHost();
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        openUrl(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

/* Colors a widget can be given: Braun-palette swatches, or any color from the system picker. "" means the default. */
export const isColor = (value) => /^#[0-9a-f]{6}$/i.test(value || "");

export const ACCENTS = [
  ["#e8591a", "orange"],
  ["#f2b200", "yellow"],
  ["#c8371a", "red"],
  ["#3f7f33", "green"],
  ["#46687a", "blue"],
  ["#7a5aa6", "violet"],
  ["#262624", "black"],
];

export const CASES = [
  ["#f3f1ec", "warm white"],
  ["#201f1d", "graphite"],
  ["#e8591a", "orange"],
  ["#f2b200", "yellow"],
  ["#8a9a6b", "olive"],
  ["#5d7f93", "blue"],
  ["#d9d4c7", "stone"],
];

export function ColorChoice({ label, value, onChange, presets = ACCENTS }) {
  const current = isColor(value) ? value.toLowerCase() : "";
  const isCustom = current && !presets.some(([c]) => c === current);
  return (
    <div className="wp-field" role="radiogroup" aria-label={label}>
      {label}
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" role="radio" aria-checked={!current} onClick={() => onChange("")} className={`wp-btn px-2 py-0.5 ${!current ? "wp-btn-main" : ""}`}>
          default
        </button>
        {presets.map(([color, name]) => (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={current === color}
            aria-label={name}
            title={name}
            onClick={() => onChange(color)}
            className={`wp-swatch ${current === color ? "wp-swatch-on" : ""}`}
            style={{ background: color }}
          />
        ))}
        <label className={`wp-swatch wp-swatch-custom ${isCustom ? "wp-swatch-on" : ""}`} title="Any color" style={isCustom ? { background: current } : undefined}>
          <input type="color" value={current || "#e8591a"} onChange={(e) => onChange(e.target.value)} className="sr-only" aria-label={`${label}: any color`} />
        </label>
      </div>
    </div>
  );
}

// Style for a widget case in any color, with text that stays readable on it
export function caseStyle(color) {
  if (!isColor(color)) return undefined;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const dark = 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.3;
  const ink = dark ? "#eeebe4" : "#262624";
  return {
    "--w-case": color,
    "--os-ink": ink,
    "--os-ink-2": `color-mix(in oklab, ${ink} 80%, ${color})`,
    "--os-ink-3": `color-mix(in oklab, ${ink} 60%, ${color})`,
    "--w-line": `color-mix(in oklab, ${ink} 18%, ${color})`,
    "--os-hover": `color-mix(in oklab, ${ink} 8%, transparent)`,
  };
}
