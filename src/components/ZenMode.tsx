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

      {/* ── Single-column (no kid) ── */}
      {!displayKid && (
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
      )}

      {/* ── Split-column (kid present) ── */}
      {displayKid && (
        <div className="flex items-center w-full" style={{ padding: "0 8vw" }}>

          {/* Adult column */}
          <motion.div
            className="flex-1 flex flex-col items-center gap-5 text-center px-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
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
                fontSize: "clamp(2.2rem, 4.2vw, 4.8rem)",
                color: "rgba(255,255,255,0.85)",
                letterSpacing: "-0.02em",
              }}
            >
              {display?.title ?? "No upcoming events"}
            </h1>
            {display && (
              <span
                className="text-base font-light tabular-nums"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                {display.startTime} – {display.endTime}
              </span>
            )}
          </motion.div>

          {/* Vertical divider */}
          <motion.div
            className="self-stretch mx-6 w-px shrink-0"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.35) 30%, rgba(139,92,246,0.35) 70%, transparent 100%)",
              minHeight: "120px",
            }}
          />

          {/* Kid column */}
          <motion.div
            className="flex-1 flex flex-col items-center gap-5 text-center px-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-[0.25em]"
              style={{
                color: kidIsActive
                  ? "rgba(192,160,255,0.60)"
                  : "rgba(192,160,255,0.35)",
              }}
            >
              {kidIsActive ? "Kid · Now" : "Kid · Up Next"}
            </span>
            <h2
              className="font-semibold leading-tight"
              style={{
                fontSize: "clamp(2.2rem, 4.2vw, 4.8rem)",
                color: kidIsActive
                  ? "rgba(216,180,255,0.88)"
                  : "rgba(192,160,255,0.52)",
                letterSpacing: "-0.02em",
              }}
            >
              {displayKid.title}
            </h2>
            <span
              className="text-base font-light tabular-nums"
              style={{
                color: kidIsActive
                  ? "rgba(192,160,255,0.40)"
                  : "rgba(192,160,255,0.25)",
              }}
            >
              {displayKid.startTime} – {displayKid.endTime}
            </span>
          </motion.div>
        </div>
      )}

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
