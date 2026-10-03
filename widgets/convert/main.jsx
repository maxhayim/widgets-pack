import { useEffect, useState } from "react";
import { mountWidget } from "../../src/shared/shell.jsx";
import { useShared, useStored } from "../../src/shared/store.js";

/* Convert: units on the computer; currencies from Frankfurter (European Central Bank reference rates) */
const UNIT_GROUPS = {
  length: { label: "length", units: { mm: 0.001, cm: 0.01, m: 1, km: 1000, in: 0.0254, ft: 0.3048, yd: 0.9144, mi: 1609.344, nmi: 1852 }, from: "mi", to: "km" },
  weight: { label: "weight", units: { mg: 1e-6, g: 0.001, kg: 1, t: 1000, oz: 0.028349523125, lb: 0.45359237, st: 6.35029318 }, from: "lb", to: "kg" },
  volume: {
    label: "volume",
    units: { ml: 0.001, l: 1, "US cup": 0.2365882365, "US fl oz": 0.0295735295625, "US qt": 0.946352946, "US gal": 3.785411784, "UK gal": 4.54609 },
    from: "US gal",
    to: "l",
  },
  speed: { label: "speed", units: { "m/s": 1, "km/h": 1 / 3.6, mph: 0.44704, kn: 1852 / 3600 }, from: "mph", to: "km/h" },
  area: { label: "area", units: { "m²": 1, "km²": 1e6, ha: 1e4, "ft²": 0.09290304, acre: 4046.8564224, "mi²": 2589988.110336 }, from: "acre", to: "m²" },
  temperature: { label: "temperature", units: { "°F": null, "°C": null, K: null }, from: "°F", to: "°C" },
  currency: { label: "currency", units: null, from: "USD", to: "EUR" },
};

const widgetSelect = "min-w-0 rounded-md bg-[var(--os-card)] px-1.5 py-1 text-[12px] ring-1 ring-[var(--w-line)] focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const widgetInput = "w-full min-w-0 rounded-md bg-[var(--os-card)] px-2 py-1 text-[13px] ring-1 ring-[var(--w-line)] focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

function convertTemperature(value, from, to) {
  const celsius = from === "°C" ? value : from === "°F" ? ((value - 32) * 5) / 9 : value - 273.15;
  return to === "°C" ? celsius : to === "°F" ? (celsius * 9) / 5 + 32 : celsius + 273.15;
}

const currencyCache = { names: null, rates: new Map() }; // rates: "USD>EUR" -> { rate, date, at }

async function loadCurrencies() {
  if (currencyCache.names) return currencyCache.names;
  const response = await fetch("https://api.frankfurter.dev/v1/currencies");
  if (!response.ok) throw new Error("rates");
  currencyCache.names = await response.json();
  return currencyCache.names;
}

async function loadRate(from, to) {
  const key = `${from}>${to}`;
  const cached = currencyCache.rates.get(key);
  if (cached && Date.now() - cached.at < 60 * 60 * 1000) return cached;
  const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${from}&symbols=${to}`);
  if (!response.ok) throw new Error("rates");
  const json = await response.json();
  const entry = { rate: json.rates[to], date: json.date, at: Date.now() };
  currencyCache.rates.set(key, entry);
  return entry;
}

const formatNumber = (n, locale) =>
  Number.isFinite(n) ? n.toLocaleString(locale, { maximumSignificantDigits: Math.abs(n) >= 1 ? 10 : 6, maximumFractionDigits: 6 }) : "—";

function ConvertWidget() {
  const [shared] = useShared();
  const [saved, setSaved] = useStored("convert", { group: "currency", value: "1", from: "USD", to: "EUR" });
  const [currencies, setCurrencies] = useState(currencyCache.names);
  const [rate, setRate] = useState(null); // { key, rate, date } | { key, error }
  const group = UNIT_GROUPS[saved.group] ? saved.group : "currency";
  const isCurrency = group === "currency";
  const options = isCurrency ? Object.keys(currencies || { USD: "", EUR: "", ILS: "", GBP: "" }) : Object.keys(UNIT_GROUPS[group].units);
  const from = options.includes(saved.from) ? saved.from : UNIT_GROUPS[group].from;
  const to = options.includes(saved.to) ? saved.to : UNIT_GROUPS[group].to;
  const value = Number.parseFloat(String(saved.value).replace(",", "."));
  const rateKey = `${from}>${to}`;

  useEffect(() => {
    if (!isCurrency || currencies) return;
    let cancelled = false;
    loadCurrencies()
      .then((names) => !cancelled && setCurrencies(names))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isCurrency, currencies]);

  useEffect(() => {
    if (!isCurrency || from === to) return;
    let cancelled = false;
    loadRate(from, to)
      .then((r) => !cancelled && setRate({ key: rateKey, rate: r.rate, date: r.date }))
      .catch(() => !cancelled && setRate({ key: rateKey, error: true }));
    return () => {
      cancelled = true;
    };
  }, [isCurrency, from, to, rateKey]);

  let result = Number.NaN;
  let footnote = "";
  if (Number.isFinite(value)) {
    if (isCurrency) {
      if (from === to) result = value;
      else if (rate?.key === rateKey && !rate.error) {
        result = value * rate.rate;
        footnote = `ECB rate, ${rate.date}`;
      } else footnote = rate?.key === rateKey ? "Rates aren't available right now." : "Getting today's rate…";
    } else if (group === "temperature") result = convertTemperature(value, from, to);
    else result = (value * UNIT_GROUPS[group].units[from]) / UNIT_GROUPS[group].units[to];
  }

  const set = (patch) => setSaved((s) => ({ ...s, ...patch }));
  // Pickers show codes to stay compact; currency names are spelled out under the result
  const names = isCurrency && currencies?.[from] && currencies?.[to] ? `${currencies[from]} → ${currencies[to]}` : "";

  return (
    <section className="widget widget-convert px-3.5 pb-3.5 pt-3" aria-label="Convert">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]">convert</span>
        <select
          value={group}
          onChange={(e) => set({ group: e.target.value, from: UNIT_GROUPS[e.target.value].from, to: UNIT_GROUPS[e.target.value].to })}
          className={widgetSelect}
          aria-label="What to convert"
        >
          {Object.entries(UNIT_GROUPS).map(([id, g]) => (
            <option key={id} value={id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      <input value={saved.value} onChange={(e) => set({ value: e.target.value.slice(0, 18) })} inputMode="decimal" aria-label="Amount" className={`${widgetInput} mt-2.5 text-[15px] tabular-nums`} />
      <div className="mt-2 flex items-center gap-1">
        <select value={from} onChange={(e) => set({ from: e.target.value })} className={`${widgetSelect} flex-1`} aria-label="From">
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => set({ from: to, to: from })} className="widget-mini-btn shrink-0" aria-label="Swap" title="Swap">
          ⇄
        </button>
        <select value={to} onChange={(e) => set({ to: e.target.value })} className={`${widgetSelect} flex-1`} aria-label="To">
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 truncate text-[26px] font-light leading-none tracking-tight tabular-nums" aria-live="polite">
        {formatNumber(result, shared.locale)}
        <span className="ml-1 text-[13px] font-medium text-[var(--os-ink-3)]">{to}</span>
      </div>
      <div className="mt-1.5 truncate text-[10.5px] text-[var(--os-ink-2)]">{names}</div>
      <div className="h-[14px] truncate text-[10.5px] text-[var(--os-ink-3)]">{footnote}</div>
    </section>
  );
}

mountWidget({ id: "convert", label: "Convert", Widget: ConvertWidget });
