import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassTile from "../GlassTile";
import type { Task } from "../../types";
import type { TileId } from "../../hooks/useGridLayout";

interface Props {
  tasks: Task[];
  onUpdate: (tasks: Task[]) => void;
  tileId?: TileId;
  onTileResize?: (edge: "left" | "right" | "top" | "bottom", delta: number) => void;
  gridStyle?: React.CSSProperties;
  idleOpacity?: number;
}

export default function TaskBoard({ tasks, onUpdate, tileId, onTileResize, gridStyle, idleOpacity }: Props) {
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);

  const uncompleted = tasks.filter((t) => !t.completed);

  function handleAdd() {
    if (!newTask.trim()) return;
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    onUpdate([...tasks, task]);
    setNewTask("");
    setAdding(false);
  }

  function handleToggle(id: string) {
    onUpdate(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setAdding(false);
      setNewTask("");
    }
  }

  return (
    <GlassTile delay={5} className="flex flex-col p-5 overflow-hidden" tileId={tileId} onResize={onTileResize} style={gridStyle} idleOpacity={idleOpacity}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="tile-label">Tasks</h3>
        <button
          onClick={() => setAdding(true)}
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        <AnimatePresence initial={false}>
          {adding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <input
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 outline-none focus:border-indigo-500/30 mb-2"
                placeholder="New task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newTask.trim()) setAdding(false);
                }}
                autoFocus
              />
            </motion.div>
          )}

          {uncompleted.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex items-start gap-2.5 group py-1"
            >
              <button
                onClick={() => handleToggle(task.id)}
                className="mt-0.5 w-4 h-4 rounded-full border border-white/15 shrink-0 flex items-center justify-center hover:border-indigo-400/40 transition-colors"
              >
                {task.completed && (
                  <div className="w-2 h-2 rounded-full bg-indigo-400/60" />
                )}
              </button>
              <span className="text-sm text-white/55 leading-snug">
                {task.title}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {uncompleted.length === 0 && !adding && (
          <p className="text-xs text-white/20 text-center py-6">
            All clear
          </p>
        )}
      </div>
    </GlassTile>
  );
}
