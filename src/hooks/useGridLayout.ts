import { useCallback } from "react";
import { useStorage } from "./useStorage";

export interface TileSpan {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

export type TileId = "tl" | "time" | "wthr" | "music" | "curr" | "notif" | "menu" | "task";

const COLS = 12;
const ROWS = 5;

const DEFAULT_SPANS: Record<TileId, TileSpan> = {
  tl:    { colStart: 1,  colEnd: 3,  rowStart: 1, rowEnd: 6 },
  time:  { colStart: 3,  colEnd: 7,  rowStart: 1, rowEnd: 2 },
  wthr:  { colStart: 3,  colEnd: 6,  rowStart: 2, rowEnd: 3 },  // 3 cols (was 4)
  music: { colStart: 6,  colEnd: 7,  rowStart: 2, rowEnd: 3 },  // 1×1
  curr:  { colStart: 7,  colEnd: 13, rowStart: 1, rowEnd: 3 },
  menu:  { colStart: 3,  colEnd: 6,  rowStart: 3, rowEnd: 6 },
  notif: { colStart: 6,  colEnd: 9,  rowStart: 3, rowEnd: 6 },
  task:  { colStart: 9,  colEnd: 13, rowStart: 3, rowEnd: 6 },
};

export function useGridLayout() {
  // v2: adds "music" tile — new key resets any cached v1 layout
  const [spans, setSpans] = useStorage<Record<TileId, TileSpan>>("grid-layout-v2", DEFAULT_SPANS);

  const resizeTile = useCallback(
    (id: TileId, edge: "left" | "right" | "top" | "bottom", delta: number) => {
      setSpans((prev) => {
        const span = { ...prev[id] };
        switch (edge) {
          case "left":
            span.colStart = Math.max(1, Math.min(span.colEnd - 1, span.colStart + delta));
            break;
          case "right":
            span.colEnd = Math.min(COLS + 1, Math.max(span.colStart + 1, span.colEnd + delta));
            break;
          case "top":
            span.rowStart = Math.max(1, Math.min(span.rowEnd - 1, span.rowStart + delta));
            break;
          case "bottom":
            span.rowEnd = Math.min(ROWS + 1, Math.max(span.rowStart + 1, span.rowEnd + delta));
            break;
        }
        return { ...prev, [id]: span };
      });
    },
    [setSpans]
  );

  const resetLayout = useCallback(() => {
    setSpans(DEFAULT_SPANS);
  }, [setSpans]);

  return { spans, resizeTile, resetLayout, COLS, ROWS };
}
