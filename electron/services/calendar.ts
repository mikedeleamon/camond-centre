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
  // Ensure Calendar.app is running before we try to query it.
  // AppleEvents time out (-1712) when the app hasn't launched yet or is still
  // syncing iCloud on startup. open -a is a no-op if it's already running.
  private async ensureCalendarRunning(): Promise<void> {
    try {
      await execAsync("open -a Calendar", { timeout: 5_000 });
      // Give Calendar a moment to finish its initial sync before we query it.
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    } catch {
      // Already running or unavailable — proceed anyway.
    }
  }

  async getTodayEvents(): Promise<CalendarEvent[]> {
    await this.ensureCalendarRunning();
    return this.fetchWithRetry();
  }

  async getKidEvents(): Promise<CalendarEvent[]> {
    // ensureCalendarRunning already called by getTodayEvents (which fires first
    // via Promise.all in the IPC handler), but guard here too for safety.
    await this.ensureCalendarRunning();
    return this.fetchWithRetry("Kid");
  }

  // Retries up to maxAttempts times with exponential backoff before giving up.
  private async fetchWithRetry(
    calendarName?: string,
    maxAttempts = 3
  ): Promise<CalendarEvent[]> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.fetchEvents(calendarName);
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts;
        if (isLastAttempt) {
          console.error(
            `Failed to fetch ${calendarName ?? "all"} calendar events after ${maxAttempts} attempts:`,
            error
          );
          return [];
        }
        // Wait longer between each retry (1.5s, 3s, …)
        const delay = 1_500 * attempt;
        console.warn(
          `Calendar fetch attempt ${attempt} failed — retrying in ${delay}ms…`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return [];
  }

  private async fetchEvents(calendarName?: string): Promise<CalendarEvent[]> {
    const calFilter = calendarName
      ? `set targetCals to (every calendar whose name contains "${calendarName}")`
      : `set targetCals to every calendar`;

    // with timeout of N seconds wraps the entire tell block so AppleScript
    // waits up to N seconds for Calendar to respond before throwing -1712.
    const script = `
      with timeout of 90 seconds
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
      end timeout
    `;

    // Node-level timeout sits slightly above the AppleScript timeout so the
    // process is never left hanging if AppleScript itself stalls.
    const { stdout } = await execAsync(
      `osascript -e '${script.replace(/'/g, "'\\''")}'`,
      { timeout: 100_000 }
    );

    return this.parseEvents(stdout.trim(), calendarName ? "kid" : "cal");
  }

  private parseEvents(raw: string, prefix: string): CalendarEvent[] {
    if (!raw) return [];

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
}
