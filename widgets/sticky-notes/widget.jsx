import { useState } from "react";
import { useStored } from "../../src/shared/store.js";

/* Sticky Notes: several notes in five colors, saved as you type */
const NOTE_COLORS = { yellow: "#f2c94c", orange: "#f08a5d", green: "#8fb07a", blue: "#7fa6c4", grey: "#c9c4b8" };
const freshNote = (color = "yellow") => ({ id: `n${Date.now().toString(36)}`, text: "", color });

function cleanNotes(saved) {
  const list = Array.isArray(saved) ? saved.filter((n) => n && typeof n.text === "string") : [];
  return list.length
    ? list.map((n) => ({ id: String(n.id), text: n.text.slice(0, 2000), color: NOTE_COLORS[n.color] ? n.color : "yellow" }))
    : [{ id: "n1", text: "", color: "yellow" }];
}

function NotesWidget() {
  const [saved, save] = useStored("notes", null);
  const notes = cleanNotes(saved);
  const [index, setIndex] = useState(0);
  const at = Math.min(index, notes.length - 1);
  const current = notes[at];

  const update = (patch) => save(notes.map((n) => (n.id === current.id ? { ...n, ...patch } : n)));
  const add = () => {
    const next = [...notes, freshNote(Object.keys(NOTE_COLORS)[notes.length % 5])];
    save(next);
    setIndex(next.length - 1);
  };
  const remove = () => {
    const next = notes.filter((n) => n.id !== current.id);
    save(next.length ? next : [freshNote()]);
    setIndex((i) => Math.max(0, Math.min(i, next.length - 1)));
  };

  return (
    <section className="widget widget-notes" aria-label="Sticky notes" style={{ "--note": NOTE_COLORS[current.color] }}>
      <textarea
        value={current.text}
        maxLength={2000}
        onChange={(e) => update({ text: e.target.value })}
        placeholder="Write a note…"
        aria-label={`Note ${at + 1} of ${notes.length}`}
        spellCheck
        dir="auto"
        className="widget-notes-text"
      />
      <div className="widget-notes-bar">
        <button type="button" disabled={at === 0} onClick={() => setIndex(at - 1)} className="widget-notes-btn" aria-label="Previous note">
          ‹
        </button>
        <span className="tabular-nums">
          {at + 1}/{notes.length}
        </span>
        <button type="button" disabled={at >= notes.length - 1} onClick={() => setIndex(at + 1)} className="widget-notes-btn" aria-label="Next note">
          ›
        </button>
        <span className="ml-auto flex gap-1" role="radiogroup" aria-label="Note color">
          {Object.entries(NOTE_COLORS).map(([name, color]) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={current.color === name}
              aria-label={name}
              onClick={() => update({ color: name })}
              className={`h-3 w-3 rounded-full ${current.color === name ? "ring-2 ring-[var(--os-ink)] ring-offset-1 ring-offset-transparent" : ""}`}
              style={{ background: color }}
            />
          ))}
        </span>
        <button type="button" onClick={add} className="widget-notes-btn" aria-label="New note" title="New note">
          +
        </button>
        <button type="button" onClick={remove} className="widget-notes-btn" aria-label="Delete this note" title="Delete this note">
          ×
        </button>
      </div>
    </section>
  );
}

export default { id: "sticky-notes", label: "Sticky Notes", Widget: NotesWidget };
