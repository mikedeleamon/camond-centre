import { useMemo } from "react";
import GlassTile from "../GlassTile";
import type { CalendarEvent } from "../../types";
import type { TileId } from "../../hooks/useGridLayout";

interface Props {
  events: CalendarEvent[];
  now: Date;
  kidEvents?: CalendarEvent[];
  tileId?: TileId;
  onTileResize?: (edge: "left" | "right" | "top" | "bottom", delta: number) => void;
  gridStyle?: React.CSSProperties;
  idleOpacity?: number;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8);

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(hour: number): string {
  if (hour === 12) return "12 PM";
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
}

function EventBlock({ event, dayStart, dayRange, isKid }: {
  event: CalendarEvent;
  dayStart: number;
  dayRange: number;
  isKid?: boolean;
}) {
  const startMin = timeToMinutes(event.startTime);
  const endMin = timeToMinutes(event.endTime);
  const top = ((startMin - dayStart) / dayRange) * 100;
  const height = ((endMin - startMin) / dayRange) * 100;

  return (
    <div
      className="absolute rounded-lg px-2.5 py-1.5 border overflow-hidden"
      style={{
        left: isKid ? "calc(50% + 22px)" : "44px",
        right: isKid ? "0" : "50%",
        top: `${top}%`,
        height: `${Math.max(height, 3)}%`,
        backgroundColor: isKid ? "rgba(139,92,246,0.10)" : "rgba(99,102,241,0.12)",
        borderColor: isKid ? "rgba(139,92,246,0.20)" : "rgba(99,102,241,0.25)",
      }}
    >
      {isKid && (
        <span className="text-[8px] text-purple-300/40 uppercase tracking-wider">Kid</span>
      )}
      <p className="text-sm font-medium truncate leading-tight"
        style={{ color: isKid ? "rgba(192,160,255,0.75)" : "rgba(165,180,255,0.8)" }}>
        {event.title}
      </p>
      {height > 5 && (
        <p className="text-[10px] mt-0.5"
          style={{ color: isKid ? "rgba(192,160,255,0.35)" : "rgba(99,102,241,0.4)" }}>
          {event.startTime} – {event.endTime}
        </p>
      )}
    </div>
  );
}

export default function Timeline({ events, now, kidEvents = [], tileId, onTileResize, gridStyle, idleOpacity }: Props) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayStart = 8 * 60;
  const dayEnd = 18 * 60;
  const dayRange = dayEnd - dayStart;
  const hasKidLane = kidEvents.length > 0;

  const indicatorPercent = useMemo(() => {
    if (currentMinutes < dayStart) return 0;
    if (currentMinutes > dayEnd) return 100;
    return ((currentMinutes - dayStart) / dayRange) * 100;
  }, [currentMinutes]);

  return (
    <GlassTile delay={2} className="flex flex-col px-5 pt-8 pb-5 overflow-hidden" tileId={tileId} onResize={onTileResize} style={gridStyle} idleOpacity={idleOpacity}>
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-xs font-medium text-white/55 uppercase tracking-wider">
          Timeline
        </h3>
        {hasKidLane && (
          <span className="text-[9px] text-purple-300/35 uppercase tracking-wider">+ Kid</span>
        )}
      </div>

      <div className="flex-1 relative overflow-y-auto overflow-x-hidden pr-1">
        <div className="relative" style={{ minHeight: "100%" }}>
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

          {events.map((event) => {
            const startMin = timeToMinutes(event.startTime);
            const endMin = timeToMinutes(event.endTime);
            if (startMin >= dayEnd || endMin <= dayStart) return null;
            return (
              <EventBlock key={event.id} event={event} dayStart={dayStart} dayRange={dayRange} />
            );
          })}

          {kidEvents.map((event) => {
            const startMin = timeToMinutes(event.startTime);
            const endMin = timeToMinutes(event.endTime);
            if (startMin >= dayEnd || endMin <= dayStart) return null;
            return (
              <EventBlock key={`kid-${event.id}`} event={event} dayStart={dayStart} dayRange={dayRange} isKid />
            );
          })}

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
