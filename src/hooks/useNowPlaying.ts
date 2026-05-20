import { useState, useEffect, useCallback, useRef } from "react";
import type { NowPlayingData } from "../types";

export function useNowPlaying() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [loading, setLoading] = useState(false);
  const rafRef = useRef<ReturnType<typeof setTimeout>>();

  const fetch = useCallback(async () => {
    if (!window.electronAPI?.music) return;
    try {
      const data = await window.electronAPI.music.getNowPlaying();
      setNowPlaying(data);
    } catch {
      // Music.app may not be open
    }
  }, []);

  useEffect(() => {
    fetch();
    const id = setInterval(fetch, 3000);
    return () => { clearInterval(id); clearTimeout(rafRef.current); };
  }, [fetch]);

  const togglePlay = useCallback(async () => {
    if (!window.electronAPI?.music) return;
    // Optimistically flip isPlaying so UI responds immediately
    setNowPlaying((p) => p ? { ...p, isPlaying: !p.isPlaying } : p);
    await window.electronAPI.music.togglePlay();
    setTimeout(fetch, 400);
  }, [fetch]);

  const nextTrack = useCallback(async () => {
    if (!window.electronAPI?.music) return;
    await window.electronAPI.music.nextTrack();
    setTimeout(fetch, 600);
  }, [fetch]);

  const previousTrack = useCallback(async () => {
    if (!window.electronAPI?.music) return;
    await window.electronAPI.music.previousTrack();
    setTimeout(fetch, 600);
  }, [fetch]);

  const skipForward = useCallback(async () => {
    if (!window.electronAPI?.music) return;
    setNowPlaying((p) => p ? { ...p, position: Math.min(p.position + 15, p.duration) } : p);
    await window.electronAPI.music.skipForward();
    setTimeout(fetch, 400);
  }, [fetch]);

  const skipBackward = useCallback(async () => {
    if (!window.electronAPI?.music) return;
    setNowPlaying((p) => p ? { ...p, position: Math.max(p.position - 15, 0) } : p);
    await window.electronAPI.music.skipBackward();
    setTimeout(fetch, 400);
  }, [fetch]);

  const playLofiPlaylist = useCallback(async () => {
    if (!window.electronAPI?.music) return;
    setLoading(true);
    await window.electronAPI.music.playLofiPlaylist();
    setTimeout(() => { fetch(); setLoading(false); }, 1200);
  }, [fetch]);

  return {
    nowPlaying,
    loading,
    togglePlay,
    nextTrack,
    previousTrack,
    skipForward,
    skipBackward,
    playLofiPlaylist,
  };
}
