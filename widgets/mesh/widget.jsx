import { RadioTower } from "lucide-react";
import { useEffect, useState } from "react";
import { useHost } from "../../src/shared/host.jsx";
import { useStored } from "../../src/shared/store.js";
import { useMinuteClock } from "../../src/shared/time.jsx";

/* Mesh: a Braun-style receiver panel for your own MeshMonitor, through its v1 API.
   The address and API token stay in this pack's storage on this computer. */
const MESHMONITOR_REFRESH_MS = 60 * 1000;
const MESH_BROADCAST = "!ffffffff";

const validConn = (c) => c && typeof c.url === "string" && typeof c.token === "string" && c.url && c.token;

// "meshmonitor.example.com/" → "https://meshmonitor.example.com"; a pasted ".../api/v1" is trimmed off
function normalizeMeshMonitorUrl(raw) {
  let url = raw.trim().replace(/\/+$/, "");
  if (!url) return "";
  // No scheme typed: https, except for MeshMonitor on this computer, which usually runs plain http
  if (!/^https?:\/\//i.test(url)) url = /^(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url) ? `http://${url}` : `https://${url}`;
  return url.replace(/\/api(\/v1)?$/i, "");
}

async function meshMonitorFetch(conn, path) {
  let response;
  try {
    response = await fetch(`${conn.url}/api/v1${path}`, {
      headers: { Authorization: `Bearer ${conn.token}`, Accept: "application/json" },
      credentials: "omit",
      cache: "no-store",
    });
  } catch {
    throw new Error("unreachable");
  }
  if (response.status === 401) throw new Error("token");
  if (response.status === 403) throw new Error("permission");
  if (!response.ok) throw new Error("server");
  const json = await response.json().catch(() => null);
  if (!json || json.success === false) throw new Error("server");
  return json.data;
}

// origin: the address the widget runs at, which MeshMonitor has to allow (the host knows it)
function describeMeshMonitorError(error, url = "", origin = "") {
  if (error.message === "unreachable") {
    return `Couldn't reach ${url || "MeshMonitor"}. Check the address, that it's online, and that MeshMonitor's ALLOWED_ORIGINS setting includes ${origin || "this page's address"}.`;
  }
  if (error.message === "token") return "MeshMonitor didn't accept that API token.";
  if (error.message === "permission") return "That token isn't allowed to read nodes on this source.";
  return "MeshMonitor answered with an error. Check that it's version 4.13 or newer.";
}

async function loadMeshSnapshot(conn) {
  const base = `/sources/${encodeURIComponent(conn.source)}`;
  const [nodes, status, messages] = await Promise.all([
    meshMonitorFetch(conn, `${base}/nodes`),
    meshMonitorFetch(conn, `${base}/status`).catch(() => null),
    meshMonitorFetch(conn, `${base}/messages?limit=25`).catch(() => []),
  ]);
  const list = Array.isArray(nodes) ? nodes : [];
  const nowSeconds = Date.now() / 1000;
  const heardWithin = (seconds) => list.filter((n) => n.lastHeard && nowSeconds - n.lastHeard < seconds).length;
  const nameOf = (id) => {
    const node = list.find((n) => n.nodeId === id);
    return node?.longName || node?.shortName || id;
  };
  // Channel messages only: direct messages stay private, even on your own screen
  const latest = (Array.isArray(messages) ? messages : []).find((m) => m.text && m.toNodeId === MESH_BROADCAST);
  return {
    total: list.length,
    hour: heardWithin(3600),
    day: heardWithin(86400),
    week: heardWithin(7 * 86400),
    local: status ? { name: status.longName || status.shortName || status.localNodeId, connected: !!status.connected } : null,
    message: latest ? { from: nameOf(latest.fromNodeId), text: latest.text, at: latest.timestamp } : null,
  };
}

function useMeshSnapshot(conn) {
  const key = conn ? `${conn.url}|${conn.source}|${conn.token}` : "";
  const [state, setState] = useState({ key, data: null, error: null });

  useEffect(() => {
    if (!conn) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await loadMeshSnapshot(conn);
        if (!cancelled) setState({ key, data, error: null });
      } catch (error) {
        if (!cancelled) setState((s) => ({ key, data: s.key === key ? s.data : null, error }));
      }
    };
    load();
    const id = setInterval(load, MESHMONITOR_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // the key covers everything in conn
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!conn) return { data: null, error: null };
  return state.key === key ? state : { data: null, error: null };
}

const timeAgo = (ms) => {
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  return `${Math.floor(s / 86400)} d`;
};

function MeshWidget({ openSettings }) {
  const { origin } = useHost();
  const [saved] = useStored("meshmonitor", null);
  const conn = validConn(saved) ? { url: saved.url, token: saved.token, source: saved.source || "default" } : null;
  const { data, error } = useMeshSnapshot(conn);
  useMinuteClock(); // keeps "5 min ago" current
  const live = data && !error && data.local?.connected !== false;

  return (
    <section className="widget widget-mesh px-3.5 pb-4 pt-3" aria-label={conn ? `Mesh: ${data ? `${data.hour} nodes heard in the last hour` : "loading"}` : "Mesh: not connected"}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--os-ink-3)]">
        <span className={`widget-led ${live ? "widget-led-on" : ""}`} aria-hidden="true" />
        <span className="min-w-0 truncate">{conn ? data?.local?.name || "mesh" : "mesh"}</span>
      </div>

      {!conn ? (
        <div className="flex h-[150px] flex-col items-center justify-center gap-2 text-center">
          <RadioTower className="h-8 w-8 text-[var(--os-ink-3)]" strokeWidth={1.4} aria-hidden="true" />
          <p className="text-[12px] leading-snug text-[var(--os-ink-2)]">Connect your MeshMonitor to see your mesh here.</p>
          <button type="button" onClick={openSettings} className="rounded-full px-3 py-1 text-[12px] ring-1 ring-[var(--os-line)] hover:bg-[var(--os-hover)]">
            set up…
          </button>
        </div>
      ) : !data ? (
        <div className="flex h-[150px] items-center justify-center px-2 text-center text-[12px] text-[var(--os-ink-3)]">
          {error ? describeMeshMonitorError(error, "", origin).split(". ")[0] + "." : "Listening…"}
        </div>
      ) : (
        <>
          <div className="mt-1.5 flex items-end gap-2">
            <span className="widget-weather-temp">{data.hour}</span>
            <span className="mb-1 text-[11px] leading-tight text-[var(--os-ink-3)]">
              heard in the
              <br />
              last hour
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 border-t border-[var(--w-line)] pt-2 text-center tabular-nums">
            {[
              ["day", data.day],
              ["week", data.week],
              ["all", data.total],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="text-[14px] font-semibold">{value}</div>
                <div className="text-[9.5px] uppercase tracking-[0.12em] text-[var(--os-ink-3)]">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 min-h-[34px] border-t border-[var(--w-line)] pt-2 text-[11px] leading-snug">
            {data.message ? (
              <>
                <div className="flex items-baseline justify-between gap-2 text-[10px] text-[var(--os-ink-3)]">
                  <span className="truncate font-semibold text-[var(--os-ink-2)]">{data.message.from}</span>
                  <span className="shrink-0">{timeAgo(data.message.at)}</span>
                </div>
                <p className="line-clamp-2 text-[var(--os-ink-2)]" dir="auto">
                  {data.message.text}
                </p>
              </>
            ) : (
              <p className="text-[var(--os-ink-3)]">No channel messages yet.</p>
            )}
          </div>
        </>
      )}
      <span className="widget-credit">MeshMonitor</span>
    </section>
  );
}

function MeshSettings() {
  const { origin } = useHost();
  const [saved, setSaved] = useStored("meshmonitor", null);
  const conn = validConn(saved) ? saved : null;
  const [url, setUrl] = useState(conn?.url || "");
  const [token, setToken] = useState(conn?.token || "");
  const [sources, setSources] = useState(null);
  const [source, setSource] = useState(conn?.source || "default");
  const [state, setState] = useState(null); // { kind: "testing" | "ok" | "error", text }

  const connect = async () => {
    const clean = normalizeMeshMonitorUrl(url);
    setUrl(clean);
    setState({ kind: "testing", text: "Connecting…" });
    try {
      const trial = { url: clean, token: token.trim(), source };
      const list = await meshMonitorFetch(trial, "/sources");
      const usable = Array.isArray(list) ? list : [];
      setSources(usable);
      const chosen = usable.some((s) => s.id === source) ? source : usable.find((s) => s.isPrimary)?.id || usable[0]?.id || "default";
      setSource(chosen);
      const status = await meshMonitorFetch({ ...trial, source: chosen }, `/sources/${encodeURIComponent(chosen)}/status`).catch(() => null);
      setSaved({ ...trial, source: chosen });
      const sourceName = usable.find((s) => s.id === chosen)?.name;
      const node = status?.longName || status?.shortName || status?.localNodeId;
      setState({ kind: "ok", text: `Connected${node ? ` to ${node}` : ""}${sourceName ? ` on ${sourceName}` : ""}.` });
    } catch (error) {
      setState({ kind: "error", text: describeMeshMonitorError(error, clean, origin) });
    }
  };

  const disconnect = () => {
    setSaved(null);
    setToken("");
    setSources(null);
    setState({ kind: "ok", text: "Disconnected. The address and token were removed." });
  };

  return (
    <form
      className="grid gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim() && token.trim()) connect();
      }}
    >
      <label className="wp-field">
        MeshMonitor address
        <input className="wp-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meshmonitor.example.com" inputMode="url" autoComplete="off" spellCheck={false} />
      </label>
      <label className="wp-field">
        API token
        <input className="wp-input font-mono" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="mm_v1_…" autoComplete="off" spellCheck={false} />
      </label>
      {sources && sources.length > 1 && (
        <label className="wp-field">
          source
          <select
            className="wp-input"
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              if (conn) setSaved({ ...conn, source: e.target.value });
            }}
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.type ? ` · ${s.type}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="flex justify-end gap-1.5">
        {conn && (
          <button type="button" onClick={disconnect} className="wp-btn text-[var(--os-warn)]">
            disconnect
          </button>
        )}
        <button type="submit" disabled={!url.trim() || !token.trim() || state?.kind === "testing"} className="wp-btn">
          {conn ? "save" : "connect"}
        </button>
      </div>
      {state && (
        <p className={`text-[11px] leading-snug ${state.kind === "error" ? "text-[var(--os-warn)]" : "text-[var(--os-ink-2)]"}`} aria-live="polite">
          {state.text}
        </p>
      )}
      <p className="text-[10.5px] leading-snug text-[var(--os-ink-3)]">
        Make a token in MeshMonitor&rsquo;s settings (read-only is plenty) and add <code className="font-mono">{origin}</code> to its{" "}
        <code className="font-mono">ALLOWED_ORIGINS</code>.
      </p>
    </form>
  );
}

export default { id: "mesh", label: "Mesh", Widget: MeshWidget, Settings: MeshSettings };
