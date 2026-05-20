import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface Reminder {
  name: string;
  completed: boolean;
}

export class RemindersService {
  async getAll(): Promise<Reminder[]> {
    try {
      const script = `
        tell application "Reminders"
          set reminderList to ""
          set defaultList to default list
          set rems to (reminders of defaultList whose completed is false)
          repeat with r in rems
            set reminderList to reminderList & name of r & "|||" & (completed of r as text) & "###"
          end repeat
          return reminderList
        end tell
      `;

      const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
      return this.parse(stdout.trim());
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
      return [];
    }
  }

  async add(title: string): Promise<boolean> {
    try {
      const safe = title.replace(/"/g, '\\"').replace(/'/g, "'\\''");
      const script = `
        tell application "Reminders"
          tell default list
            make new reminder with properties {name:"${safe}"}
          end tell
        end tell
      `;
      await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
      return true;
    } catch (error) {
      console.error("Failed to add reminder:", error);
      return false;
    }
  }

  async complete(name: string): Promise<boolean> {
    try {
      const safe = name.replace(/"/g, '\\"').replace(/'/g, "'\\''");
      const script = `
        tell application "Reminders"
          tell default list
            set matchedReminders to (reminders whose name is "${safe}" and completed is false)
            if (count of matchedReminders) > 0 then
              set completed of item 1 of matchedReminders to true
            end if
          end tell
        end tell
      `;
      await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
      return true;
    } catch (error) {
      console.error("Failed to complete reminder:", error);
      return false;
    }
  }

  private parse(raw: string): Reminder[] {
    if (!raw) return [];
    const entries = raw.split("###").filter(Boolean);
    return entries.map((entry) => {
      const parts = entry.split("|||");
      return {
        name: parts[0]?.trim() || "",
        completed: parts[1]?.trim() === "true",
      };
    }).filter((r) => r.name);
  }
}
