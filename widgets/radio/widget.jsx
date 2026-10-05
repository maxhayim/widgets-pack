import { Play, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { ExternalLink } from "../../src/shared/ui.jsx";
import { useHost } from "../../src/shared/host.jsx";
import { usePrefs, useStored } from "../../src/shared/store.js";
import { play, player, setStarter, setVolume, stop, usePlayer } from "./player.js";

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
  defaults: { station: "rp", volume: 70 }, // station is an id, so adding or removing stations never changes the one playing
};

/* Your own stations, after the built-in ones. The dial has room for 16 in all. */
const MAX_STATIONS = 16;
const MAX_OWN = MAX_STATIONS - RADIO_STATIONS.length;
const isStreamUrl = (url) => /^https?:\/\/[^\s"']+$/i.test(url);

function cleanOwnStations(saved) {
  return (Array.isArray(saved) ? saved : [])
    .filter((s) => s && typeof s.id === "string" && typeof s.name === "string" && isStreamUrl(s.stream || ""))
    .slice(0, MAX_OWN)
    .map((s) => ({
      id: s.id,
      name: s.name.slice(0, 40),
      genre: typeof s.genre === "string" && s.genre ? s.genre.slice(0, 60) : "your station",
      stream: s.stream,
      site: typeof s.site === "string" && /^https:\/\/[^\s"']+$/.test(s.site) ? s.site : null,
      own: true,
    }));
}

function useStations() {
  const [saved, save] = useStored("radio-stations", []);
  const own = cleanOwnStations(saved);
  return { stations: [...RADIO_STATIONS, ...own], own, saveOwn: save };
}

// Tries a stream silently before it's added: "ok" if it starts, "bad" if the browser can't play it at all
// (a web page, a playlist file, a wrong address), "unknown" if it doesn't answer in time
function testStream(url, createAudio) {
  return new Promise((resolve) => {
    const a = createAudio();
    a.muted = true;
    a.preload = "auto";
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      a.pause();
      a.removeAttribute("src");
      a.load();
      resolve(result);
    };
    const timer = setTimeout(() => finish("unknown"), 10000);
    a.addEventListener("canplay", () => finish("ok"), { once: true });
    a.addEventListener("playing", () => finish("ok"), { once: true });
    a.addEventListener("error", () => finish("bad"), { once: true });
    a.src = url;
    // Muted playback is the surest test; if the system won't allow it, loading alone has to do
    a.play().catch((e) => e?.name !== "NotAllowedError" && e?.name !== "AbortError" && finish("bad"));
  });
}

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
  const { stations } = useStations();
  const n = stations.length;
  const found = stations.findIndex((s) => s.id === prefs.station);
  const station = found >= 0 ? found : 0;
  const { sound, createAudio } = useHost();
  const { status } = usePlayer();
  const current = stations[station];
  const playing = status !== "off";
  const track = useNowPlaying(current, status === "on");

  const start = () => play(current.stream, { volume: prefs.volume, sound, createAudio });

  const tune = (step) => setPrefs({ station: stations[(station + step + n) % n].id });

  // A new station (from the wheel or from settings) plays right away if the radio is on
  useEffect(() => {
    if (player.status !== "off" && player.stream !== current.stream) play(current.stream, { volume: prefs.volume, sound, createAudio });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.stream]);

  useEffect(() => setVolume(prefs.volume), [prefs.volume]);

  // Lets a page turn the radio on from outside the widget (toggleRadio), with this widget's current station
  useEffect(() => {
    setStarter(start);
    return () => {
      if (player.start === start) setStarter(null);
    };
  });

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
              {stations.map((s, i) => {
                const deg = (i * 360) / n;
                const a = deg * (Math.PI / 180);
                const x = 32 + Math.sin(a) * 19;
                const y = 32 - Math.cos(a) * 19;
                return (
                  <text key={s.id} x={x} y={y} textAnchor="middle" dominantBaseline="central" transform={`rotate(${deg} ${x} ${y})`} className="widget-radio-num" style={n > 12 ? { fontSize: "6.5px" } : undefined}>
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
      {current.site && (
        <ExternalLink href={current.site} className="widget-credit">
          {current.name}
        </ExternalLink>
      )}
    </section>
  );
}

function RadioSettings() {
  const [prefs, setPrefs] = usePrefs(RADIO_PREFS);
  const { sound, createAudio } = useHost();
  const { stations, own, saveOwn } = useStations();
  const current = stations.some((s) => s.id === prefs.station) ? prefs.station : stations[0].id;
  const [name, setName] = useState("");
  const [stream, setStream] = useState("");
  const [state, setState] = useState(null); // { kind: "testing" | "ok" | "error", text }

  const add = async () => {
    const url = stream.trim();
    const title = name.trim();
    if (!title || !isStreamUrl(url)) {
      setState({ kind: "error", text: "Give it a name and a stream address starting with http:// or https://." });
      return;
    }
    if (stations.some((s) => s.stream === url)) {
      setState({ kind: "error", text: "That stream is already on the dial." });
      return;
    }
    setState({ kind: "testing", text: "Tuning in…" });
    const result = await testStream(url, createAudio);
    if (result === "bad") {
      setState({
        kind: "error",
        text: "That stream didn't play. Use the direct stream address (often ending in /stream, .mp3, or .aac), not a .pls or .m3u playlist or a web page.",
      });
      return;
    }
    const id = `own-${Date.now().toString(36)}`;
    saveOwn([...own, { id, name: title, stream: url }]);
    setPrefs({ station: id });
    setName("");
    setStream("");
    setState({
      kind: "ok",
      text: result === "ok" ? `Added ${title} as station ${stations.length + 1}.` : `Added ${title} as station ${stations.length + 1}. It was slow to answer, so check that it plays.`,
    });
  };

  const remove = (id) => {
    saveOwn(own.filter((s) => s.id !== id));
    if (prefs.station === id) setPrefs({ station: stations[0].id });
  };

  return (
    <>
      <label className="wp-field">
        station
        <select className="wp-input" value={current} onChange={(e) => setPrefs({ station: e.target.value })}>
          {stations.map((s, i) => (
            <option key={s.id} value={s.id}>
              {i + 1}. {s.name}
            </option>
          ))}
        </select>
      </label>
      {sound ? (
        sound.openSettings && (
          <p className="wp-field">
            <span>
              volume and mute:{" "}
              <button type="button" className="underline underline-offset-2" onClick={sound.openSettings}>
                sound settings
              </button>
            </span>
          </p>
        )
      ) : (
        <label className="wp-field">
          volume · {prefs.volume}%
          <input type="range" min="0" max="100" step="5" value={prefs.volume} onChange={(e) => setPrefs({ volume: Number(e.target.value) })} className="accent-[var(--os-accent)]" />
        </label>
      )}

      <div className="wp-section grid gap-2">
        <span className="wp-label">your stations</span>
        {own.length > 0 && (
          <ul className="grid gap-1">
            {own.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5 text-[11.5px]">
                <span className="tabular-nums text-[var(--os-ink-3)]">{stations.findIndex((x) => x.id === s.id) + 1}.</span>
                <span className="min-w-0 flex-1 truncate" title={s.stream}>
                  {s.name}
                </span>
                <button type="button" onClick={() => remove(s.id)} className="widget-mini-btn h-5 w-5" aria-label={`Remove ${s.name}`} title="Remove">
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        {own.length < MAX_OWN ? (
          <form
            className="grid gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              add();
            }}
          >
            <input className="wp-input" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="Name, e.g. WLRN" aria-label="Station name" />
            <input
              className="wp-input"
              value={stream}
              onChange={(e) => setStream(e.target.value)}
              placeholder="https://…/stream"
              aria-label="Stream address"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
            />
            <div className="flex justify-end">
              <button type="submit" className="wp-btn" disabled={!name.trim() || !stream.trim() || state?.kind === "testing"}>
                {state?.kind === "testing" ? "testing…" : "add station"}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-[11px] text-[var(--os-ink-3)]">The dial is full ({MAX_STATIONS} stations). Remove one to add another.</p>
        )}
        {state && state.kind !== "testing" && (
          <p className={`text-[11px] leading-snug ${state.kind === "error" ? "text-[var(--os-warn)]" : "text-[var(--os-ink-2)]"}`} aria-live="polite">
            {state.text}
          </p>
        )}
      </div>
    </>
  );
}

export default { id: "radio", label: "Radio", Widget: RadioWidget, Settings: RadioSettings };
