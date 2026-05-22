import { Children, cloneElement, isValidElement } from "react";
import type { ReactNode, ReactElement } from "react";
import type { TileSpan, TileId } from "../hooks/useGridLayout";

interface Props {
  children: ReactNode;
  spans: Record<TileId, TileSpan>;
  onResize: (id: TileId, edge: "left" | "right" | "top" | "bottom", delta: number) => void;
  /** Tile IDs whose grid cells are occupied but invisible (preserves layout). */
  hiddenTiles?: string[];
}

const TILE_ORDER: TileId[] = ["time", "wthr", "music", "curr", "tl", "notif", "menu", "task"];

export default function DashboardGrid({ children, spans, onResize, hiddenTiles = [] }: Props) {
  const childArray = Children.toArray(children).filter(isValidElement) as ReactElement[];

  return (
    <div
      className="w-full h-full p-5 grid gap-3 dashboard-grid"
      style={{
        gridTemplateColumns: "repeat(12, 1fr)",
        gridTemplateRows: "repeat(5, 1fr)",
      }}
    >
      {childArray.map((child, i) => {
        const tileId = TILE_ORDER[i];
        if (!tileId) return child;
        const span = spans[tileId];
        const gridStyle = {
          gridColumn: `${span.colStart} / ${span.colEnd}`,
          gridRow: `${span.rowStart} / ${span.rowEnd}`,
        };

        // Hidden tile: render an invisible placeholder that keeps the grid cell
        // allocated so sibling tile indices (and therefore spans) stay correct.
        if (hiddenTiles.includes(tileId)) {
          return <div key={tileId} style={gridStyle} aria-hidden />;
        }

        return cloneElement(child, {
          ...child.props,
          key: tileId,
          tileId,
          onTileResize: (edge: "left" | "right" | "top" | "bottom", delta: number) =>
            onResize(tileId, edge, delta),
          gridStyle,
        } as Record<string, unknown>);
      })}
    </div>
  );
}
