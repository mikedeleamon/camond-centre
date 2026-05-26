import { useState, useRef, useEffect } from "react";
import GlassTile from "../GlassTile";
import type { MealPlans, Pantry, PantryCategory } from "../../types";
import { PANTRY_CATEGORIES } from "../../types";
import type { TileId } from "../../hooks/useGridLayout";

// ── props ────────────────────────────────────────────────────────────────────

interface Props {
  meals: MealPlans;
  onUpdate: (meals: MealPlans) => void;
  pantry: Pantry;
  onPantryUpdate: (pantry: Pantry) => void;
  onCopyYesterday?: () => void;
  tileId?: TileId;
  onTileResize?: (edge: "left" | "right" | "top" | "bottom", delta: number) => void;
  gridStyle?: React.CSSProperties;
  idleOpacity?: number;
}

type MealTime = "breakfast" | "lunch" | "snack" | "dinner";
type Person = "you" | "kid";

const MEAL_INFO: { id: MealTime; label: string; icon: string }[] = [
  { id: "breakfast", label: "Breakfast", icon: "M" },
  { id: "lunch",     label: "Lunch",     icon: "L" },
  { id: "snack",     label: "Snack",     icon: "S" },
  { id: "dinner",    label: "Dinner",    icon: "D" },
];

const PERSON_STYLE: Record<Person, { label: string; accent: string; bg: string; border: string; color: string }> = {
  you: {
    label: "You",
    accent: "rgba(var(--accent), 0.55)",
    bg: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.52)",
  },
  kid: {
    label: "Kid",
    accent: "rgba(var(--accent), 0.55)",
    bg: "rgba(var(--accent), 0.10)",
    border: "rgba(var(--accent-light), 0.22)",
    color: "rgba(var(--accent-light), 0.80)",
  },
};

// ── deterministic shuffle ────────────────────────────────────────────────────
// Simple hash-based seeded random so the same day produces the same picks,
// but a shuffle counter lets users re-roll.

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickItems(pool: string[], count: number, rand: () => number): string[] {
  if (pool.length === 0) return [];
  const shuffled = [...pool].sort(() => rand() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length));
}

function generateMealForPerson(
  pantry: Pantry,
  meal: MealTime,
  person: Person,
  daySeed: number,
  shuffleCount: number,
): string[] {
  const seed = hashStr(`${meal}-${person}-${daySeed}-${shuffleCount}`);
  const rand = seededRandom(seed);

  // Use the appropriate pantry for this person
  const personPantry = pantry[person];

  // Meal-specific category weights
  const configs: Record<MealTime, { cats: PantryCategory[]; counts: number[] }> = {
    breakfast: { cats: ["grains", "fruits", "drinks"],           counts: [1, 1, 1] },
    lunch:    { cats: ["proteins", "grains", "vegetables", "drinks"], counts: [1, 1, 1, 1] },
    snack:    { cats: ["snacks", "fruits", "drinks"],            counts: [1, 1, 1] },
    dinner:   { cats: ["proteins", "vegetables", "grains"],       counts: [1, 1, 1] },
  };

  const { cats, counts } = configs[meal];
  const items: string[] = [];
  for (let i = 0; i < cats.length; i++) {
    items.push(...pickItems(personPantry[cats[i]], counts[i], rand));
  }

  // Kid gets a bonus snack
  if (person === "kid") {
    items.push(...pickItems(personPantry.snacks, 1, rand));
  }

  return items;
}

// ── root component ───────────────────────────────────────────────────────────

export default function MealMenu({
  meals,
  onUpdate,
  pantry,
  onPantryUpdate,
  onCopyYesterday,
  tileId,
  onTileResize,
  gridStyle,
  idleOpacity,
}: Props) {
  const [showPantry, setShowPantry] = useState(false);
  const [addingTo, setAddingTo] = useState<{ meal: MealTime; person: Person } | null>(null);
  const [addValue, setAddValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Pantry editing state
  const [pantryAdding, setPantryAdding] = useState<{ cat: PantryCategory; person: Person } | null>(null);
  const [pantryValue, setPantryValue] = useState("");
  const [pantryPerson, setPantryPerson] = useState<Person>("you");
  const pantryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingTo) inputRef.current?.focus();
  }, [addingTo]);

  useEffect(() => {
    if (pantryAdding) pantryInputRef.current?.focus();
  }, [pantryAdding]);

  // ── Today's menu helpers ─────────────────────────────────────────────────

  function removeItem(meal: MealTime, person: Person, index: number) {
    onUpdate({
      ...meals,
      [meal]: {
        ...meals[meal],
        [person]: meals[meal][person].filter((_: string, i: number) => i !== index),
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

  // Generate a fresh recommendation for one meal+person from the pantry
  function shuffleMeal(meal: MealTime, person: Person) {
    // Use current timestamp so each click produces different results
    const suggestion = generateMealForPerson(pantry, meal, person, Date.now(), 0);
    if (suggestion.length === 0) return;
    onUpdate({
      ...meals,
      [meal]: {
        ...meals[meal],
        [person]: suggestion,
      },
    });
  }

  // Generate all meals from the pantry
  function suggestAll() {
    const seed = Date.now();
    const newMeals = { ...meals };
    for (const { id: meal } of MEAL_INFO) {
      newMeals[meal] = {
        you: generateMealForPerson(pantry, meal, "you", seed, 0),
        kid: generateMealForPerson(pantry, meal, "kid", seed, 0),
      };
    }
    onUpdate(newMeals);
  }

  // ── Pantry helpers ───────────────────────────────────────────────────────

  function addPantryItem(person: Person, cat: PantryCategory) {
    const trimmed = pantryValue.trim();
    if (!trimmed) return;
    if (pantry[person][cat].some((x: string) => x.toLowerCase() === trimmed.toLowerCase())) {
      setPantryAdding(null);
      setPantryValue("");
      return;
    }
    onPantryUpdate({
      ...pantry,
      [person]: {
        ...pantry[person],
        [cat]: [...pantry[person][cat], trimmed],
      },
    });
    setPantryValue("");
    // keep adding to same category
  }

  function removePantryItem(person: Person, cat: PantryCategory, index: number) {
    onPantryUpdate({
      ...pantry,
      [person]: {
        ...pantry[person],
        [cat]: pantry[person][cat].filter((_: string, i: number) => i !== index),
      },
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <GlassTile
      delay={4}
      className="flex flex-col"
      tileId={tileId}
      onResize={onTileResize}
      style={gridStyle}
      idleOpacity={idleOpacity}
    >
      <div style={{ flex: 1, minHeight: 0, overflow: "clip" }}>
        <div
          style={{
            display: "flex",
            width: "200%",
            height: "100%",
            transform: showPantry ? "translateX(-50%)" : "translateX(0%)",
            transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* ── Today's Menu panel ──────────────────────────── */}
          <div style={{ width: "50%", flexShrink: 0 }} className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="tile-label">Kitchen</h3>
              <div className="flex items-center gap-1.5">
                {onCopyYesterday && (
                  <button
                    onClick={onCopyYesterday}
                    className="text-[9px] px-1.5 py-0.5 rounded transition-colors text-white/25 hover:text-white/55"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                    title="Copy yesterday's menu"
                  >
                    Yesterday
                  </button>
                )}
                <button
                  onClick={suggestAll}
                  className="text-[9px] px-1.5 py-0.5 rounded transition-colors"
                  style={{ color: "rgba(var(--accent-light), 0.40)", background: "rgba(var(--accent), 0.06)", border: "1px solid rgba(var(--accent), 0.15)" }}
                  title="Suggest all meals from pantry"
                >
                  Suggest All
                </button>
                <button
                  onClick={() => setShowPantry(true)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white/25 hover:text-white/55 hover:bg-white/[0.06] transition-all"
                  title="Edit pantry"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
                    <path d="M12 3v10" />
                    <path d="M8 7h8" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
              {MEAL_INFO.map(({ id: meal, label }) => (
                <div key={meal}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <h4 className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "rgba(var(--accent-light), 0.40)" }}>
                      {label}
                    </h4>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.04)" }} />
                  </div>

                  <div className="space-y-2">
                    {(["you", "kid"] as const).map((person) => {
                      const ps = PERSON_STYLE[person];
                      const items = meals[meal][person];
                      const isAdding = addingTo?.meal === meal && addingTo?.person === person;

                      return (
                        <div key={person} className="flex items-start gap-2">
                          <span
                            className="text-[10px] uppercase w-7 mt-1 shrink-0 font-medium"
                            style={{ color: person === "kid" ? "rgba(var(--accent-light), 0.35)" : "rgba(255,255,255,0.22)" }}
                          >
                            {ps.label}
                          </span>

                          <div className="flex flex-wrap gap-1 flex-1 min-w-0 items-center">
                            {items.length === 0 && !isAdding && (
                              <span className="text-[10px] italic text-white/12">tap + or Suggest</span>
                            )}
                            {items.map((item: string, i: number) => (
                              <span
                                key={i}
                                className="group/chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                                style={{ background: ps.bg, border: `1px solid ${ps.border}`, color: ps.color }}
                              >
                                {item}
                                <button
                                  onClick={() => removeItem(meal, person, i)}
                                  className="leading-none ml-0.5 text-white/20 hover:text-white/60 transition-colors"
                                  style={{ fontSize: "10px", lineHeight: 1 }}
                                >
                                  ×
                                </button>
                              </span>
                            ))}

                            {isAdding ? (
                              <input
                                ref={inputRef}
                                className="rounded-md px-2 py-0.5 text-[11px] text-white/70 outline-none min-w-0"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  border: `1px solid rgba(var(--accent), ${person === "kid" ? "0.40" : "0.35"})`,
                                  width: Math.max(80, addValue.length * 7 + 24) + "px",
                                }}
                                placeholder="add item..."
                                value={addValue}
                                onChange={(e) => setAddValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") { e.preventDefault(); confirmAdd(); }
                                  if (e.key === "Escape") { setAddingTo(null); setAddValue(""); }
                                }}
                                onBlur={() => confirmAdd()}
                              />
                            ) : (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => startAdding(meal, person)}
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md transition-all text-white/18 hover:text-white/50"
                                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                                  title="Add item"
                                >
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => shuffleMeal(meal, person)}
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md transition-all text-white/18 hover:text-white/55"
                                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                                  title="Shuffle from pantry"
                                >
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="16 3 21 3 21 8" />
                                    <line x1="4" y1="20" x2="21" y2="3" />
                                    <polyline points="21 16 21 21 16 21" />
                                    <line x1="15" y1="15" x2="21" y2="21" />
                                    <line x1="4" y1="4" x2="9" y2="9" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Pantry panel ──────────────────────────────────── */}
          <div style={{ width: "50%", flexShrink: 0 }} className="flex flex-col h-full">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <button
                onClick={() => { setShowPantry(false); setPantryAdding(null); setPantryValue(""); }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all shrink-0"
                title="Back"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="tile-label">Pantry</span>
            </div>

            {/* Pantry person tabs */}
            <div className="flex gap-1 mb-3 shrink-0">
              {(["you", "kid"] as const).map((person) => (
                <button
                  key={person}
                  onClick={() => {
                    setPantryPerson(person);
                    setPantryAdding(null);
                    setPantryValue("");
                  }}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all uppercase"
                  style={{
                    background: pantryPerson === person ? "rgba(var(--accent), 0.18)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${pantryPerson === person ? "rgba(var(--accent), 0.35)" : "rgba(255,255,255,0.07)"}`,
                    color: pantryPerson === person ? "rgba(var(--accent-light), 0.90)" : "rgba(255,255,255,0.30)",
                  }}
                >
                  {PERSON_STYLE[person].label}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-white/20 mb-3 leading-relaxed">
              Add foods to build the recommendation pool.
            </p>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
              {PANTRY_CATEGORIES.map(({ id: cat, label, emoji }) => {
                const items = pantry[pantryPerson][cat];
                const isAdding = pantryAdding?.cat === cat && pantryAdding?.person === pantryPerson;

                return (
                  <div key={cat}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px]">{emoji}</span>
                      <h4 className="text-[10px] font-medium text-white/30 uppercase tracking-wider">{label}</h4>
                      <span className="text-[9px] text-white/15 tabular-nums">({items.length})</span>
                      <div className="flex-1" />
                      {!isAdding && (
                        <button
                          onClick={() => { setPantryAdding({ cat, person: pantryPerson }); setPantryValue(""); }}
                          className="w-4 h-4 rounded flex items-center justify-center text-white/18 hover:text-white/50 transition-colors"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {items.map((item: string, i: number) => (
                        <span
                          key={i}
                          className="group/chip inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            color: "rgba(255,255,255,0.45)",
                          }}
                        >
                          {item}
                          <button
                            onClick={() => removePantryItem(pantryPerson, cat, i)}
                            className="leading-none ml-0.5 text-white/20 hover:text-white/60 transition-colors"
                            style={{ fontSize: "10px", lineHeight: 1 }}
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {isAdding && (
                        <input
                          ref={pantryInputRef}
                          className="rounded-md px-2 py-0.5 text-[11px] text-white/70 outline-none min-w-0"
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(var(--accent), 0.35)",
                            width: Math.max(80, pantryValue.length * 7 + 24) + "px",
                          }}
                          placeholder={`add ${label.toLowerCase()}...`}
                          value={pantryValue}
                          onChange={(e) => setPantryValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); addPantryItem(pantryPerson, cat); }
                            if (e.key === "Escape") { setPantryAdding(null); setPantryValue(""); }
                          }}
                          onBlur={() => {
                            addPantryItem(pantryPerson, cat);
                            setPantryAdding(null);
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </GlassTile>
  );
}
