import { Children, cloneElement, isValidElement, useState } from "react";
import type { ReactNode, ReactElement } from "react";
import type { TileSpan, TileId } from "../hooks/useGridLayout";

interface Props {
  children: ReactNode;
  spans: Record<TileId, TileSpan>;
  onResize: (id: TileId, edge: "left" | "right" | "top" | "bottom", delta: number) => void;
  onSwap?: (a: TileId, b: TileId) => void;
  hiddenTiles?: string[];
}

const TILE_ORDER: TileId[] = ["time", "wthr", "music", "curr", "tl", "notif", "menu", "task"];

export default function DashboardGrid({ children, spans, onResize, onSwap, hiddenTiles = [] }: Props) {
  const [dragId, setDragId] = useState<TileId | null>(null);
  const [overId,  setOverId]  = useState<TileId | null>(null);

  const childArray = Children.toArray(children).filter(isValidElement) as ReactElement[];

  return (
    <div
      className="w-full h-full p-5 grid gap-3 dashboard-grid"
      style={{ gridTemplateColumns: "repeat(12, 1fr)", gridTemplateRows: "repeat(5, 1fr)" }}
    >
      {childArray.map((child, i) => {
        const tileId = TILE_ORDER[i];
        if (!tileId) return child;
        const span = spans[tileId];
        const gridStyle = {
          gridColumn: `${span.colStart} / ${span.colEnd}`,
          gridRow: `${span.rowStart} / ${span.rowEnd}`,
        };

        if (hiddenTiles.includes(tileId)) {
          return <div key={tileId} style={gridStyle} aria-hidden />;
        }

        const isDragSource = dragId === tileId;
        const isDragTarget = overId === tileId && dragId !== null && dragId !== tileId;

        return (
          <div
            key={tileId}
            style={{
              ...gridStyle,
              position: "relative",
              opacity: isDragSource ? 0.35 : 1,
              transition: "opacity 0.15s ease",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragId !== tileId) setOverId(tileId);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId && dragId !== tileId && onSwap) onSwap(dragId, tileId);
              setDragId(null);
              setOverId(null);
            }}
          >
            {/* Drag handle — top strip, below resize handles (z-50) but above tile content */}
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                // Use a transparent 1×1 image as drag ghost so the tile doesn't visually ghost-copy
                const ghost = document.createElement("div");
                ghost.style.cssText = "position:fixed;top:-999px;left:-999px;width:1px;height:1px";
                document.body.appendChild(ghost);
                e.dataTransfer.setDragImage(ghost, 0, 0);
                setTimeout(() => document.body.removeChild(ghost), 0);
                setDragId(tileId);
              }}
              onDragEnd={() => { setDragId(null); setOverId(null); }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 28,
                zIndex: 31,
                cursor: "grab",
                borderRadius: "20px 20px 0 0",
              }}
              title="Drag to reorder"
            />

            {/* Drop-target highlight ring */}
            {isDragTarget && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 20,
                  border: "1px solid rgba(99,102,241,0.55)",
                  boxShadow: "0 0 0 3px rgba(99,102,241,0.12)",
                  pointerEvents: "none",
                  zIndex: 40,
                }}
              />
            )}

            {cloneElement(child, {
              ...child.props,
              key: tileId,
              tileId,
              onTileResize: (edge: "left" | "right" | "top" | "bottom", delta: number) =>
                onResize(tileId, edge, delta),
              gridStyle,
            } as Record<string, unknown>)}
          </div>
        );
      })}
    </div>
  );
}
