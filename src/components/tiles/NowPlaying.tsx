import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassTile from '../GlassTile';
import { useNowPlaying } from '../../hooks/useNowPlaying';
import type { TileId } from '../../hooks/useGridLayout';

interface Props {
    tileId?: TileId;
    onTileResize?: (
        edge: 'left' | 'right' | 'top' | 'bottom',
        delta: number,
    ) => void;
    gridStyle?: React.CSSProperties;
    idleOpacity?: number;
}

function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Thin SVG icons — all 16×16 viewport
function IconPrev() {
    return (
        <svg
            width='12'
            height='12'
            viewBox='0 0 16 16'
            fill='currentColor'
        >
            <path d='M3 2h2v12H3zm10 0L7 8l6 6V2z' />
        </svg>
    );
}
function IconNext() {
    return (
        <svg
            width='12'
            height='12'
            viewBox='0 0 16 16'
            fill='currentColor'
        >
            <path d='M11 2h2v12h-2zM3 2l6 6-6 6V2z' />
        </svg>
    );
}
function IconFwd() {
    return (
        <svg
            width='12'
            height='12'
            viewBox='0 0 16 16'
            fill='currentColor'
        >
            <path d='M8 8L2 4v8zm6 0L8 4v8z' />
        </svg>
    );
}
function IconRew() {
    return (
        <svg
            width='12'
            height='12'
            viewBox='0 0 16 16'
            fill='currentColor'
        >
            <path d='M8 8l6-4v8zm-6 0l6-4v8z' />
        </svg>
    );
}
function IconPlay() {
    return (
        <svg
            width='12'
            height='12'
            viewBox='0 0 16 16'
            fill='currentColor'
        >
            <path d='M4 2l10 6-10 6V2z' />
        </svg>
    );
}
function IconPause() {
    return (
        <svg
            width='12'
            height='12'
            viewBox='0 0 16 16'
            fill='currentColor'
        >
            <rect
                x='3'
                y='2'
                width='4'
                height='12'
            />
            <rect
                x='9'
                y='2'
                width='4'
                height='12'
            />
        </svg>
    );
}
function IconMusic() {
    return (
        <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
        >
            <path d='M9 18V5l12-2v13' />
            <circle
                cx='6'
                cy='18'
                r='3'
            />
            <circle
                cx='18'
                cy='16'
                r='3'
            />
        </svg>
    );
}

function CtrlBtn({
    onClick,
    children,
    label,
}: {
    onClick: () => void;
    children: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            className='flex items-center justify-center rounded-md transition-all duration-150 hover:bg-white/10 active:scale-90 text-white/45 hover:text-white/75'
            style={{ width: 22, height: 22, flexShrink: 0 }}
        >
            {children}
        </button>
    );
}

// Marquee that only scrolls if text overflows
function Marquee({ text, className }: { text: string; className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        const span = textRef.current;
        if (!container || !span) return;
        const overflow = span.scrollWidth > container.clientWidth;
        span.style.animationPlayState = overflow ? 'running' : 'paused';
        span.style.animationDuration = overflow
            ? `${Math.max(6, span.scrollWidth / 40)}s`
            : '0s';
    });

    return (
        <div
            ref={containerRef}
            className={`overflow-hidden relative ${className ?? ''}`}
        >
            <span
                ref={textRef}
                className='whitespace-nowrap inline-block'
                style={{
                    animation: 'marquee-scroll linear infinite',
                    animationPlayState: 'paused',
                }}
            >
                {text}
            </span>
        </div>
    );
}

// Deterministic hue from track identity so each song has its own mood color
function trackHue(trackName: string, artist: string): number {
    const str = trackName + artist;
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
    }
    return h % 360;
}

export default function NowPlaying({
    tileId,
    onTileResize,
    gridStyle,
    idleOpacity,
}: Props) {
    const {
        nowPlaying,
        loading,
        togglePlay,
        nextTrack,
        previousTrack,
        skipForward,
        skipBackward,
        playLofiPlaylist,
    } = useNowPlaying();

    const progress =
        nowPlaying && nowPlaying.duration > 0
            ? (nowPlaying.position / nowPlaying.duration) * 100
            : 0;

    const hue = nowPlaying
        ? trackHue(nowPlaying.trackName || '', nowPlaying.artist || '')
        : null;
    const accentRgb = hue !== null ? `hsl(${hue}, 55%, 60%)` : null;

    return (
        <GlassTile
            delay={2}
            className='flex flex-col px-3 py-3 gap-1.5'
            tileId={tileId}
            onResize={onTileResize}
            style={gridStyle}
            idleOpacity={idleOpacity}
        >
            {/* Album color bleed — transitions per-track */}
            <AnimatePresence>
                {accentRgb && (
                    <motion.div
                        key={hue}
                        className='absolute inset-0 pointer-events-none rounded-[20px] overflow-hidden'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: nowPlaying?.isPlaying ? 1 : 0.4 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2.5, ease: 'easeInOut' }}
                        style={{
                            background: `radial-gradient(ellipse 140% 100% at 50% 110%, ${accentRgb}28, transparent 65%)`,
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className='flex items-center justify-between relative'>
                <span className='tile-label'>Music</span>
                <button
                    onClick={playLofiPlaylist}
                    title='Play lo‑fi playlist'
                    className='text-[8px] font-medium text-indigo-400/50 hover:text-indigo-300/80 transition-colors uppercase tracking-wider'
                >
                    lo‑fi
                </button>
            </div>

            {/* Track info */}
            <div className='flex-1 flex flex-col justify-center min-h-0 gap-0.5'>
                <AnimatePresence mode='wait'>
                    {nowPlaying ? (
                        <motion.div
                            key={nowPlaying.trackName}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.3 }}
                            className='flex flex-col gap-0.5'
                        >
                            <Marquee
                                text={nowPlaying.trackName || 'Unknown Track'}
                                className='text-[11px] font-medium text-white/80 leading-tight'
                            />
                            <Marquee
                                text={nowPlaying.artist || 'Unknown Artist'}
                                className='text-[10px] text-white/35 leading-tight'
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key='idle'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className='flex flex-col items-center justify-center gap-1 py-1'
                        >
                            <span className='text-white/15'>
                                <IconMusic />
                            </span>
                            <span className='text-[9px] text-white/20'>
                                {loading ? 'Starting…' : 'Not playing'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div
                className='w-full rounded-full overflow-hidden'
                style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}
            >
                <motion.div
                    className='h-full rounded-full'
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'linear' }}
                    style={{
                        background: accentRgb
                            ? `linear-gradient(90deg, ${accentRgb}90, ${accentRgb}60)`
                            : 'linear-gradient(90deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4))',
                    }}
                />
            </div>

            {/* Time */}
            {nowPlaying && (
                <div
                    className='flex justify-between'
                    style={{ marginTop: -2 }}
                >
                    <span className='text-[8px] tabular-nums text-white/20'>
                        {formatTime(nowPlaying.position)}
                    </span>
                    <span className='text-[8px] tabular-nums text-white/15'>
                        {formatTime(nowPlaying.duration)}
                    </span>
                </div>
            )}

            {/* Controls */}
            <div className='flex items-center justify-between'>
                <CtrlBtn
                    onClick={previousTrack}
                    label='Previous track'
                >
                    <IconPrev />
                </CtrlBtn>
                <CtrlBtn
                    onClick={skipBackward}
                    label='Back 15s'
                >
                    <IconRew />
                </CtrlBtn>
                <button
                    onClick={togglePlay}
                    title={nowPlaying?.isPlaying ? 'Pause' : 'Play'}
                    className='flex items-center justify-center rounded-full transition-all duration-150 text-white/70 hover:text-white hover:scale-110 active:scale-95'
                    style={{
                        width: 28,
                        height: 28,
                        background: nowPlaying?.isPlaying
                            ? 'rgba(99,102,241,0.25)'
                            : 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        flexShrink: 0,
                    }}
                >
                    {nowPlaying?.isPlaying ? <IconPause /> : <IconPlay />}
                </button>
                <CtrlBtn
                    onClick={skipForward}
                    label='Forward 15s'
                >
                    <IconFwd />
                </CtrlBtn>
                <CtrlBtn
                    onClick={nextTrack}
                    label='Next track'
                >
                    <IconNext />
                </CtrlBtn>
            </div>
        </GlassTile>
    );
}
