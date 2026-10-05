import { useEffect, useState } from "react";

/* One radio for the whole page, outside React: a web page can unmount the widget and mount it again elsewhere
   (or show it in two places) and the station keeps playing. */
export const player = { status: "off", stream: null, audio: null, sound: null, listeners: new Set() }; // status: off | tuning | on | error

function set(patch) {
  Object.assign(player, patch);
  player.listeners.forEach((listener) => listener());
}

export function usePlayer() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const listener = () => rerender((n) => n + 1);
    player.listeners.add(listener);
    return () => player.listeners.delete(listener);
  }, []);
  return player;
}

function audio(createAudio) {
  if (!player.audio) {
    const a = createAudio();
    a.preload = "none";
    a.addEventListener("playing", () => set({ status: "on" }));
    a.addEventListener("waiting", () => player.status !== "off" && set({ status: "tuning" }));
    a.addEventListener("error", () => player.status !== "off" && set({ status: "error" }));
    player.audio = a;
  }
  return player.audio;
}

// sound: the host's { attach, detach } (it sets volume and mute), or null to use `volume` (0–100).
// createAudio: the host's, used once to make the page's audio element.
export function play(stream, { volume, sound, createAudio = () => new Audio() }) {
  const a = audio(createAudio);
  a.src = stream;
  if (sound) sound.attach(a);
  else a.volume = volume / 100;
  set({ status: "tuning", stream, sound });
  // Tuning again before a station answers interrupts this play request; that's not a lost signal
  a.play().catch((e) => e?.name !== "AbortError" && player.status !== "off" && set({ status: "error" }));
}

export function stop() {
  const a = player.audio;
  const sound = player.sound;
  set({ status: "off", stream: null, sound: null });
  if (!a) return;
  a.pause();
  a.removeAttribute("src");
  a.load();
  sound?.detach(a);
}

export function setVolume(volume) {
  if (player.audio && !player.sound) player.audio.volume = volume / 100;
}
