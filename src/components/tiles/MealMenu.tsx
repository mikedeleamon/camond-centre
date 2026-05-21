import { useState, useRef, useEffect } from "react";
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
type Person = "you" | "kid";

const MEAL_LABELS: Record<MealTime, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export default function MealMenu({ meals, onUpdate, tileId, onTileResize, gridStyle, idleOpacity }: Props) {
  const [addingTo, setAddingTo] = useState<{ meal: MealTime; person: Person } | null>(null);
  const [addValue, setAddValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingTo) inputRef.current?.focus();
  }, [addingTo]);

  function removeItem(meal: MealTime, person: Person, index: number) {
    onUpdate({
      ...meals,
      [meal]: {
        ...meals[meal],
        [person]: meals[meal][person].filter((_, i) => i !== index),
      },
    });
  }

  function startAdding(meal: MealTime, person: Person) {
    setAddValue("");
    setAddingTo({ meal, person });
  }

  function confirmAdd() {
    const trimmed = addValue.trim();
    if (addingTo && trimmed) {
      onUpdate({
        ...meals,
        [addingTo.meal]: {
          ...meals[addingTo.meal],
          [addingTo.person]: [...meals[addingTo.meal][addingTo.person], trimmed],
        },
      });
    }
    setAddingTo(null);
    setAddValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") confirmAdd();
    if (e.key === "Escape") { setAddingTo(null); setAddValue(""); }
  }

  return (
    <GlassTile delay={4} className="flex flex-col p-5" tileId={tileId} onResize={onTileResize} style={gridStyle} idleOpacity={idleOpacity}>
      <h3 className="tile-label mb-3">Meal Plan</h3>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {(Object.keys(MEAL_LABELS) as MealTime[]).map((meal) => (
          <div key={meal}>
            <h4 className="text-[11px] font-medium text-indigo-300/40 uppercase tracking-wider mb-2">
              {MEAL_LABELS[meal]}
            </h4>

            <div className="space-y-2">
              {(["you", "kid"] as const).map((person) => (
                <div key={person} className="flex items-start gap-2">
                  <span className="text-[10px] text-white/25 uppercase w-6 mt-1 shrink-0">
                    {person === "you" ? "You" : "Kid"}
                  </span>

                  <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                    {meals[meal][person].map((item, i) => (
                      <span
                        key={i}
                        className="group/chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          color: "rgba(255,255,255,0.52)",
                        }}
                      >
                        {item}
                        <button
                          onClick={() => removeItem(meal, person, i)}
                          className="opacity-0 group-hover/chip:opacity-100 transition-opacity leading-none text-white/30 hover:text-white/70 ml-0.5"
                          style={{ fontSize: "10px", lineHeight: 1 }}
                          title="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}

                    {/* Inline add input */}
                    {addingTo?.meal === meal && addingTo?.person === person ? (
                      <input
                        ref={inputRef}
                        className="rounded-md px-2 py-0.5 text-[11px] text-white/70 outline-none min-w-0"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(99,102,241,0.35)",
                          width: Math.max(80, addValue.length * 7 + 24) + "px",
                        }}
                        placeholder="add item…"
                        value={addValue}
                        onChange={(e) => setAddValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={confirmAdd}
                      />
                    ) : (
                      <button
                        onClick={() => startAdding(meal, person)}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-md transition-all text-white/20 hover:text-white/60"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          fontSize: "13px",
                          lineHeight: 1,
                        }}
                        title="Add item"
                      >
                        +
                      </button>
                    )}
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
