import { useState, useEffect, useCallback } from "react";
import type { CalendarEvent } from "../types";

const FALLBACK_EVENTS: CalendarEvent[] = [];

const KID_FALLBACK_EVENTS: CalendarEvent[] = [];

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
