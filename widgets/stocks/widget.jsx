import { useEffect, useState } from "react";
import { ExternalLink } from "../../src/shared/ui.jsx";
import { useShared, useStored } from "../../src/shared/store.js";

/* Stocks: crypto from CoinGecko (no key needed); stocks from Finnhub with your own free key */
const CRYPTO_IDS = { BTC: "bitcoin", ETH: "ethereum", SOL: "solana", XRP: "ripple", DOGE: "dogecoin", ADA: "cardano", LTC: "litecoin", BNB: "binancecoin" };
const STOCKS_DEFAULT = "AAPL, MSFT, NVDA, TSLA, BTC, ETH";
const STOCKS_REFRESH_MS = 60 * 1000;

const parseWatchlist = (text) =>
  String(text || STOCKS_DEFAULT)
    .toUpperCase()
    .split(/[\s,]+/)
    .filter((s) => /^[A-Z0-9.^-]{1,10}$/.test(s))
    .slice(0, 8);

async function loadQuotes(symbols, apiKey) {
  const crypto = symbols.filter((s) => CRYPTO_IDS[s]);
  const stocks = symbols.filter((s) => !CRYPTO_IDS[s]);
  const quotes = {};
  if (crypto.length) {
    const ids = crypto.map((s) => CRYPTO_IDS[s]).join(",");
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`).catch(() => null);
    const json = response?.ok ? await response.json() : {};
    crypto.forEach((s) => {
      const q = json[CRYPTO_IDS[s]];
      if (q) quotes[s] = { price: q.usd, change: q.usd_24h_change };
    });
  }
  if (stocks.length && apiKey) {
    await Promise.all(
      stocks.map(async (s) => {
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(s)}&token=${encodeURIComponent(apiKey)}`).catch(() => null);
        if (response?.status === 401) quotes[s] = { error: "key" };
        else if (response?.ok) {
          const q = await response.json();
          if (q && q.c) quotes[s] = { price: q.c, change: q.dp };
        }
      }),
    );
  }
  return quotes;
}

function StocksWidget({ openSettings }) {
  const [settings] = useStored("stocks", { symbols: STOCKS_DEFAULT, key: "" });
  const symbols = parseWatchlist(settings.symbols);
  const key = typeof settings.key === "string" ? settings.key : "";
  const cacheKey = `${symbols.join(",")}|${key}`;
  const [state, setState] = useState({ key: cacheKey, data: null });
  const [shared] = useShared();

  useEffect(() => {
    let cancelled = false;
    const load = () => loadQuotes(cacheKey.split("|")[0].split(","), key).then((data) => !cancelled && setState({ key: cacheKey, data }));
    load();
    const id = setInterval(load, STOCKS_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [cacheKey, key]);

  const data = state.key === cacheKey ? state.data : null;
  const needsKey = !key && symbols.some((s) => !CRYPTO_IDS[s]);
  const money = (n) => n.toLocaleString(shared.locale, { style: "currency", currency: "USD", maximumFractionDigits: n >= 1000 ? 0 : 2 });

  return (
    <section className="widget widget-stocks px-3.5 pb-3 pt-3" aria-label="Stocks">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]">
        <span>stocks</span>
        <button type="button" onClick={openSettings} className="normal-case tracking-normal underline-offset-2 hover:underline">
          edit
        </button>
      </div>
      <ul className="mt-1.5 divide-y divide-[var(--w-line)]">
        {symbols.map((s) => {
          const q = data?.[s];
          const up = q?.change >= 0;
          return (
            <li key={s} className="flex items-center justify-between gap-2 py-[5px] text-[12.5px] tabular-nums">
              <span className="w-12 shrink-0 font-semibold">{s}</span>
              <span className="min-w-0 flex-1 truncate text-right">{q?.price ? money(q.price) : q?.error ? "key?" : "—"}</span>
              <span className={`w-[52px] shrink-0 rounded px-1 text-right text-[11px] ${q?.price ? (up ? "stock-up" : "stock-down") : "text-[var(--os-ink-3)]"}`}>
                {q?.price && Number.isFinite(q.change) ? `${up ? "+" : ""}${q.change.toFixed(2)}%` : ""}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-1.5 pl-5 text-[10px] leading-snug text-[var(--os-ink-3)]">{needsKey ? "Add a free Finnhub key in settings for stock prices." : "Prices may be delayed."}</p>
    </section>
  );
}

function StocksSettings() {
  const [settings, setSettings] = useStored("stocks", { symbols: STOCKS_DEFAULT, key: "" });
  const [symbols, setSymbols] = useState(String(settings.symbols || STOCKS_DEFAULT));
  const [key, setKey] = useState(typeof settings.key === "string" ? settings.key : "");
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        setSettings({ symbols, key: key.trim() });
        setSaved(true);
      }}
    >
      <label className="wp-field">
        watchlist (up to 8)
        <input
          className="wp-input font-mono"
          value={symbols}
          onChange={(e) => {
            setSymbols(e.target.value.toUpperCase());
            setSaved(false);
          }}
          placeholder={STOCKS_DEFAULT}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <label className="wp-field">
        Finnhub API key
        <input
          className="wp-input font-mono"
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setSaved(false);
          }}
          placeholder="for stock prices"
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <div className="flex items-center justify-between gap-2 text-[10.5px] text-[var(--os-ink-3)]">
        {saved ? (
          <span>Saved.</span>
        ) : (
          <ExternalLink href="https://finnhub.io/register" className="underline underline-offset-2 hover:text-[var(--os-ink)]">
            get a free key
          </ExternalLink>
        )}
        <button type="submit" className="wp-btn">
          save
        </button>
      </div>
      <p className="text-[10.5px] leading-snug text-[var(--os-ink-3)]">Crypto (BTC, ETH, SOL…) works without a key. The key stays on this computer.</p>
    </form>
  );
}

export default { id: "stocks", label: "Stocks", Widget: StocksWidget, Settings: StocksSettings };
