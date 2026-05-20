import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassTile from "../GlassTile";
import type { MealPlans } from "../../types";
import type { TileId } from "../../hooks/useGridLayout";

interface Props {
  meals: MealPlans;
  onUpdate: (meals: MealPlans) => void;
  tileId?: TileId;
  onTileResize?: (edge: "left" | "right" | "top" | "bottom", delta: number) => void;
  gridStyle?: React.CSSProperties;
  idleOpacity?: number;
}

type MealTime = "breakfast" | "lunch" | "dinner";

const MEAL_LABELS: Record<MealTime, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export default function MealMenu({ meals, onUpdate, tileId, onTileResize, gridStyle, idleOpacity }: Props) {
  const [editing, setEditing] = useState<{
    meal: MealTime;
    person: "you" | "kid";
  } | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleStartEdit(meal: MealTime, person: "you" | "kid") {
    setEditing({ meal, person });
    setEditValue(meals[meal][person].join(", "));
  }

  function handleSave() {
    if (!editing) return;
    const items = editValue
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const updated = {
      ...meals,
      [editing.meal]: {
        ...meals[editing.meal],
        [editing.person]: items,
      },
    };
    onUpdate(updated);
    setEditing(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditing(null);
  }

  return (
    <GlassTile delay={4} className="flex flex-col p-5 overflow-hidden" tileId={tileId} onResize={onTileResize} style={gridStyle} idleOpacity={idleOpacity}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-white/55 uppercase tracking-wider">
          Meal Plan
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {(Object.keys(MEAL_LABELS) as MealTime[]).map((meal) => (
          <div key={meal}>
            <h4 className="text-[11px] font-medium text-indigo-300/40 uppercase tracking-wider mb-1.5">
              {MEAL_LABELS[meal]}
            </h4>
            <div className="space-y-1.5">
              {(["you", "kid"] as const).map((person) => (
                <div key={person} className="group">
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] text-white/25 uppercase w-6 mt-1 shrink-0">
                      {person === "you" ? "You" : "Kid"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <AnimatePresence mode="wait">
                        {editing?.meal === meal &&
                        editing?.person === person ? (
                          <motion.input
                            key="input"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full bg-white/[0.04] border border-white/10 rounded-md px-2 py-1 text-xs text-white/70 outline-none focus:border-indigo-500/30"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSave}
                            autoFocus
                          />
                        ) : (
                          <motion.div
                            key="display"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-wrap gap-1 cursor-pointer"
                            onClick={() => handleStartEdit(meal, person)}
                          >
                            {meals[meal][person].map((item, i) => (
                              <span
                                key={i}
                                className="inline-block px-2 py-0.5 text-[11px] text-white/50 rounded-md"
                                style={{
                                  background: "rgba(255,255,255,0.04)",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                }}
                              >
                                {item}
                              </span>
                            ))}
                            <span className="inline-block px-1.5 py-0.5 text-[11px] text-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                              edit
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassTile>
  );
}
