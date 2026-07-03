import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface NowPlayingData {
  trackName: string;
  artist: string;
  album: string;
  duration: number;
  position: number;
  isPlaying: boolean;
  playlistName?: string;
}

function run(script: string): Promise<string> {
  const escaped = script.replace(/'/g, "'\\''");
  return execAsync(`osascript -e '${escaped}'`, { timeout: 4000 })
    .then(({ stdout }) => stdout.trim())
    .catch(() => "");
}

export class MusicService {
  /**
   * Check whether Apple Music is already running WITHOUT launching it.
   * `pgrep` never starts a process, so this is safe to call on a fast poll —
   * unlike `tell application "Music"`, which sends an Apple Event that would
   * auto-launch Music if it isn't open.
   */
  private async isRunning(): Promise<boolean> {
    try {
      await execAsync("pgrep -x Music", { timeout: 2000 });
      return true; // exit 0 → a matching process exists
    } catch {
      return false; // pgrep exits non-zero when nothing matches
    }
  }

  async getNowPlaying(): Promise<NowPlayingData | null> {
    // Don't launch Music just to poll it — bail out if it isn't already open.
    if (!(await this.isRunning())) return null;
    try {
      const result = await run(`
        tell application "Music"
          set ps to player state
          if ps is playing or ps is paused then
            set t to current track
            set n to name of t
            set ar to artist of t
            set al to album of t
            set dur to duration of t as integer
            set pos to player position as integer
            set pl to ""
            try
              set pl to name of current playlist
            end try
            if ps is playing then
              set s to "playing"
            else
              set s to "paused"
            end if
            return n & "|||" & ar & "|||" & al & "|||" & (dur as text) & "|||" & (pos as text) & "|||" & s & "|||" & pl
          else
            return "|||||||stopped"
          end if
        end tell
      `);

      if (!result) return null;
      const parts = result.split("|||");
      const state = parts[5] ?? "stopped";
      if (state === "stopped" && !parts[0]) return null;

      return {
        trackName: parts[0] ?? "",
        artist: parts[1] ?? "",
        album: parts[2] ?? "",
        duration: parseInt(parts[3] ?? "0", 10),
        position: parseInt(parts[4] ?? "0", 10),
        isPlaying: state === "playing",
        playlistName: parts[6] ?? undefined,
      };
    } catch {
      return null;
    }
  }

  async play(): Promise<void> {
    await run(`
      tell application "System Events"
        set isRunning to exists process "Music"
      end tell
      if not isRunning then
        activate application "Music"
        delay 1.5
      end if
      tell application "Music" to play
    `);
  }

  async pause(): Promise<void> {
    await run(`tell application "Music" to pause`);
  }

  async togglePlay(): Promise<void> {
    await run(`
      tell application "Music"
        if player state is playing then
          pause
        else
          play
        end if
      end tell
    `);
  }

  async nextTrack(): Promise<void> {
    await run(`tell application "Music" to next track`);
  }

  async previousTrack(): Promise<void> {
    await run(`tell application "Music" to previous track`);
  }

  async skipForward(): Promise<void> {
    await run(`
      tell application "Music"
        set player position to (player position + 15)
      end tell
    `);
  }

  async skipBackward(): Promise<void> {
    await run(`
      tell application "Music"
        set p to player position - 15
        if p < 0 then set p to 0
        set player position to p
      end tell
    `);
  }

  async playLofiPlaylist(): Promise<void> {
    // Try to find a playlist with "lofi" in the name (case-insensitive)
    const result = await run(`
      tell application "Music"
        set found to ""
        repeat with pl in user playlists
          set n to name of pl
          if n contains "lofi" or n contains "lo-fi" or n contains "Lo-Fi" or n contains "LoFi" then
            set found to n
            exit repeat
          end if
        end repeat
        return found
      end tell
    `);

    if (result) {
      await run(`tell application "Music" to play playlist "${result.replace(/"/g, '\\"')}"`);
    } else {
      // No lofi playlist found — just play Music
      await run(`tell application "Music" to play`);
    }
  }
}
