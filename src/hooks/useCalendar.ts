import { useState, useEffect, useCallback } from "react";
import type { CalendarEvent } from "../types";

const FALLBACK_EVENTS: CalendarEvent[] = [
  { id: "1", title: "Morning Standup", startTime: "09:00", endTime: "09:30" },
  { id: "2", title: "Deep Work Block", startTime: "10:00", endTime: "12:00" },
  { id: "3", title: "Lunch Break", startTime: "12:00", endTime: "13:00" },
  { id: "4", title: "Design Review", startTime: "14:00", endTime: "15:00" },
  { id: "5", title: "Sprint Planning", startTime: "16:00", endTime: "17:00" },
];

const KID_FALLBACK_EVENTS: CalendarEvent[] = [
  { id: "k1", title: "School Drop-off", startTime: "08:00", endTime: "08:30" },
  { id: "k2", title: "Soccer Practice", startTime: "15:30", endTime: "16:30" },
  { id: "k3", title: "Homework", startTime: "17:00", endTime: "18:00" },
];

export function useCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(FALLBACK_EVENTS);
  const [kidEvents, setKidEvents] = useState<CalendarEvent[]>(KID_FALLBACK_EVENTS);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      if (window.electronAPI) {
        const [calEvents, kidCalEvents] = await Promise.all([
          window.electronAPI.calendar.getEvents(),
          window.electronAPI.calendar.getKidEvents(),
        ]);
        if (calEvents.length > 0) setEvents(calEvents);
        if (kidCalEvents.length > 0) setKidEvents(kidCalEvents);
      }
    } catch (error) {
      console.error("Calendar fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return { events, kidEvents, loading, refresh: fetchEvents };
}
