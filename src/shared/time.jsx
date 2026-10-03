import { useEffect, useState } from "react";

export const TIME_ZONES = [
  { id: "auto", label: "this computer" },
  { id: "America/New_York", label: "Miami · New York" },
  { id: "America/Chicago", label: "Chicago" },
  { id: "America/Denver", label: "Denver" },
  { id: "America/Los_Angeles", label: "Los Angeles" },
  { id: "America/Anchorage", label: "Anchorage" },
  { id: "Pacific/Honolulu", label: "Honolulu" },
  { id: "America/Mexico_City", label: "Mexico City" },
  { id: "America/Sao_Paulo", label: "São Paulo" },
  { id: "Europe/London", label: "London" },
  { id: "Europe/Paris", label: "Paris · Berlin · Rome" },
  { id: "Europe/Athens", label: "Athens" },
  { id: "Europe/Moscow", label: "Moscow" },
  { id: "Asia/Jerusalem", label: "Jerusalem · Tel Aviv" },
  { id: "Asia/Dubai", label: "Dubai" },
  { id: "Asia/Kolkata", label: "Mumbai · Delhi" },
  { id: "Asia/Bangkok", label: "Bangkok" },
  { id: "Asia/Singapore", label: "Singapore" },
  { id: "Asia/Shanghai", label: "Shanghai" },
  { id: "Asia/Tokyo", label: "Tokyo" },
  { id: "Australia/Sydney", label: "Sydney" },
  { id: "Pacific/Auckland", label: "Auckland" },
  { id: "UTC", label: "UTC" },
];

export const zoneOf = (timeZone) => (!timeZone || timeZone === "auto" ? undefined : timeZone);

export function useClock(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export const useMinuteClock = () => useClock(60000);

// Times follow the shared language and 12/24-hour settings
export function formatTime(date, { locale, clock }, timeZone) {
  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hourCycle: clock === "24" ? "h23" : "h12",
    timeZone: zoneOf(timeZone),
  });
}

// Hours, minutes, and seconds for clock hands, in a time zone
export function clockParts(date, timeZone) {
  const zone = zoneOf(timeZone);
  if (!zone) return { h: date.getHours(), m: date.getMinutes(), s: date.getSeconds() };
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", hour: "numeric", minute: "numeric", second: "numeric" })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return { h: Number(parts.hour) % 24, m: Number(parts.minute), s: Number(parts.second) };
}

export function AnalogClock({ now, timeZone, className = "h-[18px] w-[18px]" }) {
  const parts = clockParts(now, timeZone);
  const s = parts.s;
  const m = parts.m + s / 60;
  const h = (parts.h % 12) + m / 60;
  const hand = (deg, len, width, color) => (
    <line x1="12" y1="12" x2="12" y2={12 - len} stroke={color} strokeWidth={width} strokeLinecap="round" transform={`rotate(${deg} 12 12)`} />
  );
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="var(--os-card)" stroke="var(--os-line)" />
      {[0, 90, 180, 270].map((d) => (
        <line key={d} x1="12" y1="2.6" x2="12" y2="4.2" stroke="var(--os-ink-3)" strokeWidth="1" transform={`rotate(${d} 12 12)`} />
      ))}
      {hand(h * 30, 5, 1.8, "var(--os-ink)")}
      {hand(m * 6, 7.5, 1.3, "var(--os-ink)")}
      {hand(s * 6, 8.5, 0.8, "var(--os-accent)")}
      <circle cx="12" cy="12" r="1.1" fill="var(--os-accent)" />
    </svg>
  );
}
