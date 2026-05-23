import { useState, useEffect, useRef, useCallback } from "react";

export function useIdleDetection(timeoutMs: number) {
  const [idle, setIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const idleRef = useRef(false);

  const reset = useCallback(() => {
    if (idleRef.current) {
      idleRef.current = false;
      setIdle(false);
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      idleRef.current = true;
      setIdle(true);
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
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
  }, [reset]);

  return idle;
}
