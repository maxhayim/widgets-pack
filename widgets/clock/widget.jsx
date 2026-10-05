import { useMemo } from "react";
import { countries, flagEmoji } from "../../src/shared/flags.js";
import { useHost } from "../../src/shared/host.jsx";
import { ACCENTS, Choice, ColorChoice, isColor } from "../../src/shared/ui.jsx";
import { usePrefs, useShared } from "../../src/shared/store.js";
import { TIME_ZONES, clockParts, formatTime, useClock } from "../../src/shared/time.jsx";

/* Clock: after the Braun ABW 41 wall clock. Flat black hands, yellow sweep hand with a round counterweight.
   An optional name and country flag sit on the face, under the 12; without them, the host's mark (if any). */
const CLOCK_PREFS = {
  key: "clock",
  defaults: { timeZone: "auto", seconds: true, name: "", flag: "", ticker: "" },
  allowed: { timeZone: TIME_ZONES.map((z) => z.id) },
};

function ClockWidget() {
  const now = useClock();
  const [prefs] = usePrefs(CLOCK_PREFS);
  const [shared] = useShared();
  const { clockMark } = useHost();
  const parts = clockParts(now, prefs.timeZone);
  const s = parts.s;
  const m = parts.m + s / 60;
  const h = (parts.h % 12) + m / 60;
  const hand = (deg, length, tail, width, color) => (
    <line x1="100" y1={100 + tail} x2="100" y2={100 - length} stroke={color} strokeWidth={width} transform={`rotate(${deg} 100 100)`} />
  );

  return (
    <section className="widget widget-clock" style={isColor(prefs.ticker) ? { "--w-yellow": prefs.ticker } : undefined} aria-label={`${prefs.name || "Clock"}: ${formatTime(now, shared, prefs.timeZone)}`}>
      <svg viewBox="0 0 200 200" className="block h-full w-full" aria-hidden="true">
        <circle cx="100" cy="100" r="90" fill="var(--w-face)" />
        {Array.from({ length: 60 }, (_, i) =>
          i % 5 === 0 ? null : <line key={i} x1="100" y1="13" x2="100" y2="17" stroke="var(--w-mark)" strokeWidth="1" transform={`rotate(${i * 6} 100 100)`} />,
        )}
        {Array.from({ length: 12 }, (_, i) => {
          const n = i + 1;
          const a = (n * 30 * Math.PI) / 180;
          return (
            <text key={n} x={100 + Math.sin(a) * 72} y={100 - Math.cos(a) * 72} textAnchor="middle" dominantBaseline="central" className="widget-clock-num">
              {n}
            </text>
          );
        })}
        {prefs.flag || prefs.name ? (
          <text x="100" y="62" textAnchor="middle" dominantBaseline="central" className="widget-clock-label">
            {prefs.flag && <tspan className="widget-clock-flag">{flagEmoji(prefs.flag)}</tspan>}
            {prefs.flag && prefs.name ? " " : ""}
            {prefs.name.slice(0, 18)}
          </text>
        ) : clockMark ? (
          <text x="100" y="62" textAnchor="middle" className="widget-clock-brand">
            {clockMark}
          </text>
        ) : null}
        {hand(h * 30, 46, 10, 6, "var(--w-hand)")}
        {hand(m * 6, 70, 12, 4, "var(--w-hand)")}
        {prefs.seconds && (
          <g transform={`rotate(${s * 6} 100 100)`}>
            <line x1="100" y1="124" x2="100" y2="20" stroke="var(--w-yellow)" strokeWidth="1.6" />
            <circle cx="100" cy="122" r="5" fill="var(--w-yellow)" />
          </g>
        )}
        <circle cx="100" cy="100" r="4" fill={prefs.seconds ? "var(--w-yellow)" : "var(--w-hand)"} />
      </svg>
    </section>
  );
}

function ClockSettings() {
  const [prefs, setPrefs] = usePrefs(CLOCK_PREFS);
  const [shared] = useShared();
  const places = useMemo(() => countries(shared.locale), [shared.locale]);
  return (
    <>
      <label className="wp-field">
        name on the face
        <input className="wp-input" value={prefs.name} onChange={(e) => setPrefs({ name: e.target.value.slice(0, 18) })} placeholder="e.g. Home, Office, Mom" maxLength={18} />
      </label>
      <label className="wp-field">
        flag
        <select className="wp-input wp-flag" value={prefs.flag} onChange={(e) => setPrefs({ flag: e.target.value })}>
          <option value="">none</option>
          {places.map((c) => (
            <option key={c.code} value={c.code}>
              {flagEmoji(c.code)} {c.name}
            </option>
          ))}
        </select>
      </label>
      <ColorChoice
        label="second hand"
        value={prefs.ticker}
        onChange={(ticker) => setPrefs({ ticker })}
        presets={[["#f2b200", "yellow"], ...ACCENTS.filter(([c]) => c !== "#f2b200")]}
      />
      <label className="wp-field">
        time zone
        <select className="wp-input" value={prefs.timeZone} onChange={(e) => setPrefs({ timeZone: e.target.value })}>
          {TIME_ZONES.map((z) => (
            <option key={z.id} value={z.id}>
              {z.label}
            </option>
          ))}
        </select>
      </label>
      <Choice
        label="second hand"
        value={prefs.seconds ? "on" : "off"}
        options={[
          ["on", "on"],
          ["off", "off"],
        ]}
        onChange={(v) => setPrefs({ seconds: v === "on" })}
      />
    </>
  );
}

export default { id: "clock", label: "Clock", Widget: ClockWidget, Settings: ClockSettings };
