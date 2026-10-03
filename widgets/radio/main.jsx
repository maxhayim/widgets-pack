import { Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, mountWidget } from "../../src/shared/shell.jsx";
import { usePrefs } from "../../src/shared/store.js";

/* Radio: after the Braun T3 pocket radio. Perforated grille on top, a tuning wheel you turn to change stations.
   Public and listener-supported stations from around the world, plus Galgalatz and two Miami favorites. */
const RADIO_STATIONS = [
  { id: "rp", name: "Radio Paradise", genre: "eclectic mix · California", stream: "https://stream.radioparadise.com/mp3-128", site: "https://radioparadise.com/" },
  { id: "rp-mellow", name: "RP Mellow", genre: "mellow mix · California", stream: "https://stream.radioparadise.com/mellow-128", site: "https://radioparadise.com/" },
  {
    id: "kexp",
    name: "KEXP",
    genre: "indie and alternative · Seattle",
    stream: "https://kexp.streamguys1.com/kexp160.aac",
    site: "https://www.kexp.org/",
    nowPlaying: async () => {
      const play = (await (await fetch("https://api.kexp.org/v2/plays/?limit=1")).json()).results?.[0];
      return play?.play_type === "trackplay" && play.artist ? `${play.artist} — ${play.song}` : null;
    },
  },
  { id: "fip", name: "FIP", genre: "eclectic · Paris", stream: "https://icecast.radiofrance.fr/fip-midfi.mp3", site: "https://www.radiofrance.fr/fip" },
  { id: "fip-jazz", name: "FIP Jazz", genre: "jazz · Paris", stream: "https://icecast.radiofrance.fr/fipjazz-midfi.mp3", site: "https://www.radiofrance.fr/fip" },
  {
    id: "nts",
    name: "NTS 1",
    genre: "underground radio · London",
    stream: "https://stream-relay-geo.ntslive.net/stream",
    site: "https://www.nts.live/",
    nowPlaying: async () => {
      const live = (await (await fetch("https://www.nts.live/api/v2/live")).json()).results?.find((c) => c.channel_name === "1");
      return live?.now?.broadcast_title || null;
    },
  },
  { id: "galgalatz", name: "Galgalatz", genre: "Israeli and international pop · Tel Aviv", stream: "https://glzicylv01.bynetcdn.com/glglz_mp3", site: "https://glz.co.il/" },
  { id: "kiss-country", name: "Kiss Country 99.9", genre: "country · Miami", stream: "https://live.amperwave.net/direct/audacy-wkisfmaac-imc", site: "https://www.audacy.com/stations/kisscountry999" },
  { id: "revolution", name: "Revolution 93.5", genre: "dance and electronic · Miami", stream: "https://centova87.shoutcastservices.com/proxy/revolution935/stream", site: "https://www.revolution935.com/" },
];
const RADIO_PREFS = {
  key: "radio",
  defaults: { station: 0, volume: 70 },
};
const clampStation = (n) => Math.max(0, Math.min(RADIO_STATIONS.length - 1, Math.round(n) || 0));

// What's on now, for the stations that publish it
function useNowPlaying(station, active) {
  const [track, setTrack] = useState(null); // { stationId, text }
  useEffect(() => {
    if (!active || !station.nowPlaying) return;
    let cancelled = false;
    const load = async () => {
      try {
        const text = await station.nowPlaying();
        if (!cancelled) setTrack({ stationId: station.id, text });
      } catch {
        /* the station description is enough */
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [station, active]);
  return active && track?.stationId === station.id ? track.text : null;
}

function RadioWidget() {
  const [prefs, setPrefs] = usePrefs(RADIO_PREFS);
  const station = clampStation(prefs.station);
  const [status, setStatus] = useState("off"); // "off" | "tuning" | "on" | "error"
  const audioRef = useRef(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  const current = RADIO_STATIONS[station];
  const playing = status !== "off";
  const track = useNowPlaying(current, status === "on");
  const n = RADIO_STATIONS.length;

  const audio = () => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "none";
      a.addEventListener("playing", () => setStatus("on"));
      a.addEventListener("waiting", () => statusRef.current !== "off" && setStatus("tuning"));
      a.addEventListener("error", () => statusRef.current !== "off" && setStatus("error"));
      audioRef.current = a;
    }
    return audioRef.current;
  };

  const start = (index = station) => {
    const a = audio();
    a.src = RADIO_STATIONS[index].stream;
    a.volume = prefs.volume / 100;
    setStatus("tuning");
    // Tuning again before a station answers interrupts this play request; that's not a lost signal
    a.play().catch((e) => e?.name !== "AbortError" && statusRef.current !== "off" && setStatus("error"));
  };

  const stop = () => {
    setStatus("off");
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.removeAttribute("src");
    a.load();
  };

  const tune = (step) => setPrefs({ station: (station + step + n) % n });

  // A new station (from the wheel or from settings) plays right away if the radio is on
  const tuned = useRef(station);
  useEffect(() => {
    if (tuned.current === station) return;
    tuned.current = station;
    if (statusRef.current !== "off") start(station);
  });

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = prefs.volume / 100;
  }, [prefs.volume]);

  useEffect(() => () => audioRef.current?.pause(), []);

  const statusLabel = !playing ? "off" : status === "error" ? "no signal" : status === "tuning" ? "tuning…" : "on air";

  return (
    <section className="widget widget-radio" aria-label="Radio">
      <div className="widget-radio-grille" aria-hidden="true" />
      <div className="px-3.5 pt-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]">
          <span className={`widget-led ${status === "on" ? "widget-led-on" : ""}`} aria-hidden="true" />
          <span aria-live="polite">{statusLabel}</span>
          <span className="ml-auto tabular-nums">
            {station + 1}/{n}
          </span>
        </div>
        <div className="mt-1 truncate text-[15px] font-semibold tracking-tight">{current.name}</div>
        <div className="truncate text-[11px] text-[var(--os-ink-3)]" title={track || current.genre}>
          {track || current.genre}
        </div>
      </div>
      <div className="flex items-end justify-between px-3.5 pb-4 pt-2.5">
        {/* Tuning wheel: click for the next station, shift-click or arrow keys to go back */}
        <button
          type="button"
          className="widget-radio-dial"
          onClick={(e) => tune(e.shiftKey ? -1 : 1)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
              e.preventDefault();
              tune(-1);
            } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
              e.preventDefault();
              tune(1);
            }
          }}
          aria-label={`Station ${station + 1} of ${n}: ${current.name}. Turn to change station.`}
          title="Turn to change station"
        >
          <svg viewBox="0 0 64 64" className="h-full w-full" aria-hidden="true">
            <g className="widget-radio-wheel" style={{ transform: `rotate(${(-station * 360) / n}deg)` }}>
              <circle cx="32" cy="32" r="30" fill="var(--w-face)" />
              {Array.from({ length: 36 }, (_, i) => (
                <line key={i} x1="32" y1="3" x2="32" y2="6.5" stroke="var(--w-mark)" strokeWidth="0.8" transform={`rotate(${i * 10} 32 32)`} />
              ))}
              {RADIO_STATIONS.map((s, i) => {
                const deg = (i * 360) / n;
                const a = deg * (Math.PI / 180);
                const x = 32 + Math.sin(a) * 19;
                const y = 32 - Math.cos(a) * 19;
                return (
                  <text key={s.id} x={x} y={y} textAnchor="middle" dominantBaseline="central" transform={`rotate(${deg} ${x} ${y})`} className="widget-radio-num">
                    {i + 1}
                  </text>
                );
              })}
              <circle cx="32" cy="32" r="7" fill="var(--w-case)" stroke="var(--w-mark)" strokeWidth="0.6" />
            </g>
            <path d="M32 0 L35 5 L29 5 Z" fill="var(--os-accent)" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => (playing ? stop() : start())}
          aria-pressed={playing}
          aria-label={playing ? "Turn radio off" : "Turn radio on"}
          title={playing ? "Off" : "On"}
          className={`os-knob widget-radio-power ${playing ? "os-knob-power" : ""}`}
        >
          {playing ? <Square className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} /> : <Play className="ml-0.5 h-4 w-4" fill="currentColor" strokeWidth={0} />}
        </button>
      </div>
      <ExternalLink href={current.site} className="widget-credit">
        {current.name}
      </ExternalLink>
    </section>
  );
}

function RadioSettings() {
  const [prefs, setPrefs] = usePrefs(RADIO_PREFS);
  const station = clampStation(prefs.station);
  return (
    <>
      <label className="wp-field">
        station
        <select className="wp-input" value={station} onChange={(e) => setPrefs({ station: Number(e.target.value) })}>
          {RADIO_STATIONS.map((s, i) => (
            <option key={s.id} value={i}>
              {i + 1}. {s.name}
            </option>
          ))}
        </select>
      </label>
      <label className="wp-field">
        volume · {prefs.volume}%
        <input type="range" min="0" max="100" step="5" value={prefs.volume} onChange={(e) => setPrefs({ volume: Number(e.target.value) })} className="accent-[var(--os-accent)]" />
      </label>
    </>
  );
}

mountWidget({ id: "radio", label: "Radio", Widget: RadioWidget, Settings: RadioSettings });
