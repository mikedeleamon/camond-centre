import { useMemo } from "react";
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

/** Add `minutes` to a "HH:MM" string, capped at 23:59. */
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

// ─── colour palette ───────────────────────────────────────────────────────────
// Calendar events: indigo (regular) / purple (kid)
// Task events:     emerald (regular) / amber (kid)
const COLORS = {
  calReg:  { bg: "rgba(99,102,241,0.12)",  border: "rgba(99,102,241,0.25)",  text: "rgba(165,180,255,0.80)", sub: "rgba(99,102,241,0.40)"  },
  calKid:  { bg: "rgba(139,92,246,0.10)",  border: "rgba(139,92,246,0.20)",  text: "rgba(192,160,255,0.75)", sub: "rgba(192,160,255,0.35)"  },
  taskReg: { bg: "rgba(16,185,129,0.10)",  border: "rgba(16,185,129,0.22)",  text: "rgba(110,231,183,0.85)", sub: "rgba(110,231,183,0.40)"  },
  taskKid: { bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.22)",  text: "rgba(252,211,77,0.85)",  sub: "rgba(252,211,77,0.40)"   },
};

function EventBlock({ event, dayStart, dayRange, isKid, isTask }: {
  event: CalendarEvent;
  dayStart: number;
  dayRange: number;
  isKid?: boolean;
  isTask?: boolean;
}) {
  const startMin = timeToMinutes(event.startTime);
  const endMin   = timeToMinutes(event.endTime);
  const top    = ((startMin - dayStart) / dayRange) * 100;
  const height = ((endMin - startMin)   / dayRange) * 100;

  const c = isTask
    ? (isKid ? COLORS.taskKid : COLORS.taskReg)
    : (isKid ? COLORS.calKid  : COLORS.calReg);

  // label: "Task" for task blocks, "Kid" for kid calendar blocks, nothing otherwise
  const label = isTask ? "Task" : isKid ? "Kid" : null;

  return (
    <div
      className="absolute rounded-lg px-2.5 py-1.5 border overflow-hidden"
      style={{
        left:            isKid ? "calc(50% + 22px)" : "44px",
        right:           isKid ? "0"                : "50%",
        top:             `${top}%`,
        height:          `${Math.max(height, 3)}%`,
        backgroundColor: c.bg,
        borderColor:     c.border,
      }}
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

  // Convert today's tasks (with dueDate + dueTime + duration) into timeline events.
  // Incomplete tasks only. Kids route to the kid swimlane.
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

  const hasKidLane =
    kidEvents.length > 0 || taskEvents.kid.length > 0;

  const indicatorPercent = useMemo(() => {
    if (currentMinutes < dayStart) return 0;
    if (currentMinutes > dayEnd)   return 100;
    return ((currentMinutes - dayStart) / dayRange) * 100;
  }, [currentMinutes]);

  // 72 px per hour × 24 h = 1728 px total scrollable height
  const timelineHeight = (dayRange / 60) * 72;

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
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <h3 className="tile-label">Timeline</h3>
        {hasKidLane && (
          <span className="text-[9px] text-purple-300/35 uppercase tracking-wider">+ Kid</span>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1">
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
        </div>
      </div>
    </GlassTile>
  );
}
