import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
}

export class CalendarService {
  async getTodayEvents(): Promise<CalendarEvent[]> {
    return this.fetchEvents();
  }

  async getKidEvents(): Promise<CalendarEvent[]> {
    return this.fetchEvents("Kid");
  }

  private async fetchEvents(calendarName?: string): Promise<CalendarEvent[]> {
    try {
      const calFilter = calendarName
        ? `set targetCals to (every calendar whose name contains "${calendarName}")`
        : `set targetCals to every calendar`;

      const script = `
        set today to current date
        set time of today to 0
        set tomorrow to today + (1 * days)

        set eventList to ""

        tell application "Calendar"
          ${calFilter}
          repeat with cal in targetCals
            set calEvents to (every event of cal whose start date >= today and start date < tomorrow)
            repeat with evt in calEvents
              set evtStart to start date of evt
              set evtEnd to end date of evt
              set evtTitle to summary of evt
              set evtLoc to ""
              try
                set evtLoc to location of evt
              end try
              set evtNotes to ""
              try
                set evtNotes to description of evt
              end try

              set startH to text -2 thru -1 of ("0" & (hours of evtStart as text))
              set startM to text -2 thru -1 of ("0" & (minutes of evtStart as text))
              set endH to text -2 thru -1 of ("0" & (hours of evtEnd as text))
              set endM to text -2 thru -1 of ("0" & (minutes of evtEnd as text))

              set eventList to eventList & evtTitle & "|||" & startH & ":" & startM & "|||" & endH & ":" & endM & "|||" & evtLoc & "|||" & evtNotes & "###"
            end repeat
          end repeat
        end tell

        return eventList
      `;

      const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
      return this.parseEvents(stdout.trim(), calendarName ? "kid" : "cal");
    } catch (error) {
      console.error(`Failed to fetch ${calendarName ?? "all"} calendar events:`, error);
      return calendarName ? this.getKidFallbackEvents() : this.getFallbackEvents();
    }
  }

  private parseEvents(raw: string, prefix: string): CalendarEvent[] {
    if (!raw) return prefix === "kid" ? this.getKidFallbackEvents() : this.getFallbackEvents();

    const events: CalendarEvent[] = [];
    const entries = raw.split("###").filter(Boolean);

    for (let i = 0; i < entries.length; i++) {
      const parts = entries[i].split("|||");
      if (parts.length >= 3) {
        events.push({
          id: `${prefix}-${i}`,
          title: parts[0].trim(),
          startTime: parts[1].trim(),
          endTime: parts[2].trim(),
          location: parts[3]?.trim() || undefined,
          notes: parts[4]?.trim() || undefined,
        });
      }
    }

    return events.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  private getFallbackEvents(): CalendarEvent[] {
    return [
      { id: "1", title: "Morning Standup", startTime: "09:00", endTime: "09:30" },
      { id: "2", title: "Deep Work Block", startTime: "10:00", endTime: "12:00" },
      { id: "3", title: "Lunch Break", startTime: "12:00", endTime: "13:00" },
      { id: "4", title: "Design Review", startTime: "14:00", endTime: "15:00" },
      { id: "5", title: "Sprint Planning", startTime: "16:00", endTime: "17:00" },
    ];
  }

  private getKidFallbackEvents(): CalendarEvent[] {
    return [
      { id: "k1", title: "School Drop-off", startTime: "08:00", endTime: "08:30" },
      { id: "k2", title: "Soccer Practice", startTime: "15:30", endTime: "16:30" },
      { id: "k3", title: "Homework", startTime: "17:00", endTime: "18:00" },
    ];
  }
}
