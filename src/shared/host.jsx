import { createContext, useContext, useMemo } from "react";

/* Everything a widget needs from where it runs. Zebar passes a host that uses the desktop (see shell.jsx); a web page
   passes its own with <WidgetHost host={...}>. Anything left out uses the plain-browser default below. */

// Storage: strings by key. subscribe() reports changes made elsewhere (another window); changes made through
// set() on this page are reported by the pack itself.
export function localStorageStorage(prefix = "widgets-pack:") {
  return {
    get(key) {
      try {
        return localStorage.getItem(prefix + key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        if (value === null) localStorage.removeItem(prefix + key);
        else localStorage.setItem(prefix + key, value);
      } catch {
        /* storage full or blocked: the setting lasts until the page closes */
      }
    },
    subscribe(key, onChange) {
      const onStorage = (e) => e.key === prefix + key && onChange();
      window.addEventListener("storage", onStorage);
      window.addEventListener("focus", onChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("focus", onChange);
      };
    },
  };
}

export const browserHost = {
  storage: localStorageStorage(),
  // Only https links, in a new tab
  openUrl: (url) => {
    if (/^https:\/\/[^\s"']+$/.test(url)) window.open(url, "_blank", "noopener");
  },
  // Where you are, as { name, lat, lon }. The browser asks first; rounded to about a kilometer.
  locate: () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("unavailable"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ name: "you", lat: Math.round(p.coords.latitude * 100) / 100, lon: Math.round(p.coords.longitude * 100) / 100 }),
        () => reject(new Error("unavailable")),
        { maximumAge: 30 * 60 * 1000, timeout: 10000 },
      );
    }),
  // A hook returning [{ locale, temperature: "f"|"c", clock: "12"|"24", theme, timeZone? }, update(patch)], or null for the
  // pack's own. timeZone (an IANA zone or "auto") is what the Clock's "automatic" follows.
  useShared: null,
  // Sound for the radio: { attach(audio), detach(audio), openSettings?() }. With it, the host sets volume and mute and
  // the radio's volume slider is hidden. null: the radio sets its own volume.
  sound: null,
  // Makes the radio's audio element (anything with src, volume, muted, play(), pause(), load(), removeAttribute("src"),
  // and add/removeEventListener). Zebar plays audio in a frame its cache can't hold up (see frame-audio.js).
  createAudio: () => new Audio(),
  // Photos for the Photo Gallery: { usePhotos() -> [{ id, name, blob, thumb }], add(files), remove(id) }, or null for the pack's own
  photos: null,
  // Text on the clock face when it has no name or flag
  clockMark: "",
  // The address MeshMonitor has to allow (its ALLOWED_ORIGINS)
  origin: typeof location === "undefined" ? "" : location.origin,
};

const HostContext = createContext(browserHost);

export function WidgetHost({ host, children }) {
  const value = useMemo(() => ({ ...browserHost, ...host }), [host]);
  return <HostContext.Provider value={value}>{children}</HostContext.Provider>;
}

export const useHost = () => useContext(HostContext);
