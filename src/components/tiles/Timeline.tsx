import { useMemo } from "react";
import GlassTile from "../GlassTile";
import type { CalendarEvent } from "../../types";

interface Props {
  events: CalendarEvent[];
  now: Date;
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

export default function Timeline({ events, now }: Props) {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dayStart = 8 * 60;
  const dayEnd = 18 * 60;
  const dayRange = dayEnd - dayStart;

  const indicatorPercent = useMemo(() => {
    if (currentMinutes < dayStart) return 0;
    if (currentMinutes > dayEnd) return 100;
    return ((currentMinutes - dayStart) / dayRange) * 100;
  }, [currentMinutes]);

  return (
    <GlassTile gridArea="tl" delay={2} className="flex flex-col px-5 pt-8 pb-5 overflow-hidden">
      <h3 className="text-xs font-medium text-white/55 uppercase tracking-wider mb-3">
        Timeline
      </h3>

      <div className="flex-1 relative overflow-y-auto overflow-x-hidden pr-1">
        <div className="relative" style={{ minHeight: "100%" }}>
          {/* Hour markers */}
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

          {/* Events */}
          {events.map((event) => {
            const startMin = timeToMinutes(event.startTime);
            const endMin = timeToMinutes(event.endTime);
            const top = ((startMin - dayStart) / dayRange) * 100;
            const height = ((endMin - startMin) / dayRange) * 100;

            if (startMin >= dayEnd || endMin <= dayStart) return null;

            return (
              <div
                key={event.id}
                className="absolute left-11 right-0 rounded-lg px-2.5 py-1.5 border overflow-hidden"
                style={{
                  top: `${top}%`,
                  height: `${Math.max(height, 3)}%`,
                  backgroundColor: "rgba(99, 102, 241, 0.12)",
                  borderColor: "rgba(99, 102, 241, 0.25)",
                }}
              >
                <p className="text-sm font-medium text-indigo-200/80 truncate leading-tight">
                  {event.title}
                </p>
                {height > 5 && (
                  <p className="text-[10px] text-indigo-300/40 mt-0.5">
                    {event.startTime} – {event.endTime}
                  </p>
                )}
              </div>
            );
          })}

          {/* Current time indicator */}
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
