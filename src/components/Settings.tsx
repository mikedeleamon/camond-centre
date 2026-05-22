import type { AppSettings } from "../types";
import { THEMES } from "../themes";

const TILE_LABELS: Record<string, string> = {
  time:  "Time & Date",
  wthr:  "Weather",
  music: "Music",
  curr:  "Current Task",
  tl:    "Timeline",
  notif: "Notifications",
  menu:  "Meal Plan",
  task:  "Tasks",
};

const TILE_ORDER = ["time", "wthr", "music", "curr", "tl", "notif", "menu", "task"] as const;
const IDLE_OPTIONS = [2, 5, 10, 15, 30] as const;

interface Props {
  open: boolean;
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  onResetLayout: () => void;
  onClose: () => void;
}

export default function Settings({ open, settings, onUpdate, onResetLayout, onClose }: Props) {
  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    onUpdate({ ...settings, [key]: value });
  }

  function toggleTile(id: string) {
    const hidden = settings.hiddenTiles ?? [];
    set("hiddenTiles",
      hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id]
    );
  }

  const activeThemeId = settings.colorTheme ?? "midnight";

  return (
    <>
      {/* Backdrop — click to close */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: "rgba(0,0,0,0.35)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed inset-y-0 left-0 z-50 flex flex-col"
        style={{
          width: 288,
          background: "rgba(7,9,22,0.98)",
          borderRight: "1px solid rgba(255,255,255,0.09)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.20em] text-white/35">
              Settings
            </span>
            <kbd className="text-[8px] text-white/15 px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {"⌘"},
            </kbd>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
            title="Close (Esc)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-6">

          {/* ── Theme ── */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-white/25 mb-3">
              Theme
            </p>
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map((theme) => {
                const active = theme.id === activeThemeId;
                return (
                  <button
                    key={theme.id}
                    onClick={() => set("colorTheme", theme.id)}
                    className="flex flex-col items-center gap-1.5 py-2 px-1 rounded-lg transition-all"
                    style={{
                      background: active ? "rgba(255,255,255,0.06)" : "transparent",
                      border: `1px solid ${active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.04)"}`,
                    }}
                    title={theme.name}
                  >
                    {/* Swatch */}
                    <div
                      className="rounded-full shrink-0 transition-transform"
                      style={{
                        width: 22,
                        height: 22,
                        background: `radial-gradient(circle at 35% 35%, ${theme.swatch}cc, ${theme.swatch}55)`,
                        boxShadow: active
                          ? `0 0 10px ${theme.swatch}55, 0 0 3px ${theme.swatch}33`
                          : "none",
                        transform: active ? "scale(1.15)" : "scale(1)",
                      }}
                    />
                    <span
                      className="text-[9px] leading-tight"
                      style={{ color: active ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.30)" }}
                    >
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Preferences ── */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-white/25 mb-3">
              Preferences
            </p>

            <div className="space-y-3">
              {/* Weather location */}
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Weather Location</label>
                <input
                  className="w-full rounded-lg px-3 py-1.5 text-xs text-white/60 placeholder-white/20 outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  placeholder="Auto-detect"
                  value={settings.weatherLocation}
                  onChange={(e) => set("weatherLocation", e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(var(--accent), 0.45)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <p className="text-[9px] text-white/18 mt-1">
                  Requires app restart to take effect.
                </p>
              </div>

              {/* Kid calendar name */}
              <div>
                <label className="text-[11px] text-white/40 block mb-1">Kid Calendar Name</label>
                <input
                  className="w-full rounded-lg px-3 py-1.5 text-xs text-white/60 placeholder-white/20 outline-none transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  placeholder="e.g. Kids"
                  value={settings.kidCalendarName}
                  onChange={(e) => set("kidCalendarName", e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.45)")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                />
                <p className="text-[9px] text-white/18 mt-1">
                  Requires app restart to take effect.
                </p>
              </div>

              {/* Idle timeout */}
              <div>
                <label className="text-[11px] text-white/40 block mb-1.5">Dim After</label>
                <div className="flex gap-1.5 flex-wrap">
                  {IDLE_OPTIONS.map((min) => {
                    const active = settings.idleTimeoutMinutes === min;
                    return (
                      <button
                        key={min}
                        onClick={() => set("idleTimeoutMinutes", min)}
                        className="px-2.5 py-1 rounded-md text-[11px] transition-all"
                        style={{
                          background: active ? "rgba(var(--accent), 0.18)" : "rgba(255,255,255,0.04)",
                          border:     `1px solid ${active ? "rgba(var(--accent), 0.35)" : "rgba(255,255,255,0.07)"}`,
                          color:      active ? "rgba(var(--accent-light), 0.90)" : "rgba(255,255,255,0.35)",
                        }}
                      >
                        {min}m
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ── Tiles ── */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-white/25 mb-3">
              Tiles
            </p>
            <div className="space-y-1">
              {TILE_ORDER.map((id) => {
                const hidden = (settings.hiddenTiles ?? []).includes(id);
                return (
                  <label
                    key={id}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/[0.04]"
                  >
                    {/* Toggle */}
                    <button
                      role="switch"
                      aria-checked={!hidden}
                      onClick={() => toggleTile(id)}
                      className="shrink-0 rounded-full transition-all duration-200 flex items-center"
                      style={{
                        width: 28,
                        height: 16,
                        background: hidden ? "rgba(255,255,255,0.08)" : "rgba(var(--accent), 0.55)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        padding: 2,
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.85)",
                          transform: hidden ? "translateX(0)" : "translateX(12px)",
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </button>
                    <span className="text-xs" style={{ color: hidden ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.60)" }}>
                      {TILE_LABELS[id]}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* ── Layout ── */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-white/25 mb-3">
              Layout
            </p>
            <button
              onClick={() => { onResetLayout(); onClose(); }}
              className="w-full px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/65 transition-colors text-left"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              Reset grid to default
            </button>
            <p className="text-[9px] text-white/18 mt-2">
              Tiles can be resized by dragging their edges.
            </p>
          </section>

          {/* ── Shortcuts ── */}
          <section>
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-white/25 mb-3">
              Keyboard Shortcuts
            </p>
            <div className="space-y-1.5 text-[11px]">
              {([
                ["⌘ ,", "Settings"],
                ["⌘ .", "Zen Mode"],
                ["Esc",       "Close / Exit"],
                ["⌘⇧ F", "Fullscreen"],
                ["⌘⇧ D", "Cycle Display"],
                ["⌘⇧ H", "Hide / Show"],
                ["⌘⇧ Q", "Quit"],
              ] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-white/35">{label}</span>
                  <kbd
                    className="text-[9px] text-white/25 px-1.5 py-0.5 rounded tabular-nums"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
