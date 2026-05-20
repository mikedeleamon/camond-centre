import { useState, useEffect, useRef } from "react";

export function useIdleDetection(timeoutMs: number) {
  const [idle, setIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const reset = () => {
      if (idle) setIdle(false);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIdle(true), timeoutMs);
    };

    reset();
    window.addEventListener("mousemove", reset);
    window.addEventListener("mousedown", reset);
    window.addEventListener("keydown", reset);

    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("mousedown", reset);
      window.removeEventListener("keydown", reset);
    };
  }, [timeoutMs, idle]);

  return idle;
}
