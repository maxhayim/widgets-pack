import { CASES, Choice, ColorChoice, caseStyle, isColor } from "../../src/shared/ui.jsx";
import { usePrefs, useShared } from "../../src/shared/store.js";
import { useMinuteClock } from "../../src/shared/time.jsx";

/* Calendar: this month, in your language, starting on your week's first day */
const CALENDAR_PREFS = { key: "calendar", defaults: { weekStart: "auto", accent: "", case: "" }, allowed: { weekStart: ["auto", "0", "1", "6"] } };

function weekStartsOn(locale) {
  try {
    const info = new Intl.Locale(locale);
    const first = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
    if (first) return first % 7; // 7 = Sunday
  } catch {
    /* older engines */
  }
  return /-(US|CA|BR|JP|IL|MX|PH)$/i.test(locale) || ["he", "ja"].includes(locale) ? 0 : 1;
}

function CalendarWidget() {
  const now = useMinuteClock();
  const [shared] = useShared();
  const [prefs] = usePrefs(CALENDAR_PREFS);
  const { locale } = shared;
  const start = prefs.weekStart === "auto" ? weekStartsOn(locale) : Number(prefs.weekStart);
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() - start + 7) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + ((start + i) % 7)).toLocaleDateString(locale, { weekday: "narrow" }));

  return (
    <section
      className="widget widget-calendar px-3.5 pb-3.5 pt-3"
      style={{ ...caseStyle(prefs.case), ...(isColor(prefs.accent) ? { "--os-accent": prefs.accent } : {}) }}
      aria-label={`Calendar: ${now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`}
    >
      <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.16em]">
        <span className="font-semibold text-[var(--os-accent)]" dir="auto">
          {now.toLocaleDateString(locale, { month: "long" })}
        </span>
        <span className="text-[var(--os-ink-3)]">{year}</span>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-[9.5px] text-[var(--os-ink-3)]" aria-hidden="true">
        {weekdays.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-0.5 text-center text-[11px] tabular-nums" aria-hidden="true">
        {cells.map((day, i) => (
          <span key={i} className={`mx-auto flex h-[21px] w-[21px] items-center justify-center rounded-full ${day === now.getDate() ? "bg-[var(--os-accent)] font-semibold text-white" : ""}`}>
            {day || ""}
          </span>
        ))}
      </div>
    </section>
  );
}

function CalendarSettings() {
  const [prefs, setPrefs] = usePrefs(CALENDAR_PREFS);
  return (
    <>
      <ColorChoice label="month and today" value={prefs.accent} onChange={(accent) => setPrefs({ accent })} />
      <ColorChoice label="case" value={prefs.case} onChange={(c) => setPrefs({ case: c })} presets={CASES} />
      <Choice
        label="week starts on"
        value={prefs.weekStart}
        options={[
          ["auto", "auto"],
          ["0", "Sun"],
          ["1", "Mon"],
          ["6", "Sat"],
        ]}
        onChange={(weekStart) => setPrefs({ weekStart })}
      />
    </>
  );
}

export default { id: "calendar", label: "Calendar", Widget: CalendarWidget, Settings: CalendarSettings };
