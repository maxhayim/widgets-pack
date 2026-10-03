import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, LocateFixed, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { approximateLocation } from "../../src/shared/desktop.js";
import { ExternalLink, mountWidget } from "../../src/shared/shell.jsx";
import { useShared, useStored } from "../../src/shared/store.js";

/* Weather: a Braun-style weather station. Miami until you pick a city; the locate button switches to roughly
   where this computer is. Forecasts and city search come from Open-Meteo. */
const WEATHER_HOME = { name: "Miami", lat: 25.7617, lon: -80.1918 };
const WEATHER_REFRESH_MS = 15 * 60 * 1000;

const validPlace = (p) => p && typeof p.name === "string" && Number.isFinite(p.lat) && Number.isFinite(p.lon);

// WMO weather codes, as Open-Meteo reports them
function describeWeather(code, day = true) {
  if (code === 0) return { label: day ? "Clear" : "Clear night", Icon: day ? Sun : Moon };
  if (code === 1) return { label: "Mostly clear", Icon: day ? Sun : Moon };
  if (code === 2) return { label: "Partly cloudy", Icon: day ? CloudSun : CloudMoon };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if (code === 45 || code === 48) return { label: "Fog", Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Drizzle", Icon: CloudDrizzle };
  if (code >= 61 && code <= 67) return { label: "Rain", Icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: "Snow", Icon: CloudSnow };
  if (code >= 80 && code <= 82) return { label: "Showers", Icon: CloudRain };
  if (code === 85 || code === 86) return { label: "Snow showers", Icon: CloudSnow };
  if (code >= 95) return { label: "Thunderstorms", Icon: CloudLightning };
  return { label: "—", Icon: Cloud };
}

function useWeather(place, unit) {
  const key = `${place.lat},${place.lon},${unit}`;
  const [state, setState] = useState({ data: null, error: false, key });
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const params = new URLSearchParams({
        latitude: place.lat.toFixed(3),
        longitude: place.lon.toFixed(3),
        current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
        daily: "weather_code,temperature_2m_max,temperature_2m_min",
        forecast_days: "5",
        timezone: "auto",
        temperature_unit: unit === "c" ? "celsius" : "fahrenheit",
        wind_speed_unit: unit === "c" ? "kmh" : "mph",
      });
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!response.ok) throw new Error("weather");
        const json = await response.json();
        if (!cancelled) setState({ data: json, error: false, key });
      } catch {
        if (!cancelled) setState((s) => ({ data: s.key === key ? s.data : null, error: true, key }));
      }
    };
    load();
    const id = setInterval(load, WEATHER_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [key, place.lat, place.lon, unit]);
  // Only report what belongs to this place and unit, so switching never shows stale numbers
  return state.key === key ? state : { data: null, error: false };
}

function WeatherWidget() {
  const [stored, setStored] = useStored("weather", { home: WEATHER_HOME, here: null });
  const [shared, setShared] = useShared();
  const [locating, setLocating] = useState(false);
  const home = validPlace(stored.home) ? stored.home : WEATHER_HOME;
  const here = validPlace(stored.here) ? stored.here : null;
  const place = here || home;
  const unit = shared.temperature;
  const { data, error } = useWeather(place, unit);

  const locate = async () => {
    if (here) {
      setStored((s) => ({ ...s, here: null }));
      return;
    }
    setLocating(true);
    try {
      const ip = await approximateLocation();
      setStored((s) => ({ ...s, here: { name: ip.approxCity || "Here", lat: ip.approxLatitude, lon: ip.approxLongitude } }));
    } catch {
      /* stays on the chosen city */
    } finally {
      setLocating(false);
    }
  };

  const current = data?.current;
  const daily = data?.daily;
  const now = current ? describeWeather(current.weather_code, current.is_day === 1) : null;
  const days = daily
    ? daily.time.map((date, i) => ({ date, hi: Math.round(daily.temperature_2m_max[i]), lo: Math.round(daily.temperature_2m_min[i]), code: daily.weather_code[i] }))
    : [];
  const lowest = Math.min(...days.map((d) => d.lo));
  const highest = Math.max(...days.map((d) => d.hi));
  const span = Math.max(1, highest - lowest);
  const weekday = (date) => {
    const d = new Date(`${date}T12:00:00`);
    const short = d.toLocaleDateString(shared.locale, { weekday: "short" }).replace(".", "");
    // Latin scripts: two letters (Th, Fr). Hebrew, Japanese: the narrow form (ה׳, 木)
    return /^[A-Za-zÀ-ÿ]/.test(short) ? short.slice(0, 2) : d.toLocaleDateString(shared.locale, { weekday: "narrow" });
  };

  return (
    <section className="widget widget-weather px-3.5 pb-3 pt-3" aria-label="Weather">
      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={`widget-led ${current ? "widget-led-on" : ""}`} aria-hidden="true" />
          <span className="truncate">{here ? `near ${here.name}` : home.name}</span>
        </span>
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className={`widget-mini-btn ${here ? "widget-mini-btn-on" : ""}`}
          aria-label={here ? `Back to ${home.name}` : "Show weather near this computer"}
          title={here ? `Back to ${home.name}` : "Near me (from your internet address)"}
        >
          <LocateFixed className={`h-3.5 w-3.5 ${locating ? "animate-pulse" : ""}`} strokeWidth={2} />
        </button>
      </div>

      {current ? (
        <>
          <div className="mt-1.5 flex items-start justify-between">
            <button
              type="button"
              onClick={() => setShared({ temperature: unit === "f" ? "c" : "f" })}
              className="widget-weather-temp"
              aria-label={`${Math.round(current.temperature_2m)} degrees ${unit === "f" ? "Fahrenheit" : "Celsius"}. Switch to ${unit === "f" ? "Celsius" : "Fahrenheit"}.`}
              title={`Switch to °${unit === "f" ? "C" : "F"}`}
            >
              {Math.round(current.temperature_2m)}
              <span className="widget-weather-unit">°{unit.toUpperCase()}</span>
            </button>
            <now.Icon className="mt-1.5 h-8 w-8 text-[var(--os-ink-2)]" strokeWidth={1.4} aria-hidden="true" />
          </div>
          <div className="truncate text-[12px] font-semibold">{now.label}</div>
          <div className="truncate text-[11px] tabular-nums text-[var(--os-ink-3)]">
            feels {Math.round(current.apparent_temperature)}° · {Math.round(current.relative_humidity_2m)}% · {Math.round(current.wind_speed_10m)} {unit === "c" ? "km/h" : "mph"}
          </div>

          {/* Five-day range meter: each bar runs from the day's low to its high on a shared scale */}
          <div className="mt-2.5 grid grid-cols-5 gap-1 border-t border-[var(--w-line)] pt-2" role="list" aria-label="Five-day forecast">
            {days.map((d, i) => {
              const { label } = describeWeather(d.code);
              return (
                <div key={d.date} role="listitem" className="flex flex-col items-center text-[10px] tabular-nums" aria-label={`${weekday(d.date)}: ${label}, high ${d.hi}, low ${d.lo}`}>
                  <span className={`uppercase tracking-[0.08em] ${i === 0 ? "font-semibold text-[var(--os-ink)]" : "text-[var(--os-ink-3)]"}`}>{weekday(d.date)}</span>
                  <span className="mt-0.5 text-[var(--os-ink-2)]">{d.hi}</span>
                  <span className="widget-weather-track" aria-hidden="true">
                    <span className="widget-weather-range" style={{ top: `${((highest - d.hi) / span) * 100}%`, bottom: `${((d.lo - lowest) / span) * 100}%` }} />
                  </span>
                  <span className="text-[var(--os-ink-3)]">{d.lo}</span>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex h-[150px] items-center justify-center text-[12px] text-[var(--os-ink-3)]">{error ? "No forecast right now." : "Reading the sky…"}</div>
      )}
      <ExternalLink href="https://open-meteo.com/" className="widget-credit">
        Open-Meteo
      </ExternalLink>
    </section>
  );
}

// Pick the city: Open-Meteo's place search
function WeatherSettings() {
  const [stored, setStored] = useStored("weather", { home: WEATHER_HOME, here: null });
  const [shared] = useShared();
  const home = validPlace(stored.home) ? stored.home : WEATHER_HOME;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null); // null | [] | [{ name, detail, lat, lon }] | "error"

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setResults("searching");
    try {
      const params = new URLSearchParams({ name: q, count: "6", language: shared.locale.split("-")[0], format: "json" });
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
      if (!response.ok) throw new Error("search");
      const json = await response.json();
      setResults(
        (json.results || []).map((r) => ({
          name: r.name,
          detail: [r.admin1, r.country].filter(Boolean).join(", "),
          lat: Math.round(r.latitude * 1000) / 1000,
          lon: Math.round(r.longitude * 1000) / 1000,
        })),
      );
    } catch {
      setResults("error");
    }
  };

  return (
    <div className="grid gap-1.5">
      <span className="wp-field">
        city: <strong className="text-[var(--os-ink)]">{home.name}</strong>
      </span>
      <form
        className="flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <input className="wp-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a city" aria-label="Find a city" />
        <button type="submit" className="wp-btn shrink-0" disabled={!query.trim()}>
          find
        </button>
      </form>
      {results === "searching" && <p className="text-[11px] text-[var(--os-ink-3)]">Searching…</p>}
      {results === "error" && <p className="text-[11px] text-[var(--os-warn)]">Couldn't search right now.</p>}
      {Array.isArray(results) &&
        (results.length ? (
          <ul className="grid gap-0.5">
            {results.map((r) => (
              <li key={`${r.lat},${r.lon}`}>
                <button
                  type="button"
                  className="w-full truncate rounded-md px-1.5 py-1 text-left text-[11.5px] hover:bg-[var(--os-hover)]"
                  onClick={() => {
                    setStored({ home: { name: r.name, lat: r.lat, lon: r.lon }, here: null });
                    setResults(null);
                    setQuery("");
                  }}
                >
                  <span className="font-semibold">{r.name}</span> <span className="text-[var(--os-ink-3)]">{r.detail}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-[var(--os-ink-3)]">No places by that name.</p>
        ))}
    </div>
  );
}

mountWidget({ id: "weather", label: "Weather", Widget: WeatherWidget, Settings: WeatherSettings });
