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

// Chip appearance per person
const CHIP_STYLE: Record<Person, { bg: string; border: string; color: string }> = {
  you: {
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.52)",
  },
  kid: {
    bg: "rgba(139,92,246,0.10)",
    border: "rgba(139,92,246,0.22)",
    color: "rgba(192,160,255,0.80)",
  },
};

export default function MealMenu({ meals, onUpdate, tileId, onTileResize, gridStyle, idleOpacity }: Props) {
  const [addingTo, setAddingTo] = useState<{ meal: MealTime; person: Person } | null>(null);
  const [addValue, setAddValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Collapsed meal sections
  const [collapsed, setCollapsed] = useState<Set<MealTime>>(new Set());
  // Drag state
  const dragRef = useRef<{ meal: MealTime; person: Person; index: number } | null>(null);

  useEffect(() => {
    if (addingTo) inputRef.current?.focus();
  }, [addingTo]);

  function toggleCollapse(meal: MealTime) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(meal)) next.delete(meal);
      else next.add(meal);
      return next;
    });
  }

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

  function confirmAdd(openNext?: { meal: MealTime; person: Person }) {
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
    if (openNext) {
      setAddValue("");
      setAddingTo(openNext);
    } else {
      setAddingTo(null);
      setAddValue("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, meal: MealTime, person: Person) {
    if (e.key === "Enter") {
      e.preventDefault();
      // Tab to next person/meal, or just confirm
      const persons: Person[] = ["you", "kid"];
      const meals_order: MealTime[] = ["breakfast", "lunch", "dinner"];
      const pIdx = persons.indexOf(person);
      const mIdx = meals_order.indexOf(meal);
      let next: { meal: MealTime; person: Person } | undefined;
      if (pIdx < persons.length - 1) {
        next = { meal, person: persons[pIdx + 1] };
      } else if (mIdx < meals_order.length - 1) {
        next = { meal: meals_order[mIdx + 1], person: "you" };
      }
      confirmAdd(next);
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const persons: Person[] = ["you", "kid"];
      const meals_order: MealTime[] = ["breakfast", "lunch", "dinner"];
      const pIdx = persons.indexOf(person);
      const mIdx = meals_order.indexOf(meal);
      let next: { meal: MealTime; person: Person } | undefined;
      if (pIdx < persons.length - 1) {
        next = { meal, person: persons[pIdx + 1] };
      } else if (mIdx < meals_order.length - 1) {
        next = { meal: meals_order[mIdx + 1], person: "you" };
      }
      confirmAdd(next);
    }
    if (e.key === "Escape") {
      setAddingTo(null);
      setAddValue("");
    }
  }

  // ── drag-to-reorder ──────────────────────────────────────────────────────
  function onDragStart(meal: MealTime, person: Person, index: number) {
    dragRef.current = { meal, person, index };
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function onDrop(meal: MealTime, person: Person, targetIndex: number) {
    const src = dragRef.current;
    if (!src || src.meal !== meal || src.person !== person || src.index === targetIndex) return;
    const list = [...meals[meal][person]];
    const [item] = list.splice(src.index, 1);
    list.splice(targetIndex, 0, item);
    onUpdate({ ...meals, [meal]: { ...meals[meal], [person]: list } });
    dragRef.current = null;
  }

  return (
    <GlassTile delay={4} className="flex flex-col p-5" tileId={tileId} onResize={onTileResize} style={gridStyle} idleOpacity={idleOpacity}>
      <h3 className="tile-label mb-3">Meal Plan</h3>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {(Object.keys(MEAL_LABELS) as MealTime[]).map((meal) => {
          const isCollapsed = collapsed.has(meal);
          const totalItems = meals[meal].you.length + meals[meal].kid.length;

          return (
            <div key={meal}>
              {/* Section header with collapse toggle */}
              <button
                onClick={() => toggleCollapse(meal)}
                className="flex items-center gap-1.5 w-full text-left mb-1.5 group/header"
              >
                <h4 className="text-[11px] font-medium text-indigo-300/40 uppercase tracking-wider group-hover/header:text-indigo-300/65 transition-colors">
                  {MEAL_LABELS[meal]}
                </h4>
                {isCollapsed && totalItems > 0 && (
                  <span className="text-[9px] text-white/20 tabular-nums">({totalItems})</span>
                )}
                <svg
                  width="8" height="8" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(165,167,255,0.25)" strokeWidth="2.5" strokeLinecap="round"
                  className={`transition-transform duration-200 ml-auto ${isCollapsed ? "-rotate-90" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Collapsible body */}
              {!isCollapsed && (
                <div className="space-y-2">
                  {(["you", "kid"] as const).map((person) => {
                    const cs = CHIP_STYLE[person];
                    const items = meals[meal][person];
                    const isEmpty = items.length === 0;
                    const isAdding = addingTo?.meal === meal && addingTo?.person === person;

                    return (
                      <div key={person} className="flex items-start gap-2">
                        <span
                          className="text-[10px] uppercase w-6 mt-1 shrink-0"
                          style={{ color: person === "kid" ? "rgba(192,160,255,0.35)" : "rgba(255,255,255,0.25)" }}
                        >
                          {person === "you" ? "You" : "Kid"}
                        </span>

                        <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                          {/* Empty state */}
                          {isEmpty && !isAdding && (
                            <span className="text-[10px] italic text-white/15 mt-0.5">
                              nothing added
                            </span>
                          )}

                          {/* Chips */}
                          {items.map((item, i) => (
                            <span
                              key={i}
                              draggable
                              onDragStart={() => onDragStart(meal, person, i)}
                              onDragOver={onDragOver}
                              onDrop={() => onDrop(meal, person, i)}
                              className="group/chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] cursor-grab active:cursor-grabbing"
                              style={{
                                background: cs.bg,
                                border: `1px solid ${cs.border}`,
                                color: cs.color,
                              }}
                            >
                              {item}
                              <button
                                onClick={() => removeItem(meal, person, i)}
                                className="opacity-0 group-hover/chip:opacity-100 transition-opacity leading-none ml-0.5"
                                style={{ color: "rgba(255,255,255,0.30)", fontSize: "10px", lineHeight: 1 }}
                                title="Remove"
                              >
                                ×
                              </button>
                            </span>
                          ))}

                          {/* Inline add input */}
                          {isAdding ? (
                            <input
                              ref={inputRef}
                              className="rounded-md px-2 py-0.5 text-[11px] text-white/70 outline-none min-w-0"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                border: `1px solid ${person === "kid" ? "rgba(139,92,246,0.40)" : "rgba(99,102,241,0.35)"}`,
                                width: Math.max(80, addValue.length * 7 + 24) + "px",
                              }}
                              placeholder="add item…"
                              value={addValue}
                              onChange={(e) => setAddValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, meal, person)}
                              onBlur={() => confirmAdd()}
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
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassTile>
  );
}
