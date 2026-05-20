import { useState, useEffect, useCallback } from "react";
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
import { useRemindersSync } from "./hooks/useRemindersSync";
import type { MealPlans, Task } from "./types";

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

const DEFAULT_TASKS: Task[] = [
  {
    id: "t1",
    title: "Review pull request #42",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t2",
    title: "Update project dependencies",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t3",
    title: "Prepare presentation deck",
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

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
  useRemindersSync(tasks, setTasks);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const toggleZen = useCallback(() => setZenMode((z) => !z), []);

  const tileOpacity = idle ? 0.08 : undefined;

  if (zenMode) {
    return (
      <div className="w-full h-full relative">
        <AnimatedBackground
          weatherCondition={weather.condition}
          currentHour={now.getHours()}
          slowMode={idle}
        />
        <ZenMode events={events} now={now} onExit={toggleZen} />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <AnimatedBackground
        weatherCondition={weather.condition}
        currentHour={now.getHours()}
        slowMode={idle}
      />

      <SplashScreen visible={showSplash} />

      <main className="relative z-10 w-full h-full">
        <DashboardGrid spans={spans} onResize={resizeTile}>
          <TimeDate now={now} idleOpacity={tileOpacity} />
          <Weather weather={weather} idleOpacity={tileOpacity} />
          <NowPlaying idleOpacity={tileOpacity} />
          <CurrentTask events={events} now={now} idleOpacity={tileOpacity} />
          <Timeline events={events} now={now} kidEvents={kidEvents} idleOpacity={tileOpacity} />
          <Notifications idleOpacity={tileOpacity} />
          <MealMenu meals={meals} onUpdate={setMeals} idleOpacity={tileOpacity} />
          <TaskBoard tasks={tasks} onUpdate={setTasks} idleOpacity={tileOpacity} />
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
