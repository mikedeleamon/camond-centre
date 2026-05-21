import { useState, useEffect, useCallback, useMemo } from "react";
import AnimatedBackground from "./components/Background/AnimatedBackground";
import SplashScreen from "./components/SplashScreen";
import DashboardGrid from "./components/DashboardGrid";
import ZenMode from "./components/ZenMode";
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
import type { CalendarEvent, MealPlans, Task } from "./types";

/** Adds `minutes` to a "HH:MM" string, capped at 23:59. */
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  if (total >= 24 * 60) return "23:59";
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
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
  const [showSplash, setShowSplash] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const now = useCurrentTime();
  const { events, kidEvents } = useCalendar();
  const { weather } = useWeather();
  const [meals, setMeals] = useStorage<MealPlans>("meals", DEFAULT_MEALS);
  const [tasks, setTasks] = useStorage<Task[]>("tasks", DEFAULT_TASKS);
  const { spans, resizeTile } = useGridLayout();
  const idle = useIdleDetection(5 * 60 * 1000);

  // Today's date string, stable across the day, used by both memos below.
  const todayStr = useMemo(
    () =>
      `${now.getFullYear()}-` +
      `${String(now.getMonth() + 1).padStart(2, "0")}-` +
      `${String(now.getDate()).padStart(2, "0")}`,
    [now.getFullYear(), now.getMonth(), now.getDate()],
  );

  // Adult events = calendar events + today's non-kid tasks that have a time slot.
  // Sorted by start time so Current/Next picking works correctly.
  const allAdultEvents = useMemo<CalendarEvent[]>(() => {
    const taskEvts: CalendarEvent[] = tasks
      .filter((t) => !t.isKid && !t.completed && t.dueDate === todayStr && t.dueTime && t.duration)
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title || "Untitled task",
        startTime: t.dueTime!,
        endTime: addMinutes(t.dueTime!, t.duration!),
      }));
    return [...events, ...taskEvts].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
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
    return [...kidEvents, ...kidTaskEvents].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
  }, [kidEvents, tasks, todayStr]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const toggleZen = useCallback(() => setZenMode((z) => !z), []);

  if (zenMode) {
    return (
      <div className="w-full h-full relative">
        <AnimatedBackground
          weatherCondition={weather.condition}
          currentHour={now.getHours()}
          slowMode={idle}
        />
        <ZenMode events={allAdultEvents} kidActivities={kidActivities} now={now} onExit={toggleZen} />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Full-size transparent hit layer — ensures macOS transparent-window
          delivers mouse/scroll events everywhere, not just over opaque pixels. */}
      <div className="fixed inset-0 z-0" style={{ background: "rgba(0,0,0,0.01)" }} />
      <AnimatedBackground
        weatherCondition={weather.condition}
        currentHour={now.getHours()}
        slowMode={idle}
      />

      <SplashScreen visible={showSplash} />

      {/* Idle dimming lives here — one opacity transition on the whole content area
          rather than per-tile, so individual tiles never get re-promoted to GPU
          compositing layers (which broke hover/scroll in macOS transparent windows). */}
      <main
        className="relative z-10 w-full h-full"
        style={idle ? { opacity: 0.08 } : undefined}
      >
        <DashboardGrid spans={spans} onResize={resizeTile}>
          <TimeDate now={now} />
          <Weather weather={weather} />
          <NowPlaying />
          <CurrentTask events={allAdultEvents} kidActivities={kidActivities} now={now} />
          <Timeline events={events} now={now} kidEvents={kidEvents} tasks={tasks} />
          <Notifications />
          <MealMenu meals={meals} onUpdate={setMeals} />
          <TaskBoard tasks={tasks} onUpdate={setTasks} />
        </DashboardGrid>
      </main>

      <button
        onClick={toggleZen}
        className="fixed bottom-5 right-5 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          opacity: idle ? 0 : 0.5,
        }}
        title="Zen Mode"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l2 2" />
        </svg>
      </button>
    </div>
  );
}
