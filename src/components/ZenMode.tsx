import { useMemo } from "react";
import { motion } from "framer-motion";
import type { CalendarEvent } from "../types";

interface Props {
  events: CalendarEvent[];
  now: Date;
  onExit: () => void;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default function ZenMode({ events, now, onExit }: Props) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const currentEvent = useMemo(() => {
    for (const event of events) {
      const start = timeToMinutes(event.startTime);
      const end = timeToMinutes(event.endTime);
      if (currentMinutes >= start && currentMinutes < end) return event;
    }
    return null;
  }, [events, currentMinutes]);

  const nextEvent = useMemo(() => {
    for (const event of events) {
      if (timeToMinutes(event.startTime) > currentMinutes) return event;
    }
    return null;
  }, [events, currentMinutes]);

  const display = currentEvent ?? nextEvent;
  const label = currentEvent ? "Current Focus" : nextEvent ? "Up Next" : "All Clear";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center gap-6 text-center px-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
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
