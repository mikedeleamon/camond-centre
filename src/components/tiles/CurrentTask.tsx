import { useMemo } from "react";
import { motion } from "framer-motion";
import GlassTile from "../GlassTile";
import type { CalendarEvent } from "../../types";

interface Props {
  events: CalendarEvent[];
  now: Date;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export default function CurrentTask({ events, now }: Props) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const { current, next } = useMemo(() => {
    let currentEvent: CalendarEvent | null = null;
    let nextEvent: CalendarEvent | null = null;

    for (const event of events) {
      const start = timeToMinutes(event.startTime);
      const end = timeToMinutes(event.endTime);

      if (currentMinutes >= start && currentMinutes < end) {
        currentEvent = event;
      } else if (start > currentMinutes && !nextEvent) {
        nextEvent = event;
      }
    }

    return { current: currentEvent, next: nextEvent };
  }, [events, currentMinutes]);

  const progress = useMemo(() => {
    if (!current) return 0;
    const start = timeToMinutes(current.startTime);
    const end = timeToMinutes(current.endTime);
    return Math.min(((currentMinutes - start) / (end - start)) * 100, 100);
  }, [current, currentMinutes]);

  const minutesLeft = useMemo(() => {
    if (!current) return null;
    const end = timeToMinutes(current.endTime);
    return end - currentMinutes;
  }, [current, currentMinutes]);

  const displayEvent = current ?? next;
  const isActive = !!current;

  return (
    <GlassTile
      gridArea="curr"
      delay={1}
      className="relative flex flex-col justify-between px-10 py-8 overflow-hidden"
    >
      {/* Ambient inner glow when active */}
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(99,102,241,0.08), transparent 70%)",
          }}
        />
      )}

      {/* Vertical accent bar */}
      <div
        className="absolute left-0 top-8 bottom-8 w-0.5 rounded-r-full"
        style={{
          background: isActive
            ? "linear-gradient(180deg, transparent, rgba(99,102,241,0.6), transparent)"
            : "linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />

      <div>
        <span
          className="text-xs font-semibold uppercase tracking-[0.18em] mb-4 block"
          style={{
            color: isActive ? "rgba(165,167,255,0.7)" : "rgba(255,255,255,0.25)",
          }}
        >
          {isActive ? "Current Focus" : next ? "Up Next" : "All Clear"}
        </span>

        {displayEvent ? (
          <>
            <motion.h2
              key={displayEvent.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-semibold leading-tight mb-3"
              style={{
                fontSize: "clamp(1.75rem, 3vw, 2.8rem)",
                color: isActive ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.45)",
                letterSpacing: "-0.01em",
              }}
            >
              {displayEvent.title}
            </motion.h2>

            <div className="flex items-center gap-4">
              <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.3)" }}>
                {displayEvent.startTime} – {displayEvent.endTime}
              </span>
              {displayEvent.location && (
                <span className="text-sm font-light" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {displayEvent.location}
                </span>
              )}
              {isActive && minutesLeft !== null && (
                <span
                  className="text-sm font-medium"
                  style={{ color: "rgba(165,167,255,0.5)" }}
                >
                  {minutesLeft}m remaining
                </span>
              )}
            </div>
          </>
        ) : (
          <h2
            className="text-4xl font-light"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            No upcoming events
          </h2>
        )}
      </div>

      {/* Progress section — only when active */}
      {isActive && (
        <div className="mt-6">
          <div
            className="w-full h-0.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{
                background:
                  "linear-gradient(90deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4))",
                boxShadow: "0 0 8px rgba(99,102,241,0.3)",
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
              {displayEvent?.startTime}
            </span>
            <span className="text-xs tabular-nums" style={{ color: "rgba(165,167,255,0.4)" }}>
              {Math.round(progress)}%
            </span>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
              {displayEvent?.endTime}
            </span>
          </div>
        </div>
      )}
    </GlassTile>
  );
}
