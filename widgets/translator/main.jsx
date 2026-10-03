import { useState } from "react";
import { mountWidget } from "../../src/shared/shell.jsx";
import { useStored } from "../../src/shared/store.js";

/* Translator: the built-in on-device translator where the system web view has one, otherwise MyMemory */
const TRANSLATE_LANGS = [
  ["en", "English"],
  ["he", "עברית"],
  ["es", "Español"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["it", "Italiano"],
  ["pt", "Português"],
  ["ru", "Русский"],
  ["ar", "العربية"],
  ["zh", "中文"],
  ["ja", "日本語"],
];
const TRANSLATE_MAX = 450; // MyMemory's free limit is 500 bytes a request

const widgetSelect = "min-w-0 rounded-md bg-[var(--os-card)] px-1.5 py-1 text-[12px] ring-1 ring-[var(--w-line)] focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";
const widgetInput = "w-full min-w-0 rounded-md bg-[var(--os-card)] px-2 py-1 text-[13px] ring-1 ring-[var(--w-line)] focus-visible:outline-2 focus-visible:outline-[var(--os-accent)]";

const decodeEntities = (text) => new DOMParser().parseFromString(`<!doctype html><body>${text}`, "text/html").body.textContent || "";

async function translateText(text, from, to) {
  if (typeof self !== "undefined" && "Translator" in self) {
    try {
      const availability = await self.Translator.availability({ sourceLanguage: from, targetLanguage: to });
      if (availability === "available") {
        const translator = await self.Translator.create({ sourceLanguage: from, targetLanguage: to });
        return { text: await translator.translate(text), via: "on this computer" };
      }
    } catch {
      /* fall through to MyMemory */
    }
  }
  const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.responseData || json.quotaFinished) throw new Error("translate");
  return { text: decodeEntities(json.responseData.translatedText), via: "MyMemory" };
}

function TranslatorWidget() {
  const [langs, setLangs] = useStored("translator", { from: "en", to: "he" });
  const [text, setText] = useState("");
  const [result, setResult] = useState(null); // { text, via } | { error } | "working"

  const run = async () => {
    const input = text.trim();
    if (!input) return;
    setResult("working");
    try {
      setResult(await translateText(input, langs.from, langs.to));
    } catch {
      setResult({ error: "Couldn't translate right now. Try again in a little while." });
    }
  };

  return (
    <section className="widget widget-translate px-3.5 pb-3 pt-3" aria-label="Translator">
      <div className="flex items-center gap-1">
        <select value={langs.from} onChange={(e) => setLangs((l) => ({ ...l, from: e.target.value }))} className={`${widgetSelect} flex-1`} aria-label="From language">
          {TRANSLATE_LANGS.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setLangs((l) => ({ from: l.to, to: l.from }))} className="widget-mini-btn shrink-0" aria-label="Swap languages" title="Swap">
          ⇄
        </button>
        <select value={langs.to} onChange={(e) => setLangs((l) => ({ ...l, to: e.target.value }))} className={`${widgetSelect} flex-1`} aria-label="To language">
          {TRANSLATE_LANGS.map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, TRANSLATE_MAX))}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            run();
          }
        }}
        placeholder="Type, then press Enter"
        aria-label="Text to translate"
        dir="auto"
        rows={3}
        className={`${widgetInput} mt-2 resize-none leading-snug`}
      />
      <div className="mt-2 min-h-[54px] rounded-md bg-[var(--os-hover)] px-2 py-1.5 text-[13px] leading-snug select-text" aria-live="polite" dir="auto" data-nodrag>
        {result === "working" ? (
          <span className="text-[var(--os-ink-3)]">Translating…</span>
        ) : result?.error ? (
          <span className="text-[12px] text-[var(--os-warn)]">{result.error}</span>
        ) : result ? (
          result.text
        ) : (
          <span className="text-[var(--os-ink-3)]">The translation appears here.</span>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-end gap-2 text-[10px] text-[var(--os-ink-3)]">
        <span className="mr-auto truncate pl-5">{result?.via ? `by ${result.via}` : ""}</span>
        <button type="button" onClick={run} disabled={!text.trim() || result === "working"} className="rounded-full px-2 py-0.5 text-[11px] ring-1 ring-[var(--w-line)] hover:bg-[var(--os-hover)] disabled:opacity-40">
          translate
        </button>
      </div>
    </section>
  );
}

mountWidget({ id: "translator", label: "Translator", Widget: TranslatorWidget });
