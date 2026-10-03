import { Settings as Gear } from "lucide-react";
import { StrictMode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { moveWindow, openUrl, resizeWindow, restorePosition, savePosition, setLayer, settleWindow, widgetName, windowPosition, zebarWidget } from "./desktop.js";
import { LOCALES, useShared, useStored } from "./store.js";
import "./theme.css";

/* The frame every widget sits in: drag it anywhere (it snaps to a 16px grid and stays on screen), and the gear
   (on hover) or a right-click turns it around to its settings. The window always fits the widget exactly. */

// Elements that keep their own clicks instead of starting a drag
const INTERACTIVE = "button, a, input, select, textarea, label, [contenteditable], [data-nodrag]";

export function mountWidget({ id, label, Widget, Settings }) {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <Frame id={id} label={label} Widget={Widget} Settings={Settings} />
    </StrictMode>,
  );
}

function Frame({ id, label, Widget, Settings }) {
  const name = widgetName(id);
  const rootRef = useRef(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shared] = useShared();
  const [layer] = useStored(`layer:${name}`, "normal");

  // Light or dark: the computer's setting unless one is picked
  useEffect(() => {
    if (shared.theme === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = shared.theme;
    document.documentElement.lang = shared.locale;
  }, [shared.theme, shared.locale]);

  useEffect(() => {
    document.title = label;
    restorePosition(name);
  }, [name, label]);

  useEffect(() => {
    setLayer(layer);
  }, [layer]);

  // The window follows the widget's size; if it grows past the screen edge it moves back on
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let timer;
    const fit = () => {
      const { width, height } = el.getBoundingClientRect();
      if (Math.abs(width - sizeRef.current.width) < 0.5 && Math.abs(height - sizeRef.current.height) < 0.5) return;
      const grew = width > sizeRef.current.width || height > sizeRef.current.height;
      sizeRef.current = { width, height };
      resizeWindow(width, height).catch(() => {});
      if (grew) {
        clearTimeout(timer);
        timer = setTimeout(() => settleWindow(width, height).catch(() => {}), 60);
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const onKey = (e) => e.key === "Escape" && setSettingsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [settingsOpen]);

  // Dragging moves the whole window. A press that doesn't move stays a click.
  const onPointerDown = async (e) => {
    if (e.button !== 0 || e.target.closest(INTERACTIVE) || !zebarWidget()) return;
    const el = e.currentTarget;
    const pointerId = e.pointerId;
    const startX = e.screenX;
    const startY = e.screenY;
    el.setPointerCapture(pointerId);
    const origin = await windowPosition().catch(() => null);
    if (!origin) return;
    let moved = false;
    let frame = 0;
    let target = origin;

    const onMove = (ev) => {
      const dx = ev.screenX - startX;
      const dy = ev.screenY - startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      if (!moved) document.body.classList.add("wp-dragging");
      moved = true;
      target = { x: origin.x + dx, y: origin.y + dy };
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          moveWindow(target.x, target.y).catch(() => {});
        });
      }
    };
    const onUp = async () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      document.body.classList.remove("wp-dragging");
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
      if (!moved) return;
      // The click that ends a drag isn't a click on whatever is under the pointer
      window.addEventListener("click", (c) => c.stopPropagation(), { capture: true, once: true });
      cancelAnimationFrame(frame);
      await moveWindow(target.x, target.y).catch(() => {});
      const { width, height } = sizeRef.current;
      const settled = await settleWindow(width, height).catch(() => null);
      if (settled) savePosition(name, settled);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
  };

  return (
    <div
      ref={rootRef}
      className="wp-root"
      onPointerDown={onPointerDown}
      onContextMenu={(e) => {
        if (e.target.closest("input, textarea")) return; // keep copy and paste
        e.preventDefault();
        setSettingsOpen((open) => !open);
      }}
    >
      <div className="wp-frame relative">
        {/* The widget stays mounted behind its settings, so a playing radio keeps playing */}
        <div hidden={settingsOpen}>
          <Widget openSettings={() => setSettingsOpen(true)} />
        </div>
        {settingsOpen ? (
          <SettingsPanel name={name} label={label} Settings={Settings} close={() => setSettingsOpen(false)} />
        ) : (
          <button type="button" className="wp-gear" onClick={() => setSettingsOpen(true)} aria-label={`${label} settings`} title="Settings (or right-click)">
            <Gear className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

function SettingsPanel({ name, label, Settings, close }) {
  const [shared, setShared] = useShared();
  const [stored] = useStored("shared", {});
  const [layer, setLayerPref] = useStored(`layer:${name}`, "normal");

  return (
    <section className="widget wp-settings" aria-label={`${label} settings`}>
      <div className="flex items-center justify-between">
        <span className="wp-label">{label.toLowerCase()}</span>
        <button type="button" onClick={close} className="wp-btn wp-btn-main">
          done
        </button>
      </div>

      {Settings && (
        <div className="mt-2.5 grid gap-2.5">
          <Settings close={close} />
        </div>
      )}

      <div className="wp-section grid gap-2">
        <span className="wp-label">all widgets</span>
        <label className="wp-field">
          language
          <select className="wp-input" value={stored?.locale || "auto"} onChange={(e) => setShared({ locale: e.target.value })}>
            {LOCALES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Choice label="clock" value={shared.clock} options={[["12", "12h"], ["24", "24h"]]} onChange={(clock) => setShared({ clock })} />
          <Choice label="temperature" value={shared.temperature} options={[["f", "°F"], ["c", "°C"]]} onChange={(temperature) => setShared({ temperature })} />
        </div>
        <Choice
          label="look"
          value={shared.theme}
          options={[
            ["auto", "auto"],
            ["light", "light"],
            ["dark", "dark"],
          ]}
          onChange={(theme) => setShared({ theme })}
        />
      </div>

      <div className="wp-section grid gap-2">
        <span className="wp-label">this widget</span>
        <Choice
          label="sits"
          value={layer}
          options={[
            ["desktop", "below"],
            ["normal", "normal"],
            ["top", "on top"],
          ]}
          onChange={setLayerPref}
        />
      </div>
    </section>
  );
}

// A small segmented control
export function Choice({ label, value, options, onChange }) {
  return (
    <div className="wp-field" role="radiogroup" aria-label={label}>
      {label}
      <div className="flex gap-1">
        {options.map(([id, text]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            onClick={() => onChange(id)}
            className={`wp-btn flex-1 px-1 ${value === id ? "wp-btn-main" : ""}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

// Opens in the default browser rather than inside the widget
export function ExternalLink({ href, className, children, ...rest }) {
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        openUrl(href);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
