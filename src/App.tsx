import { useState, useEffect, useCallback, useMemo } from "react";
import AnimatedBackground from "./components/Background/AnimatedBackground";
import SplashScreen from "./components/SplashScreen";
import DashboardGrid from "./components/DashboardGrid";
import ZenMode from "./components/ZenMode";
import Settings from "./components/Settings";
import TimeDate from "./components/tiles/TimeDate";
import Weather from "./components/tiles/Weather";
import CurrentTask from "./components/tiles/CurrentTask";
import Timeline from "./components/tiles/Timeline";
import Notifications from "./components/tiles/Notifications";
import NowPlaying from "./components/tiles/NowPlaying";
import MealMenu from "./components/tiles/MealMenu";
import TaskBoard from "./components/tiles/TaskBoard";
import { useCurrentTime } from "./hooks/useCurrentTime";
import { useCalendar } from "./hooks/useCalendar";
import { useWeather } from "./hooks/useWeather";
import { useStorage } from "./hooks/useStorage";
import { useGridLayout } from "./hooks/useGridLayout";
import { useIdleDetection } from "./hooks/useIdleDetection";
import type { CalendarEvent, MealPlans, Task, AppSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { THEMES } from "./themes";

/** Adds `minutes` to a "HH:MM" string, capped at 23:59. */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  if (total >= 24 * 60) return "23:59";
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** Format a Date as "YYYY-MM-DD" */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DEFAULT_MEALS: MealPlans = {
  breakfast: {
    you: ["Oatmeal", "Coffee", "Berries"],
    kid: ["Pancakes", "Orange Juice", "Banana"],
  },
  lunch: {
    you: ["Grilled Chicken Salad", "Sparkling Water"],
    kid: ["Mac & Cheese", "Apple Slices", "Milk"],
  },
  dinner: {
    you: ["Salmon", "Roasted Vegetables", "Rice"],
    kid: ["Pasta", "Broccoli", "Fruit Cup"],
  },
};

const DEFAULT_TASKS: Task[] = [];

export default function App() {
  const [showSplash,   setShowSplash]   = useState(true);
  const [zenMode,      setZenMode]      = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const now = useCurrentTime();
  const { events, kidEvents } = useCalendar();
  const { weather } = useWeather();
  const [settings, setSettings] = useStorage<AppSettings>("settings", DEFAULT_SETTINGS);

  // Per-day meal storage — key is stable for the session (computed once on mount).
  const [todayKey] = useState(() => dateKey(new Date()));
  const [yesterdayKey] = useState(() => dateKey(new Date(Date.now() - 864e5)));
  const [meals, setMeals] = useStorage<MealPlans>(`meals-${todayKey}`, DEFAULT_MEALS);

  const [tasks, setTasks] = useStorage<Task[]>("tasks", DEFAULT_TASKS);
  const { spans, resizeTile, resetLayout } = useGridLayout();

  // Idle timeout driven by settings (live — no restart required).
  const idle = useIdleDetection((settings.idleTimeoutMinutes ?? 5) * 60 * 1000);

  // Today's date string, stable across the day.
  const todayStr = useMemo(
    () => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    [now.getFullYear(), now.getMonth(), now.getDate()],
  );

  // Adult events = calendar events + today's non-kid tasks that have a time slot.
  const allAdultEvents = useMemo<CalendarEvent[]>(() => {
    const taskEvts: CalendarEvent[] = tasks
      .filter((t) => !t.isKid && !t.completed && t.dueDate === todayStr && t.dueTime && t.duration)
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title || "Untitled task",
        startTime: t.dueTime!,
        endTime: addMinutes(t.dueTime!, t.duration!),
      }));
    return [...events, ...taskEvts].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, tasks, todayStr]);

  // Kid activities = kid calendar events + today's kid tasks that have a time slot.
  const kidActivities = useMemo<CalendarEvent[]>(() => {
    const kidTaskEvents: CalendarEvent[] = tasks
      .filter((t) => t.isKid && !t.completed && t.dueDate === todayStr && t.dueTime && t.duration)
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title || "Untitled task",
        startTime: t.dueTime!,
        endTime: addMinutes(t.dueTime!, t.duration!),
      }));
    return [...kidEvents, ...kidTaskEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [kidEvents, tasks, todayStr]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // ── Apply color theme CSS custom properties ──────────────────────────────
  useEffect(() => {
    const themeId = settings.colorTheme ?? "midnight";
    const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
    const root = document.documentElement;
    for (const [key, value] of Object.entries(theme.vars)) {
      root.style.setProperty(key, value);
    }
  }, [settings.colorTheme]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // ⌘, → toggle settings
      if (meta && e.key === ",") {
        e.preventDefault();
        setShowSettings((v) => !v);
        return;
      }

      // ⌘. → toggle zen mode
      if (meta && e.key === ".") {
        e.preventDefault();
        setZenMode((z) => !z);
        return;
      }

      // Escape → close settings (priority) or exit zen
      if (e.key === "Escape") {
        if (showSettings) { setShowSettings(false); return; }
        if (zenMode)      { setZenMode(false);      return; }
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [showSettings, zenMode]);

  const toggleZen = useCallback(() => setZenMode((z) => !z), []);

  // ── Copy yesterday's meals ────────────────────────────────────────────────
  const yesterdayMeals = useMemo<MealPlans | null>(() => {
    try {
      const raw = localStorage.getItem(`camond:meals-${yesterdayKey}`);
      return raw ? JSON.parse(raw) as MealPlans : null;
    } catch {
      return null;
    }
  }, [yesterdayKey]);

  const copyYesterdayMeals = useCallback(() => {
    if (yesterdayMeals) setMeals(yesterdayMeals);
  }, [yesterdayMeals, setMeals]);

  // ── Subtask toggle ────────────────────────────────────────────────────────
  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: (t.subtasks ?? []).map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s,
              ),
            }
          : t,
      ),
    );
  }, [tasks, setTasks]);

  // ── Task duration change (from Timeline drag-resize) ─────────────────────
  const handleTaskDurationChange = useCallback((taskId: string, newDuration: number) => {
    setTasks(tasks.map((t) => t.id === taskId ? { ...t, duration: newDuration } : t));
  }, [tasks, setTasks]);

  if (zenMode) {
    return (
      <div className="w-full h-full relative">
        <AnimatedBackground
          weatherCondition={weather.condition}
          currentHour={now.getHours()}
          slowMode={idle}
          colorTheme={settings.colorTheme}
        />
        <ZenMode events={allAdultEvents} kidActivities={kidActivities} now={now} onExit={toggleZen} />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Full-size transparent hit layer */}
      <div className="fixed inset-0 z-0" style={{ background: "rgba(0,0,0,0.01)" }} />
      <AnimatedBackground
        weatherCondition={weather.condition}
        currentHour={now.getHours()}
        slowMode={idle}
        colorTheme={settings.colorTheme}
      />

      <SplashScreen visible={showSplash} />

      {/* Settings panel (always mounted, slides in/out via CSS transform) */}
      <Settings
        open={showSettings}
        settings={settings}
        onUpdate={setSettings}
        onResetLayout={resetLayout}
        onClose={() => setShowSettings(false)}
      />

      <main
        className="relative z-10 w-full h-full"
        style={idle ? { opacity: 0.08 } : undefined}
      >
        <DashboardGrid
          spans={spans}
          onResize={resizeTile}
          hiddenTiles={settings.hiddenTiles ?? []}
        >
          <TimeDate now={now} />
          <Weather weather={weather} />
          <NowPlaying />
          <CurrentTask
            events={allAdultEvents}
            kidActivities={kidActivities}
            tasks={tasks}
            onSubtaskToggle={toggleSubtask}
            now={now}
          />
          <Timeline
            events={events}
            now={now}
            kidEvents={kidEvents}
            tasks={tasks}
            onTaskDurationChange={handleTaskDurationChange}
          />
          <Notifications />
          <MealMenu
            meals={meals}
            onUpdate={setMeals}
            onCopyYesterday={yesterdayMeals ? copyYesterdayMeals : undefined}
          />
          <TaskBoard tasks={tasks} onUpdate={setTasks} />
        </DashboardGrid>
      </main>

      {/* Settings trigger — gear icon top-left */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-5 left-5 z-50 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-white/[0.07]"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          opacity: idle ? 0 : 0.45,
          transition: "opacity 0.4s, transform 0.2s, background 0.15s",
        }}
        title="Settings (⌘,)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Zen mode trigger — bottom right */}
      <button
        onClick={toggleZen}
        className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          opacity: idle ? 0 : 0.5,
        }}
        title="Zen Mode (⌘.)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l2 2" />
        </svg>
      </button>
    </div>
  );
}
