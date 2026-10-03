import { ExternalLink as ExternalIcon, Plane } from "lucide-react";
import { useEffect, useState } from "react";
import { ExternalLink, mountWidget } from "../../src/shared/shell.jsx";
import { useShared, useStored } from "../../src/shared/store.js";

/* Flight Tracker: a flight's airline and route from adsbdb, and a live map at ADS-B Exchange */
// Two-letter airline codes the route database doesn't take on their own (it wants the three-letter ones)
const AIRLINE_ICAO = {
  AA: "AAL", UA: "UAL", DL: "DAL", WN: "SWA", B6: "JBU", AS: "ASA", NK: "NKS", F9: "FFT", HA: "HAL", LY: "ELY", BA: "BAW", VS: "VIR",
  LH: "DLH", AF: "AFR", KL: "KLM", IB: "IBE", AY: "FIN", SK: "SAS", LX: "SWR", OS: "AUA", TK: "THY", EK: "UAE", QR: "QTR", EY: "ETD",
  FR: "RYR", U2: "EZY", AC: "ACA", AM: "AMX", AV: "AVA", CM: "CMP", LA: "LAN", SQ: "SIA", CX: "CPA", NH: "ANA", JL: "JAL", QF: "QFA",
};

const widgetInput = "w-full min-w-0 rounded-md bg-[var(--os-card)] px-2 py-1 text-[13px] ring-1 ring-[var(--w-line)] focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

function flightCandidates(raw) {
  const flight = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = flight.match(/^([A-Z0-9]{2})(\d{1,4})$/);
  const icao = match && AIRLINE_ICAO[match[1]] ? `${AIRLINE_ICAO[match[1]]}${match[2]}` : null;
  return [...new Set([flight, icao].filter(Boolean))];
}

async function lookupFlight(raw) {
  for (const callsign of flightCandidates(raw)) {
    const response = await fetch(`https://api.adsbdb.com/v0/callsign/${callsign}`).catch(() => null);
    if (!response) throw new Error("offline");
    if (response.status === 404 || response.status === 400) continue;
    const route = (await response.json())?.response?.flightroute;
    if (route) return route;
  }
  throw new Error("unknown");
}

// Great-circle distance in kilometers
function distanceKm(from, to) {
  const rad = Math.PI / 180;
  const dLat = (to.lat - from.lat) * rad;
  const dLon = (to.lon - from.lon) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(to.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function FlightWidget() {
  const [saved, setSaved] = useStored("flight", { flight: "LY1" });
  const [draft, setDraft] = useState(saved.flight);
  const [state, setState] = useState({ flight: null, route: null, error: null });
  const flight = saved.flight;
  const [shared] = useShared();

  useEffect(() => {
    if (!flight) return;
    let cancelled = false;
    lookupFlight(flight)
      .then((route) => !cancelled && setState({ flight, route, error: null }))
      .catch((e) => !cancelled && setState({ flight, route: null, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [flight]);

  const current = state.flight === flight ? state : { route: null, error: null };
  const route = current.route;
  const km = route ? distanceKm({ lat: route.origin.latitude, lon: route.origin.longitude }, { lat: route.destination.latitude, lon: route.destination.longitude }) : 0;
  const distance = shared.temperature === "f" ? `${Math.round(km * 0.621371).toLocaleString(shared.locale)} mi` : `${Math.round(km).toLocaleString(shared.locale)} km`;
  const callsign = route?.callsign_icao || flight;

  return (
    <section className="widget widget-flight px-3.5 pb-3.5 pt-3" aria-label="Flight tracker">
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          const next = draft.trim().toUpperCase();
          if (next) setSaved({ flight: next });
        }}
      >
        <Plane className="h-3.5 w-3.5 shrink-0 text-[var(--os-ink-3)]" aria-hidden="true" />
        <input value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 10))} placeholder="Flight, e.g. LY1" aria-label="Flight number" className={`${widgetInput} font-mono uppercase`} />
        <button type="submit" className="widget-mini-btn shrink-0 ring-1 ring-[var(--w-line)]" aria-label="Look up flight" title="Look up">
          ↵
        </button>
      </form>

      {route ? (
        <>
          <div className="mt-2.5 truncate text-[12px] font-semibold">{route.airline?.name || "Flight"}</div>
          <div className="text-[10.5px] text-[var(--os-ink-3)]">{[route.callsign_iata, route.callsign_icao].filter(Boolean).join(" · ")}</div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[22px] font-semibold leading-none tracking-tight">{route.origin.iata_code}</div>
              <div className="truncate text-[10.5px] text-[var(--os-ink-3)]">{route.origin.municipality}</div>
            </div>
            <div className="widget-flight-path" aria-hidden="true">
              <Plane className="h-3.5 w-3.5 rotate-45 text-[var(--os-accent)]" />
            </div>
            <div className="min-w-0 text-right">
              <div className="text-[22px] font-semibold leading-none tracking-tight">{route.destination.iata_code}</div>
              <div className="truncate text-[10.5px] text-[var(--os-ink-3)]">{route.destination.municipality}</div>
            </div>
          </div>
          <div className="mt-2 text-center text-[10.5px] text-[var(--os-ink-3)]">{distance} great-circle</div>
          <ExternalLink
            href={`https://globe.adsbexchange.com/?callsign=${encodeURIComponent(callsign)}`}
            className="mt-2 flex items-center justify-center gap-1 rounded-full py-1 text-[11.5px] ring-1 ring-[var(--w-line)] hover:bg-[var(--os-hover)]"
          >
            track live <ExternalIcon className="h-3 w-3" aria-hidden="true" />
          </ExternalLink>
        </>
      ) : (
        <div className="flex h-[150px] items-center justify-center px-2 text-center text-[12px] text-[var(--os-ink-3)]">
          {current.error === "unknown"
            ? `No route found for ${flight}. Try the airline's code, like LY1 or ELY1.`
            : current.error
              ? "Couldn't reach the flight database."
              : "Looking up the route…"}
        </div>
      )}
    </section>
  );
}

mountWidget({ id: "flight-tracker", label: "Flight Tracker", Widget: FlightWidget });
