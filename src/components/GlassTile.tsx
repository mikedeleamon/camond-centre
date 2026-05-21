import { useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import type { TileId } from "../hooks/useGridLayout";

interface Props {
  children: ReactNode;
  className?: string;
  gridArea?: string;
  delay?: number;
  tileId?: TileId;
  onResize?: (edge: "left" | "right" | "top" | "bottom", delta: number) => void;
  style?: React.CSSProperties;
  idleOpacity?: number;
  active?: boolean;
}

export default function GlassTile({
  children,
  className = "",
  gridArea,
  delay = 0,
  tileId,
  onResize,
  style: extraStyle,
  idleOpacity,
  active = false,
}: Props) {
  const [altHeld, setAltHeld] = useState(false);
  const dragRef = useRef<{
    edge: "left" | "right" | "top" | "bottom";
    startX: number;
    startY: number;
    cellW: number;
    cellH: number;
    accumulated: number;
  } | null>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === "Alt") setAltHeld(true); };
    const up = (e: KeyboardEvent) => { if (e.key === "Alt") setAltHeld(false); };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const startDrag = useCallback(
    (edge: "left" | "right" | "top" | "bottom", e: React.MouseEvent) => {
      if (!onResize) return;
      e.preventDefault();
      e.stopPropagation();

      const grid = (e.currentTarget as HTMLElement).closest(".dashboard-grid") as HTMLElement;
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      const cellW = rect.width / 12;
      const cellH = rect.height / 5;

      dragRef.current = { edge, startX: e.clientX, startY: e.clientY, cellW, cellH, accumulated: 0 };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const d = dragRef.current;
        const isHoriz = edge === "left" || edge === "right";
        const px = isHoriz ? ev.clientX - d.startX : ev.clientY - d.startY;
        const cellSize = isHoriz ? d.cellW : d.cellH;
        const snapped = Math.round(px / cellSize);
        if (snapped !== d.accumulated) {
          const delta = snapped - d.accumulated;
          d.accumulated = snapped;
          onResize(edge, delta);
        }
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [onResize]
  );

  const showHandles = altHeld && !!onResize;

  // Build combined style. CSS handles the entrance animation via the .tile-enter class.
  // Idle dimming is applied on the <main> wrapper in App.tsx so that the per-tile
  // opacity never triggers a fresh GPU compositing layer on each tile (which broke
  // hover/scroll events in macOS transparent Electron windows).
  const combinedStyle: React.CSSProperties = {
    ...(gridArea ? { gridArea } : undefined),
    ...extraStyle,
    // Per-tile stagger delay for the entrance animation (handled by .tile-enter in CSS)
    animationDelay: `${0.3 + delay * 0.1}s`,
  };

  return (
    <div
      className={`glass-tile tile-enter relative ${active ? "glass-tile-active" : ""} ${className}`}
      style={combinedStyle}
    >
      {children}

      {showHandles && (
        <>
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-50"
            style={{ background: "rgba(99,102,241,0.3)" }}
            onMouseDown={(e) => startDrag("left", e)}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-50"
            style={{ background: "rgba(99,102,241,0.3)" }}
            onMouseDown={(e) => startDrag("right", e)}
          />
          <div
            className="absolute top-0 left-0 right-0 h-2 cursor-row-resize z-50"
            style={{ background: "rgba(99,102,241,0.3)" }}
            onMouseDown={(e) => startDrag("top", e)}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize z-50"
            style={{ background: "rgba(99,102,241,0.3)" }}
            onMouseDown={(e) => startDrag("bottom", e)}
          />
        </>
      )}
    </div>
  );
}
