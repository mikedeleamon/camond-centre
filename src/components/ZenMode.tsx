import { useMemo } from "react";
import { motion } from "framer-motion";
import type { CalendarEvent } from "../types";

interface Props {
  events: CalendarEvent[];
  kidActivities?: CalendarEvent[];
  now: Date;
  onExit: () => void;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function pickCurrentAndNext(events: CalendarEvent[], nowMinutes: number) {
  let current: CalendarEvent | null = null;
  let next: CalendarEvent | null = null;
  for (const event of events) {
    const start = timeToMinutes(event.startTime);
    const end   = timeToMinutes(event.endTime);
    if (nowMinutes >= start && nowMinutes < end) {
      current = event;
    } else if (start > nowMinutes && !next) {
      next = event;
    }
  }
  return { current, next };
}

export default function ZenMode({ events, kidActivities = [], now, onExit }: Props) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const { current: currentEvent, next: nextEvent } = useMemo(
    () => pickCurrentAndNext(events, currentMinutes),
    [events, currentMinutes],
  );

  const { current: currentKid, next: nextKid } = useMemo(
    () => pickCurrentAndNext(kidActivities, currentMinutes),
    [kidActivities, currentMinutes],
  );

  const display    = currentEvent ?? nextEvent;
  const displayKid = currentKid ?? nextKid;
  const kidIsActive = !!currentKid;

  const label = currentEvent ? "Current Focus" : nextEvent ? "Up Next" : "All Clear";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-6 text-center px-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* ── Adult event ── */}
        <span
          className="text-xs font-semibold uppercase tracking-[0.25em]"
          style={{ color: "rgba(165,167,255,0.4)" }}
        >
          {label}
        </span>

        <h1
          className="font-semibold leading-tight"
          style={{
            fontSize: "clamp(3rem, 6vw, 6rem)",
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "-0.02em",
          }}
        >
          {display?.title ?? "No upcoming events"}
        </h1>

        {display && (
          <span
            className="text-lg font-light tabular-nums"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            {display.startTime} – {display.endTime}
          </span>
        )}

        {/* ── Kid activity ── */}
        {displayKid && (
          <motion.div
            className="flex flex-col items-center gap-1.5 mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* subtle separator */}
            <div
              className="w-12 h-px mb-2"
              style={{ background: "rgba(139,92,246,0.18)" }}
            />

            <span
              className="text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: "rgba(139,92,246,0.50)" }}
            >
              Kid{kidIsActive ? " · now" : ""}
            </span>

            <p
              className="font-medium text-center leading-snug"
              style={{
                fontSize: "clamp(1.1rem, 2vw, 1.8rem)",
                color: kidIsActive
                  ? "rgba(192,160,255,0.60)"
                  : "rgba(192,160,255,0.35)",
                letterSpacing: "-0.01em",
              }}
            >
              {displayKid.title}
            </p>

            <span
              className="text-sm font-light tabular-nums"
              style={{ color: "rgba(139,92,246,0.30)" }}
            >
              {displayKid.startTime} – {displayKid.endTime}
            </span>
          </motion.div>
        )}
      </motion.div>

      <button
        onClick={onExit}
        className="fixed top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        title="Exit Zen Mode"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
