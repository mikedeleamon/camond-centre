import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import GlassTile from "../GlassTile";
import type { CalendarEvent, Task } from "../../types";
import type { TileId } from "../../hooks/useGridLayout";

interface Props {
  events: CalendarEvent[];
  now: Date;
  kidEvents?: CalendarEvent[];
  tasks?: Task[];
  tileId?: TileId;
  onTileResize?: (edge: "left" | "right" | "top" | "bottom", delta: number) => void;
  gridStyle?: React.CSSProperties;
  idleOpacity?: number;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  if (total >= 24 * 60) return "23:59";
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatHour(hour: number): string {
  if (hour === 0)  return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour > 12)   return `${hour - 12} PM`;
  return `${hour} AM`;
}

const COLORS = {
  calReg:  { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.25)",  text: "rgba(165,180,255,0.80)", sub: "rgba(99,102,241,0.40)"  },
  calKid:  { bg: "rgba(139,92,246,0.10)",  border: "rgba(139,92,246,0.20)",  text: "rgba(192,160,255,0.75)", sub: "rgba(192,160,255,0.35)"  },
  taskReg: { bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.22)",  text: "rgba(110,231,183,0.85)", sub: "rgba(110,231,183,0.40)"  },
  taskKid: { bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.22)",  text: "rgba(252,211,77,0.85)",  sub: "rgba(252,211,77,0.40)"   },
};

// ── Popover ───────────────────────────────────────────────────────────────────

interface PopoverProps {
  event: CalendarEvent;
  onClose: () => void;
  isKid?: boolean;
  isTask?: boolean;
}

function EventPopover({ event, onClose, isKid, isTask }: PopoverProps) {
  const c = isTask
    ? (isKid ? COLORS.taskKid : COLORS.taskReg)
    : (isKid ? COLORS.calKid  : COLORS.calReg);

  return (
    <div
      className="absolute z-20 rounded-xl px-3.5 py-3 shadow-xl"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        minWidth: 200,
        maxWidth: 260,
        background: "rgba(12,14,30,0.96)",
        border: `1px solid ${c.border}`,
        backdropFilter: "blur(12px)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium leading-snug" style={{ color: c.text }}>
          {event.title}
        </p>
        <button
          onClick={onClose}
          className="shrink-0 text-white/25 hover:text-white/60 transition-colors mt-0.5"
          style={{ fontSize: 14, lineHeight: 1 }}
        >
          ×
        </button>
      </div>
      <p className="text-[11px] tabular-nums" style={{ color: c.sub }}>
        {event.startTime} – {event.endTime}
      </p>
      {event.location && (
        <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.30)" }}>
          📍 {event.location}
        </p>
      )}
      {event.notes && (
        <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
          {event.notes}
        </p>
      )}
    </div>
  );
}

// ── EventBlock ────────────────────────────────────────────────────────────────

function EventBlock({
  event, dayStart, dayRange, isKid, isTask, onClick,
}: {
  event: CalendarEvent;
  dayStart: number;
  dayRange: number;
  isKid?: boolean;
  isTask?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const startMin = timeToMinutes(event.startTime);
  const endMin   = timeToMinutes(event.endTime);
  const top    = ((startMin - dayStart) / dayRange) * 100;
  const height = ((endMin - startMin)   / dayRange) * 100;

  const c = isTask
    ? (isKid ? COLORS.taskKid : COLORS.taskReg)
    : (isKid ? COLORS.calKid  : COLORS.calReg);

  const label = isTask ? "Task" : isKid ? "Kid" : null;

  return (
    <div
      className="absolute rounded-lg px-2.5 py-1.5 border overflow-hidden cursor-pointer transition-all duration-150 hover:brightness-125"
      style={{
        left:            isKid ? "calc(50% + 22px)" : "44px",
        right:           isKid ? "0"                : "50%",
        top:             `${top}%`,
        height:          `${Math.max(height, 3.5)}%`,
        backgroundColor: c.bg,
        borderColor:     c.border,
      }}
      onClick={onClick}
    >
      {label && (
        <span className="text-[8px] uppercase tracking-wider" style={{ color: c.sub }}>
          {label}
        </span>
      )}
      <p
        className="text-sm font-medium truncate leading-tight"
        style={{ color: c.text }}
      >
        {event.title}
      </p>
      {height > 5 && (
        <p className="text-[10px] mt-0.5" style={{ color: c.sub }}>
          {event.startTime} – {event.endTime}
        </p>
      )}
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

export default function Timeline({
  events,
  now,
  kidEvents = [],
  tasks = [],
  tileId,
  onTileResize,
  gridStyle,
  idleOpacity,
}: Props) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayStart = 0;
  const dayEnd   = 24 * 60;
  const dayRange = dayEnd - dayStart; // 1440

  const taskEvents = useMemo(() => {
    const today =
      `${now.getFullYear()}-` +
      `${String(now.getMonth() + 1).padStart(2, "0")}-` +
      `${String(now.getDate()).padStart(2, "0")}`;

    const regular: CalendarEvent[] = [];
    const kid:     CalendarEvent[] = [];

    for (const t of tasks) {
      if (t.completed || t.dueDate !== today || !t.dueTime || !t.duration) continue;
      const ev: CalendarEvent = {
        id:        `task-${t.id}`,
        title:     t.title || "Untitled task",
        startTime: t.dueTime,
        endTime:   addMinutes(t.dueTime, t.duration),
      };
      (t.isKid ? kid : regular).push(ev);
    }
    return { regular, kid };
  }, [tasks, now.getFullYear(), now.getMonth(), now.getDate()]);

  const hasKidLane = kidEvents.length > 0 || taskEvents.kid.length > 0;

  const indicatorPercent = useMemo(() => {
    if (currentMinutes < dayStart) return 0;
    if (currentMinutes > dayEnd)   return 100;
    return ((currentMinutes - dayStart) / dayRange) * 100;
  }, [currentMinutes]);

  const timelineHeight = (dayRange / 60) * 72;

  // ── selected event popover ────────────────────────────────────────────────
  const [selectedEvent, setSelectedEvent] = useState<{
    event: CalendarEvent; isKid?: boolean; isTask?: boolean;
  } | null>(null);

  // ── scrollable ref + jump-to-now ─────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);

  const jumpToNow = useCallback(() => {
    if (!scrollRef.current) return;
    const scrollable = scrollRef.current;
    const scrollableH = scrollable.clientHeight;
    const targetPx = (indicatorPercent / 100) * timelineHeight - scrollableH / 2;
    scrollable.scrollTo({ top: Math.max(0, targetPx), behavior: "smooth" });
  }, [indicatorPercent, timelineHeight]);

  // Auto-scroll to now on mount
  useEffect(() => {
    const raf = requestAnimationFrame(jumpToNow);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── drag-to-scroll ────────────────────────────────────────────────────────
  const dragState = useRef<{ startY: number; startScrollTop: number } | null>(null);

  function onMouseDown(e: React.MouseEvent) {
    if (!scrollRef.current) return;
    // Only initiate drag-scroll on the timeline body (not on event blocks)
    if ((e.target as HTMLElement).closest(".absolute.rounded-lg")) return;
    dragState.current = { startY: e.clientY, startScrollTop: scrollRef.current.scrollTop };
    e.preventDefault();
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragState.current || !scrollRef.current) return;
      const dy = dragState.current.startY - e.clientY;
      scrollRef.current.scrollTop = dragState.current.startScrollTop + dy;
    }
    function onMouseUp() {
      dragState.current = null;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <GlassTile
      delay={2}
      className="flex flex-col"
      tileId={tileId}
      onResize={onTileResize}
      style={gridStyle}
      idleOpacity={idleOpacity}
    >
      {/* Fixed header */}
      <div className="flex items-center gap-3 mb-2 shrink-0">
        <h3 className="tile-label">Timeline</h3>
        <div className="flex-1" />
        {/* Jump-to-now button */}
        <button
          onClick={jumpToNow}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-white/30 hover:text-indigo-300/70 transition-colors"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          title="Jump to now"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/70 shrink-0" />
          Now
        </button>
      </div>

      {/* Swimlane headers */}
      {hasKidLane && (
        <div className="flex items-center mb-1 shrink-0" style={{ paddingLeft: 44 }}>
          <span className="flex-1 text-[9px] text-indigo-300/30 uppercase tracking-wider text-center mr-6">Me</span>
          <span className="flex-1 text-[9px] text-purple-300/30 uppercase tracking-wider text-center">Kid</span>
        </div>
      )}

      {/* Scrollable body */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-clip pr-1"
        style={{ cursor: dragState.current ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onClick={() => setSelectedEvent(null)}
      >
        <div className="relative" style={{ height: timelineHeight }}>

          {/* Hour grid lines */}
          {HOURS.map((hour) => {
            const top = ((hour * 60 - dayStart) / dayRange) * 100;
            return (
              <div
                key={hour}
                className="absolute left-0 right-0 flex items-center"
                style={{ top: `${top}%` }}
              >
                <span className="text-[10px] text-white/20 w-10 shrink-0 text-right pr-2 tabular-nums">
                  {formatHour(hour)}
                </span>
                <div className="flex-1 h-px bg-white/[0.04]" />
              </div>
            );
          })}

          {/* Calendar events — regular lane */}
          {events.map((event) => {
            const s = timeToMinutes(event.startTime);
            const e = timeToMinutes(event.endTime);
            if (s >= dayEnd || e <= dayStart) return null;
            return (
              <EventBlock
                key={event.id}
                event={event}
                dayStart={dayStart}
                dayRange={dayRange}
                onClick={(ev) => { ev.stopPropagation(); setSelectedEvent({ event, isKid: false, isTask: false }); }}
              />
            );
          })}

          {/* Calendar events — kid lane */}
          {kidEvents.map((event) => {
            const s = timeToMinutes(event.startTime);
            const e = timeToMinutes(event.endTime);
            if (s >= dayEnd || e <= dayStart) return null;
            return (
              <EventBlock
                key={`kid-${event.id}`}
                event={event}
                dayStart={dayStart}
                dayRange={dayRange}
                isKid
                onClick={(ev) => { ev.stopPropagation(); setSelectedEvent({ event, isKid: true, isTask: false }); }}
              />
            );
          })}

          {/* Task events — regular lane */}
          {taskEvents.regular.map((event) => {
            const s = timeToMinutes(event.startTime);
            const e = timeToMinutes(event.endTime);
            if (s >= dayEnd || e <= dayStart) return null;
            return (
              <EventBlock
                key={event.id}
                event={event}
                dayStart={dayStart}
                dayRange={dayRange}
                isTask
                onClick={(ev) => { ev.stopPropagation(); setSelectedEvent({ event, isKid: false, isTask: true }); }}
              />
            );
          })}

          {/* Task events — kid lane */}
          {taskEvents.kid.map((event) => {
            const s = timeToMinutes(event.startTime);
            const e = timeToMinutes(event.endTime);
            if (s >= dayEnd || e <= dayStart) return null;
            return (
              <EventBlock
                key={event.id}
                event={event}
                dayStart={dayStart}
                dayRange={dayRange}
                isKid
                isTask
                onClick={(ev) => { ev.stopPropagation(); setSelectedEvent({ event, isKid: true, isTask: true }); }}
              />
            );
          })}

          {/* Current-time indicator */}
          {currentMinutes >= dayStart && currentMinutes <= dayEnd && (
            <div
              className="absolute left-10 right-0 flex items-center z-10 time-indicator"
              style={{ top: `${indicatorPercent}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-lg shadow-indigo-500/40" />
              <div className="flex-1 h-px bg-indigo-400/60" />
            </div>
          )}

          {/* Event detail popover */}
          {selectedEvent && (
            <EventPopover
              event={selectedEvent.event}
              isKid={selectedEvent.isKid}
              isTask={selectedEvent.isTask}
              onClose={() => setSelectedEvent(null)}
            />
          )}
        </div>
      </div>
    </GlassTile>
  );
}
