import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { availableMonitors, currentMonitor } from "@tauri-apps/api/window";
import { createProvider, currentWidget, shellExec } from "zebar";

/* Everything that talks to Zebar and the widget's window. Each call is safe outside Zebar too (in a normal
   browser while developing), where it quietly does nothing. */

let cached;
export function zebarWidget() {
  if (cached === undefined) {
    try {
      cached = currentWidget();
    } catch {
      cached = null;
    }
  }
  return cached;
}

const tauriWindow = () => zebarWidget()?.tauriWindow ?? null;
export const widgetName = (fallback) => zebarWidget()?.name || fallback;

const platform = () => {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return "windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macos";
  return "linux";
};

// Links open in the default browser. Zebar only runs the programs zpack.json allows, and only for https links.
export async function openUrl(url) {
  if (!/^https:\/\/[^\s"']+$/.test(url)) return;
  if (!zebarWidget()) {
    window.open(url, "_blank", "noopener");
    return;
  }
  const program = { windows: "explorer", macos: "open", linux: "xdg-open" }[platform()];
  try {
    await shellExec(program, url);
  } catch {
    /* not allowed or not installed: nothing else to try */
  }
}

export async function setLayer(layer) {
  const zOrder = { normal: "normal", top: "top_most", desktop: "bottom_most" }[layer] || "normal";
  try {
    await zebarWidget()?.setZOrder(zOrder);
  } catch {
    /* older Zebar */
  }
}

// Monitors in logical pixels, plus a fingerprint of the layout so positions are remembered per setup
async function monitors() {
  const list = (await availableMonitors().catch(() => [])) || [];
  const rects = list.map((m) => ({
    x: m.position.x / m.scaleFactor,
    y: m.position.y / m.scaleFactor,
    w: m.size.width / m.scaleFactor,
    h: m.size.height / m.scaleFactor,
    name: m.name || "",
  }));
  const layout = rects.map((r) => `${r.name}@${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)}x${Math.round(r.h)}`).join("|");
  return { rects, layout };
}

export async function windowPosition() {
  const win = tauriWindow();
  if (!win) return null;
  const [pos, scale] = await Promise.all([win.outerPosition(), win.scaleFactor()]);
  return { x: pos.x / scale, y: pos.y / scale };
}

export async function moveWindow(x, y) {
  await tauriWindow()?.setPosition(new LogicalPosition(Math.round(x), Math.round(y)));
}

export async function resizeWindow(width, height) {
  await tauriWindow()?.setSize(new LogicalSize(Math.ceil(width), Math.ceil(height)));
}

const GRID = 16;

// Snap to the 16px grid and keep the whole widget on the monitor it's on
export async function settleWindow(width, height) {
  const win = tauriWindow();
  if (!win) return null;
  const pos = await windowPosition();
  const monitor = await currentMonitor().catch(() => null);
  let { x, y } = pos;
  x = Math.round(x / GRID) * GRID;
  y = Math.round(y / GRID) * GRID;
  if (monitor) {
    const s = monitor.scaleFactor;
    const left = monitor.position.x / s;
    const top = monitor.position.y / s;
    const right = left + monitor.size.width / s;
    const bottom = top + monitor.size.height / s;
    x = Math.min(Math.max(x, left), right - width);
    y = Math.min(Math.max(y, top), bottom - height);
  }
  await moveWindow(x, y);
  return { x, y };
}

const positionKey = (name, layout) => `widgets-pack:position:${name}:${layout}`;

export async function savePosition(name, pos) {
  const { layout } = await monitors();
  try {
    localStorage.setItem(positionKey(name, layout), JSON.stringify(pos));
  } catch {
    /* ignore */
  }
}

// Puts the widget back where it was last left on this monitor setup, if that spot is still on a screen
export async function restorePosition(name) {
  if (!tauriWindow()) return;
  const { rects, layout } = await monitors();
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(positionKey(name, layout)) || "null");
  } catch {
    saved = null;
  }
  if (!saved || !Number.isFinite(saved.x) || !Number.isFinite(saved.y)) return;
  const onScreen = rects.some((r) => saved.x >= r.x - 1 && saved.y >= r.y - 1 && saved.x < r.x + r.w && saved.y < r.y + r.h);
  if (onScreen) await moveWindow(saved.x, saved.y);
}

// Roughly where this computer is, from its internet address (Zebar's ip provider). City-level, no permission prompt.
export function approximateLocation() {
  return new Promise((resolve, reject) => {
    if (!zebarWidget()) {
      reject(new Error("unavailable"));
      return;
    }
    let provider;
    try {
      provider = createProvider({ type: "ip", refreshInterval: 60 * 60 * 1000 });
    } catch {
      reject(new Error("unavailable"));
      return;
    }
    const done = (fn) => (value) => {
      provider.stop().catch(() => {});
      fn(value);
    };
    if (provider.output) done(resolve)(provider.output);
    else {
      provider.onOutput(done(resolve));
      provider.onError(done(() => reject(new Error("unavailable"))));
    }
  });
}
