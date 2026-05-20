import { useEffect, useRef, useCallback } from "react";
import type { Task } from "../types";

export function useRemindersSync(
  tasks: Task[],
  onUpdate: (tasks: Task[]) => void
) {
  const syncingRef = useRef(false);
  const prevTasksRef = useRef<Task[]>(tasks);

  const syncFromReminders = useCallback(async () => {
    if (!window.electronAPI?.reminders || syncingRef.current) return;
    syncingRef.current = true;

    try {
      const reminders = await window.electronAPI.reminders.getAll();
      const existingTitles = new Set(tasks.map((t) => t.title));
      const newTasks: Task[] = [];

      for (const r of reminders) {
        if (!r.completed && !existingTitles.has(r.name)) {
          newTasks.push({
            id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: r.name,
            completed: false,
            createdAt: new Date().toISOString(),
          });
        }
      }

      if (newTasks.length > 0) {
        onUpdate([...tasks, ...newTasks]);
      }
    } catch (error) {
      console.error("Reminders sync failed:", error);
    } finally {
      syncingRef.current = false;
    }
  }, [tasks, onUpdate]);

  useEffect(() => {
    syncFromReminders();
    const interval = setInterval(syncFromReminders, 60 * 1000);
    return () => clearInterval(interval);
  }, [syncFromReminders]);

  useEffect(() => {
    if (!window.electronAPI?.reminders) return;
    const prev = prevTasksRef.current;
    prevTasksRef.current = tasks;

    for (const task of tasks) {
      const wasPrev = prev.find((t) => t.id === task.id);
      if (task.completed && wasPrev && !wasPrev.completed) {
        window.electronAPI.reminders.complete(task.title).catch(() => {});
      }
    }

    const newTasks = tasks.filter(
      (t) => !prev.some((p) => p.id === t.id) && !t.id.startsWith("rem-")
    );
    for (const t of newTasks) {
      window.electronAPI.reminders.add(t.title).catch(() => {});
    }
  }, [tasks]);
}
