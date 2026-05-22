import { useState, useEffect, useCallback } from "react";
import type { CalendarEvent } from "../types";

// Calendar integration is temporarily disabled to prevent AppleScript
// from launching Calendar.app on startup. Re-enable by setting this to true.
const CALENDAR_ENABLED = false;

export function useCalendar() {
  const [events,    setEvents]    = useState<CalendarEvent[]>([]);
  const [kidEvents, setKidEvents] = useState<CalendarEvent[]>([]);

  const fetchEvents = useCallback(async () => {
    if (!CALENDAR_ENABLED || !window.electronAPI) return;
    try {
      const calEvents    = await window.electronAPI.calendar.getEvents();
      const kidCalEvents = await window.electronAPI.calendar.getKidEvents();
      if (calEvents.length    > 0) setEvents(calEvents);
      if (kidCalEvents.length > 0) setKidEvents(kidCalEvents);
    } catch (error) {
      console.error("Calendar fetch failed:", error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    if (!CALENDAR_ENABLED) return;
    const interval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return { events, kidEvents, loading: false, refresh: fetchEvents };
}
