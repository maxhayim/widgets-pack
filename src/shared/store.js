import { useEffect, useState } from "react";
import { useHost } from "./host.jsx";

/* Settings are stored through the host (see host.jsx). In Zebar that's the browser storage Zebar gives this pack, so
   the language, units, and clock style set in one widget apply to all of them. */
const EVENT = "wp-store";

const parse = (raw, fallback) => {
  if (raw === null || raw === undefined) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

// A stored value as React state. Follows changes from this widget, from other widgets on the page, and (through the
// host's subscribe) from other windows.
export function useStored(key, fallback) {
  const { storage } = useHost();
  const [value, setValue] = useState(() => parse(storage.get(key), fallback));
  useEffect(() => {
    const reload = () => setValue(parse(storage.get(key), fallback));
    const onLocal = (e) => e.detail === key && reload();
    window.addEventListener(EVENT, onLocal);
    const unsubscribe = storage.subscribe?.(key, reload);
    return () => {
      window.removeEventListener(EVENT, onLocal);
      unsubscribe?.();
    };
    // fallback is a fresh object each render; the key and storage decide what's read
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, storage]);
  const update = (next) => {
    const value = typeof next === "function" ? next(parse(storage.get(key), fallback)) : next;
    storage.set(key, value === undefined || value === null ? null : JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
  };
  return [value, update];
}

// Merges stored settings over defaults, dropping anything of the wrong type or not in `allowed`
export function usePrefs(spec) {
  const [saved, save] = useStored(spec.key, {});
  const prefs = cleanPrefs(spec, saved);
  const update = (patch) => save((current) => ({ ...cleanPrefs(spec, current), ...patch }));
  return [prefs, update];
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

function usePackShared() {
  const [shared, setShared] = usePrefs(SHARED_PREFS);
  return [{ ...shared, locale: shared.locale === "auto" ? systemLocale() : shared.locale }, setShared];
}

// The shared settings: the host's when it has them (a web page's own language and units), otherwise the pack's
export function useShared() {
  const host = useHost();
  // The host's hook never changes while the page is open, so this is always the same hook
  const useHostShared = host.useShared || usePackShared;
  return useHostShared();
}
