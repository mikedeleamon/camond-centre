import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const execAsync = promisify(exec);

export interface Reminder {
  name: string;
  completed: boolean;
}

/**
 * Write script to a temp file and run it with `osascript <file>`.
 * This avoids all shell-quoting of the script body entirely.
 */
async function runAppleScript(script: string): Promise<string> {
  const tmpFile = path.join(os.tmpdir(), `camond-${Date.now()}.applescript`);
  try {
    fs.writeFileSync(tmpFile, script, "utf8");
    // Only the file path goes through the shell — quote it defensively.
    const { stdout } = await execAsync(`osascript "${tmpFile.replace(/"/g, '\\"')}"`);
    return stdout.trim();
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}

/**
 * Produce a valid AppleScript string literal for any user-supplied value.
 * AppleScript has no backslash escaping; the only special character inside
 * a double-quoted string is `"` itself, handled by concatenating with the
 * built-in `quote` constant.
 *
 * Examples:
 *   hello       → "hello"
 *   say "hi"    → "say " & quote & "hi" & quote & ""
 */
function asString(s: string): string {
  const parts = s.split('"');
  if (parts.length === 1) return `"${s}"`;
  return parts.map((p) => `"${p}"`).join(" & quote & ");
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
      const output = await runAppleScript(script);
      return this.parse(output);
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
      return [];
    }
  }

  async add(title: string): Promise<boolean> {
    try {
      const nameExpr = asString(title);
      const script = `
tell application "Reminders"
  tell default list
    make new reminder with properties {name:${nameExpr}}
  end tell
end tell
`;
      await runAppleScript(script);
      return true;
    } catch (error) {
      console.error("Failed to add reminder:", error);
      return false;
    }
  }

  async complete(name: string): Promise<boolean> {
    try {
      const nameExpr = asString(name);
      const script = `
tell application "Reminders"
  tell default list
    set matchedReminders to (reminders whose name is ${nameExpr} and completed is false)
    if (count of matchedReminders) > 0 then
      set completed of item 1 of matchedReminders to true
    end if
  end tell
end tell
`;
      await runAppleScript(script);
      return true;
    } catch (error) {
      console.error("Failed to complete reminder:", error);
      return false;
    }
  }

  private parse(raw: string): Reminder[] {
    if (!raw) return [];
    return raw
      .split("###")
      .filter(Boolean)
      .map((entry) => {
        const parts = entry.split("|||");
        return {
          name: parts[0]?.trim() ?? "",
          completed: parts[1]?.trim() === "true",
        };
      })
      .filter((r) => r.name);
  }
}
