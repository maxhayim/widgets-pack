import { mountWidget } from "../../src/shared/shell.jsx";
import { usePrefs, useShared } from "../../src/shared/store.js";
import { AnalogClock, TIME_ZONES, formatTime, useClock } from "../../src/shared/time.jsx";

/* World Clock: three cities at a glance */
const CITIES = TIME_ZONES.filter((z) => z.id !== "auto");
const WORLD_PREFS = {
  key: "world-clock",
  defaults: { a: "Asia/Jerusalem", b: "Europe/London", c: "Asia/Tokyo" },
  allowed: Object.fromEntries(["a", "b", "c"].map((k) => [k, CITIES.map((z) => z.id)])),
};
const cityName = (zone) => (CITIES.find((z) => z.id === zone)?.label || zone).split(" · ").pop();

function dayOffset(now, zone) {
  const local = new Date(now.toLocaleString("en-US"));
  const there = new Date(now.toLocaleString("en-US", { timeZone: zone }));
  const days = Math.round((new Date(there.toDateString()) - new Date(local.toDateString())) / 86400000);
  return days > 0 ? "tomorrow" : days < 0 ? "yesterday" : "today";
}

function WorldClockWidget() {
  const now = useClock();
  const [world] = usePrefs(WORLD_PREFS);
  const [shared] = useShared();
  const zones = [world.a, world.b, world.c];
  return (
    <section className="widget widget-world px-3 pb-3.5 pt-3" aria-label={`World clock: ${zones.map((z) => `${cityName(z)} ${formatTime(now, shared, z)}`).join(", ")}`}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]">world clock</div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center">
        {zones.map((zone, i) => (
          <div key={`${zone}-${i}`} className="flex min-w-0 flex-col items-center">
            <AnalogClock now={now} timeZone={zone} className="h-[50px] w-[50px]" />
            <span className="mt-1.5 w-full truncate text-[11px] font-semibold">{cityName(zone)}</span>
            <span className="text-[10.5px] tabular-nums text-[var(--os-ink-2)]" dir="auto">
              {formatTime(now, shared, zone)}
            </span>
            <span className="text-[9.5px] text-[var(--os-ink-3)]">{dayOffset(now, zone)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorldClockSettings() {
  const [world, setWorld] = usePrefs(WORLD_PREFS);
  return ["a", "b", "c"].map((slot, i) => (
    <label key={slot} className="wp-field">
      city {i + 1}
      <select className="wp-input" value={world[slot]} onChange={(e) => setWorld({ [slot]: e.target.value })}>
        {CITIES.map((z) => (
          <option key={z.id} value={z.id}>
            {z.label}
          </option>
        ))}
      </select>
    </label>
  ));
}

mountWidget({ id: "world-clock", label: "World Clock", Widget: WorldClockWidget, Settings: WorldClockSettings });
