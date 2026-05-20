import { useState, useEffect } from "react";
import AnimatedBackground from "./components/Background/AnimatedBackground";
import SplashScreen from "./components/SplashScreen";
import DashboardGrid from "./components/DashboardGrid";
import TimeDate from "./components/tiles/TimeDate";
import Weather from "./components/tiles/Weather";
import Timeline from "./components/tiles/Timeline";
import CurrentTask from "./components/tiles/CurrentTask";
import MealMenu from "./components/tiles/MealMenu";
import TaskBoard from "./components/tiles/TaskBoard";
import Notifications from "./components/tiles/Notifications";
import { useCurrentTime } from "./hooks/useCurrentTime";
import { useCalendar } from "./hooks/useCalendar";
import { useWeather } from "./hooks/useWeather";
import { useStorage } from "./hooks/useStorage";
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
  const now = useCurrentTime();
  const { events } = useCalendar();
  const { weather } = useWeather();
  const [meals, setMeals] = useStorage<MealPlans>("meals", DEFAULT_MEALS);
  const [tasks, setTasks] = useStorage<Task[]>("tasks", DEFAULT_TASKS);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full relative">
      <AnimatedBackground
        weatherCondition={weather.condition}
        currentHour={now.getHours()}
      />

      <SplashScreen visible={showSplash} />

      <main className="relative z-10 w-full h-full">
        <DashboardGrid>
          <TimeDate now={now} />
          <Weather weather={weather} />
          <CurrentTask events={events} now={now} />
          <Timeline events={events} now={now} />
          <Notifications />
          <MealMenu meals={meals} onUpdate={setMeals} />
          <TaskBoard tasks={tasks} onUpdate={setTasks} />
        </DashboardGrid>
      </main>
    </div>
  );
}
