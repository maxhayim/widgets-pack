import { useEffect, useState } from "react";

/* Settings live in the browser storage Zebar gives this pack. Every widget in the pack can read them, so the
   language, units, and clock style set in one widget apply to all of them. Keys are prefixed in case another
   pack ever shares the storage. */
const PREFIX = "widgets-pack:";
const EVENT = "wp-store";

export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    if (value === undefined || value === null) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the setting lasts until the widget closes */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

// A stored value as React state. Follows changes from this widget and from the pack's other widgets.
export function useStored(key, fallback) {
  const [value, setValue] = useState(() => readJSON(key, fallback));
  useEffect(() => {
    const reload = () => setValue(readJSON(key, fallback));
    const onLocal = (e) => e.detail === key && reload();
    const onOther = (e) => e.key === PREFIX + key && reload();
    window.addEventListener(EVENT, onLocal);
    window.addEventListener("storage", onOther);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener(EVENT, onLocal);
      window.removeEventListener("storage", onOther);
      window.removeEventListener("focus", reload);
    };
    // fallback is a fresh object each render; the key decides what's read
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = (next) => writeJSON(key, typeof next === "function" ? next(readJSON(key, fallback)) : next);
  return [value, update];
}

// Merges stored settings over defaults, dropping anything of the wrong type or not in `allowed`
export function usePrefs(spec) {
  const [saved, save] = useStored(spec.key, {});
  const prefs = cleanPrefs(spec, saved);
  const update = (patch) => save((current) => ({ ...cleanPrefs(spec, current), ...patch }));
  return [prefs, update];
}

export function readPrefs(spec) {
  return cleanPrefs(spec, readJSON(spec.key, {}));
}

function cleanPrefs({ defaults, allowed = {} }, saved) {
  const source = saved && typeof saved === "object" ? saved : {};
  const fallback = typeof defaults === "function" ? defaults() : defaults;
  return Object.fromEntries(
    Object.entries(fallback).map(([name, value]) => {
      const candidate = source[name];
      const ok = typeof candidate === typeof value && (!allowed[name] || allowed[name].includes(candidate));
      return [name, ok ? candidate : value];
    }),
  );
}

/* Shared by every widget: language, temperature unit, 12 or 24 hours, and light or dark.
   The defaults come from the computer's own settings. */
const systemLocale = () => navigator.language || "en-US";
const systemClock = () => {
  try {
    const cycle = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions().hourCycle;
    return cycle === "h23" || cycle === "h24" ? "24" : "12";
  } catch {
    return "12";
  }
};
// Fahrenheit where it's the everyday unit
const systemTemperature = () => (/-(US|LR|MM|BS|BZ|KY|PW|FM|MH)$/i.test(systemLocale()) ? "f" : "c");

export const LOCALES = [
  { id: "auto", label: "match computer" },
  { id: "en-US", label: "English (US)" },
  { id: "en-GB", label: "English (UK)" },
  { id: "he-IL", label: "עברית" },
  { id: "es-ES", label: "Español" },
  { id: "fr-FR", label: "Français" },
  { id: "de-DE", label: "Deutsch" },
  { id: "it-IT", label: "Italiano" },
  { id: "pt-BR", label: "Português (Brasil)" },
  { id: "ru-RU", label: "Русский" },
  { id: "ar", label: "العربية" },
  { id: "zh-CN", label: "中文" },
  { id: "ja-JP", label: "日本語" },
];

export const SHARED_PREFS = {
  key: "shared",
  defaults: () => ({ locale: "auto", temperature: systemTemperature(), clock: systemClock(), theme: "auto" }),
  allowed: { locale: LOCALES.map((l) => l.id), temperature: ["f", "c"], clock: ["12", "24"], theme: ["auto", "light", "dark"] },
};

// The shared settings, with "match computer" resolved to an actual locale
export function useShared() {
  const [shared, setShared] = usePrefs(SHARED_PREFS);
  return [{ ...shared, locale: shared.locale === "auto" ? systemLocale() : shared.locale }, setShared];
}
