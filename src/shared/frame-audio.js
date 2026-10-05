/* Audio for Zebar. Zebar sends every outside request through its service worker, which stores each response
   whole before passing it on, so a live radio stream (which never ends) never starts. A hidden data: frame has an
   origin of its own that the worker doesn't control, so audio played in there goes straight to the network.
   frameAudio() returns a stand-in for an <audio> element with the parts the radio uses. */

const FRAME_SCRIPT = `
const audios = new Map();
const send = (message) => parent.postMessage(message, "*");
const EVENTS = ["playing", "waiting", "error", "canplay", "loadedmetadata", "pause"];
onmessage = (e) => {
  const { id, op, value, call } = e.data || {};
  let a = audios.get(id);
  if (!a) {
    a = new Audio();
    a.preload = "none";
    EVENTS.forEach((ev) => a.addEventListener(ev, () => send({ id, ev })));
    audios.set(id, a);
  }
  if (op === "src") a.src = value;
  else if (op === "volume") a.volume = value;
  else if (op === "muted") a.muted = value;
  else if (op === "preload") a.preload = value;
  else if (op === "load") a.load();
  else if (op === "pause") a.pause();
  else if (op === "clear") { a.pause(); a.removeAttribute("src"); a.load(); }
  else if (op === "play") a.play().then(() => send({ id, call, ok: true }), (err) => send({ id, call, error: err && err.name }));
};
send({ ready: true });
`;

let frame = null;
let ready = null;
const handlers = new Map(); // id -> (message) => void
let nextId = 1;
let nextCall = 1;

function ensureFrame() {
  if (frame) return ready;
  frame = document.createElement("iframe");
  frame.hidden = true;
  frame.setAttribute("aria-hidden", "true");
  frame.src = `data:text/html;charset=utf-8,${encodeURIComponent(`<script>${FRAME_SCRIPT}</script>`)}`;
  ready = new Promise((resolve) => {
    window.addEventListener("message", (e) => {
      if (e.source !== frame.contentWindow || !e.data) return;
      if (e.data.ready) resolve();
      else handlers.get(e.data.id)?.(e.data);
    });
  });
  document.body.append(frame);
  return ready;
}

export function frameAudio() {
  const id = nextId++;
  const listeners = new Map(); // event -> Set of { fn, once }
  const calls = new Map(); // call -> { resolve, reject }
  const state = { src: "", volume: 1, muted: false, preload: "none" };
  const post = (message) => ensureFrame().then(() => frame.contentWindow.postMessage({ id, ...message }, "*"));

  handlers.set(id, (message) => {
    if (message.call) {
      const pending = calls.get(message.call);
      calls.delete(message.call);
      if (message.ok) pending?.resolve();
      else pending?.reject(Object.assign(new Error(message.error || "play"), { name: message.error || "Error" }));
      return;
    }
    for (const entry of [...(listeners.get(message.ev) || [])]) {
      if (entry.once) listeners.get(message.ev).delete(entry);
      entry.fn({ type: message.ev });
    }
  });

  return {
    get src() {
      return state.src;
    },
    set src(value) {
      state.src = value;
      post({ op: "src", value });
    },
    get volume() {
      return state.volume;
    },
    set volume(value) {
      state.volume = value;
      post({ op: "volume", value });
    },
    get muted() {
      return state.muted;
    },
    set muted(value) {
      state.muted = value;
      post({ op: "muted", value });
    },
    get preload() {
      return state.preload;
    },
    set preload(value) {
      state.preload = value;
      post({ op: "preload", value });
    },
    play() {
      const call = nextCall++;
      return new Promise((resolve, reject) => {
        calls.set(call, { resolve, reject });
        post({ op: "play", call });
      });
    },
    pause: () => post({ op: "pause" }),
    load: () => post({ op: "load" }),
    removeAttribute(name) {
      if (name !== "src") return;
      state.src = "";
      post({ op: "clear" });
    },
    addEventListener(ev, fn, options) {
      if (!listeners.has(ev)) listeners.set(ev, new Set());
      listeners.get(ev).add({ fn, once: !!options?.once });
    },
    removeEventListener(ev, fn) {
      for (const entry of listeners.get(ev) || []) if (entry.fn === fn) listeners.get(ev).delete(entry);
    },
  };
}
