import { useMemo } from "react";
import { motion } from "framer-motion";
import GlassTile from "../GlassTile";
import type { CalendarEvent } from "../../types";
import type { TileId } from "../../hooks/useGridLayout";

interface Props {
  events: CalendarEvent[];
  kidActivities?: CalendarEvent[];
  now: Date;
  tileId?: TileId;
  onTileResize?: (edge: "left" | "right" | "top" | "bottom", delta: number) => void;
  gridStyle?: React.CSSProperties;
  idleOpacity?: number;
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

export default function CurrentTask({
  events,
  kidActivities = [],
  now,
  tileId,
  onTileResize,
  gridStyle,
  idleOpacity,
}: Props) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // ── adult event ────────────────────────────────────────────────────────────
  const { current, next } = useMemo(
    () => pickCurrentAndNext(events, currentMinutes),
    [events, currentMinutes],
  );

  const progress = useMemo(() => {
    if (!current) return 0;
    const start = timeToMinutes(current.startTime);
    const end   = timeToMinutes(current.endTime);
    return Math.min(((currentMinutes - start) / (end - start)) * 100, 100);
  }, [current, currentMinutes]);

  const minutesLeft = useMemo(() => {
    if (!current) return null;
    return timeToMinutes(current.endTime) - currentMinutes;
  }, [current, currentMinutes]);

  const minutesUntilNext = useMemo(() => {
    if (current || !next) return null;
    return timeToMinutes(next.startTime) - currentMinutes;
  }, [current, next, currentMinutes]);

  const countdownProgress = useMemo(() => {
    if (current || !next) return 0;
    const nextStart = timeToMinutes(next.startTime);
    const sorted = [...events]
      .map((e) => timeToMinutes(e.endTime))
      .filter((t) => t <= currentMinutes)
      .sort((a, b) => b - a);
    const rangeStart = sorted[0] ?? currentMinutes - 60;
    const total = nextStart - rangeStart;
    if (total <= 0) return 0;
    return ((currentMinutes - rangeStart) / total) * 100;
  }, [current, next, events, currentMinutes]);

  // ── kid activity ───────────────────────────────────────────────────────────
  const { current: currentKid, next: nextKid } = useMemo(
    () => pickCurrentAndNext(kidActivities, currentMinutes),
    [kidActivities, currentMinutes],
  );

  const kidMinutesLeft = useMemo(() => {
    if (!currentKid) return null;
    return timeToMinutes(currentKid.endTime) - currentMinutes;
  }, [currentKid, currentMinutes]);

  const kidMinutesUntilNext = useMemo(() => {
    if (currentKid || !nextKid) return null;
    return timeToMinutes(nextKid.startTime) - currentMinutes;
  }, [currentKid, nextKid, currentMinutes]);

  // ── derived display values ─────────────────────────────────────────────────
  const displayEvent = current ?? next;
  const isActive     = !!current;
  const showCountdown = !current && !!next && minutesUntilNext !== null;

  const displayKid  = currentKid ?? nextKid;
  const kidIsActive = !!currentKid;

  return (
    <GlassTile
      delay={1}
      className="relative flex flex-col px-10 py-8"
      tileId={tileId}
      onResize={onTileResize}
      style={gridStyle}
      idleOpacity={idleOpacity}
      active={isActive}
    >
      {/* Ambient glow when an adult event is active */}
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(99,102,241,0.08), transparent 70%)",
          }}
        />
      )}

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-8 bottom-8 w-0.5 rounded-r-full"
        style={{
          background: isActive
            ? "linear-gradient(180deg, transparent, rgba(99,102,241,0.6), transparent)"
            : "linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />

      {/* ── Main (adult) event — grows to fill available space ── */}
      <div className="flex-1">
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
                <span className="text-sm font-medium" style={{ color: "rgba(165,167,255,0.5)" }}>
                  {minutesLeft}m remaining
                </span>
              )}
              {showCountdown && (
                <span className="text-sm font-medium tabular-nums" style={{ color: "rgba(165,167,255,0.45)" }}>
                  in {minutesUntilNext}m
                </span>
              )}
            </div>
          </>
        ) : (
          <h2 className="text-4xl font-light" style={{ color: "rgba(255,255,255,0.3)" }}>
            No upcoming events
          </h2>
        )}
      </div>

      {/* ── Progress bar (active event) ── */}
      {isActive && (
        <div className="mt-6 shrink-0">
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
                background: "linear-gradient(90deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4))",
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

      {/* ── Countdown ring (next event approaching) ── */}
      {showCountdown && (
        <div className="mt-6 shrink-0">
          <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
            <svg viewBox="0 0 56 56" className="absolute inset-0" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
              <circle
                cx="28" cy="28" r="24"
                fill="none"
                stroke="rgba(99,102,241,0.35)"
                strokeWidth="2"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - countdownProgress / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 60s linear" }}
              />
            </svg>
            <span className="text-xs tabular-nums" style={{ color: "rgba(165,167,255,0.4)" }}>
              {minutesUntilNext}m
            </span>
          </div>
        </div>
      )}

      {/* ── Kid activity row ── */}
      {displayKid && (
        <div
          className="mt-5 pt-4 shrink-0"
          style={{ borderTop: "1px solid rgba(139,92,246,0.18)" }}
        >
          {/* Label + countdown */}
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[9px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: kidIsActive ? "rgba(192,160,255,0.70)" : "rgba(192,160,255,0.42)" }}
            >
              Kid
            </span>
            {kidIsActive && kidMinutesLeft !== null ? (
              <span
                className="text-[10px] tabular-nums font-medium"
                style={{ color: "rgba(192,160,255,0.50)" }}
              >
                {kidMinutesLeft}m left
              </span>
            ) : kidMinutesUntilNext !== null ? (
              <span
                className="text-[10px] tabular-nums"
                style={{ color: "rgba(192,160,255,0.38)" }}
              >
                in {kidMinutesUntilNext}m
              </span>
            ) : null}
          </div>

          {/* Title */}
          <motion.p
            key={displayKid.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="font-semibold leading-tight"
            style={{
              fontSize: "clamp(1.15rem, 2.2vw, 1.65rem)",
              color: kidIsActive ? "rgba(216,180,255,0.92)" : "rgba(192,160,255,0.58)",
              letterSpacing: "-0.01em",
            }}
          >
            {displayKid.title}
          </motion.p>

          {/* Time range */}
          <p
            className="text-xs mt-1.5 tabular-nums"
            style={{ color: "rgba(192,160,255,0.38)" }}
          >
            {displayKid.startTime} – {displayKid.endTime}
          </p>
        </div>
      )}
    </GlassTile>
  );
}
