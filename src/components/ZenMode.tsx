import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CalendarEvent } from '../types';
import { useNowPlaying } from '../hooks/useNowPlaying';

interface Props {
    events: CalendarEvent[];
    kidActivities?: CalendarEvent[];
    now: Date;
    onExit: () => void;
}

function trackHue(trackName: string, artist: string): number {
    const str = trackName + artist;
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
    }
    return h % 360;
}

function ZenWaveformBars({
    isPlaying,
    color,
}: {
    isPlaying: boolean;
    color: string;
}) {
    const DURATIONS = ['0.52s', '0.44s', '0.60s', '0.48s', '0.56s'];
    const DELAYS = ['0s', '0.12s', '0.06s', '0.18s', '0.09s'];
    return (
        <div
            className='flex items-end gap-px shrink-0'
            style={{ width: 12, height: 9 }}
            aria-hidden
        >
            {DURATIONS.map((dur, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1,
                        height: '100%',
                        borderRadius: 2,
                        background: color,
                        transformOrigin: 'bottom',
                        opacity: isPlaying ? 0.7 : 0.2,
                        transform: isPlaying ? undefined : 'scaleY(0.15)',
                        animation: isPlaying
                            ? `waveform-bar ${dur} ease-in-out ${DELAYS[i]} infinite`
                            : 'none',
                        transition: 'opacity 0.4s, transform 0.4s',
                    }}
                />
            ))}
        </div>
    );
}

function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

function pickCurrentAndNext(events: CalendarEvent[], nowMinutes: number) {
    let current: CalendarEvent | null = null;
    let next: CalendarEvent | null = null;
    for (const event of events) {
        const start = timeToMinutes(event.startTime);
        const end = timeToMinutes(event.endTime);
        if (nowMinutes >= start && nowMinutes < end) {
            current = event;
        } else if (start > nowMinutes && !next) {
            next = event;
        }
    }
    return { current, next };
}

function formatTime(now: Date, showSeconds: boolean) {
    const h = now.getHours();
    const m = now.getMinutes();
    const s = now.getSeconds();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return showSeconds ? `${hh}:${mm}:${ss} ${ampm}` : `${hh}:${mm} ${ampm}`;
}

// Progress bar for a given event
function EventProgress({
    event,
    nowMinutes,
}: {
    event: CalendarEvent;
    nowMinutes: number;
}) {
    const start = timeToMinutes(event.startTime);
    const end = timeToMinutes(event.endTime);
    const pct = Math.min(
        100,
        Math.max(0, ((nowMinutes - start) / (end - start)) * 100),
    );

    return (
        <div
            className='w-full max-w-xs'
            style={{
                height: 2,
                borderRadius: 99,
                background: 'rgba(255,255,255,0.08)',
            }}
        >
            <div
                style={{
                    height: '100%',
                    width: `${pct}%`,
                    borderRadius: 99,
                    background:
                        'linear-gradient(90deg, rgba(99,102,241,0.7), rgba(165,167,255,0.9))',
                    transition: 'width 60s linear',
                }}
            />
        </div>
    );
}

export default function ZenMode({
    events,
    kidActivities = [],
    now,
    onExit,
}: Props) {
    const { nowPlaying } = useNowPlaying();
    const isPlaying = !!nowPlaying?.isPlaying;
    const hue = nowPlaying
        ? trackHue(nowPlaying.trackName || '', nowPlaying.artist || '')
        : null;
    const accentColor =
        hue !== null ? `hsl(${hue}, 55%, 65%)` : 'rgba(165,167,255,0.7)';

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const { current: currentEvent, next: nextEvent } = useMemo(
        () => pickCurrentAndNext(events, currentMinutes),
        [events, currentMinutes],
    );

    const { current: currentKid, next: nextKid } = useMemo(
        () => pickCurrentAndNext(kidActivities, currentMinutes),
        [kidActivities, currentMinutes],
    );

    const display = currentEvent ?? nextEvent;
    const displayKid = currentKid ?? nextKid;
    const kidIsActive = !!currentKid;

    const label = currentEvent
        ? 'Current Focus'
        : nextEvent
          ? 'Up Next'
          : 'All Clear';

    // ── tap-for-seconds state ──────────────────────────────────────────────────
    const [showSeconds, setShowSeconds] = useState(false);
    const [secTimer, setSecTimer] = useState<ReturnType<
        typeof setTimeout
    > | null>(null);

    const handleBackgroundTap = useCallback(
        (e: React.MouseEvent) => {
            // ignore clicks on the exit button
            if ((e.target as HTMLElement).closest('button[data-exit]')) return;
            if (secTimer) clearTimeout(secTimer);
            setShowSeconds(true);
            const t = setTimeout(() => setShowSeconds(false), 4000);
            setSecTimer(t);
        },
        [secTimer],
    );

    useEffect(
        () => () => {
            if (secTimer) clearTimeout(secTimer);
        },
        [secTimer],
    );

    const timeStr = formatTime(now, showSeconds);

    return (
        <div
            className='fixed inset-0 z-40 flex flex-col items-center justify-center'
            onClick={handleBackgroundTap}
        >
            {/* Clock — fades in/out based on showSeconds, always shows time */}
            <AnimatePresence>
                <motion.div
                    key={showSeconds ? 'with-sec' : 'no-sec'}
                    className='absolute top-8 left-1/2 -translate-x-1/2 tabular-nums pointer-events-none select-none'
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: showSeconds ? 0.55 : 0.18 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        fontSize: 'clamp(0.75rem, 1.2vw, 1rem)',
                        color: 'rgba(255,255,255,0.9)',
                        letterSpacing: '0.08em',
                        fontWeight: 300,
                    }}
                >
                    {timeStr}
                </motion.div>
            </AnimatePresence>

            {/* ── Single-column (no kid) ── */}
            {!displayKid && (
                <motion.div
                    className='flex flex-col items-center gap-5 text-center px-10'
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 1.2,
                        ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                >
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={display?.id ?? 'none'}
                            className='flex flex-col items-center gap-5'
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{
                                duration: 0.55,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                        >
                            <span
                                className='text-xs font-semibold uppercase tracking-[0.25em]'
                                style={{ color: 'rgba(165,167,255,0.4)' }}
                            >
                                {label}
                            </span>
                            <h1
                                className='font-semibold leading-tight'
                                style={{
                                    fontSize: 'clamp(3rem, 6vw, 6rem)',
                                    color: 'rgba(255,255,255,0.85)',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                {display?.title ?? 'No upcoming events'}
                            </h1>
                            {display && (
                                <>
                                    <span
                                        className='text-lg font-light tabular-nums'
                                        style={{
                                            color: 'rgba(255,255,255,0.25)',
                                        }}
                                    >
                                        {display.startTime} – {display.endTime}
                                    </span>
                                    {currentEvent && (
                                        <EventProgress
                                            event={currentEvent}
                                            nowMinutes={currentMinutes}
                                        />
                                    )}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            )}

            {/* ── Split-column (kid present) ── */}
            {displayKid && (
                <div
                    className='flex items-center w-full'
                    style={{ padding: '0 8vw' }}
                >
                    {/* Adult column */}
                    <motion.div
                        className='flex-1 flex flex-col items-center gap-5 text-center px-8'
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            duration: 1.1,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                    >
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={display?.id ?? 'none'}
                                className='flex flex-col items-center gap-5'
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.55 }}
                            >
                                <span
                                    className='text-xs font-semibold uppercase tracking-[0.25em]'
                                    style={{ color: 'rgba(165,167,255,0.4)' }}
                                >
                                    {label}
                                </span>
                                <h1
                                    className='font-semibold leading-tight'
                                    style={{
                                        fontSize:
                                            'clamp(2.2rem, 4.2vw, 4.8rem)',
                                        color: 'rgba(255,255,255,0.85)',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {display?.title ?? 'No upcoming events'}
                                </h1>
                                {display && (
                                    <>
                                        <span
                                            className='text-base font-light tabular-nums'
                                            style={{
                                                color: 'rgba(255,255,255,0.25)',
                                            }}
                                        >
                                            {display.startTime} –{' '}
                                            {display.endTime}
                                        </span>
                                        {currentEvent && (
                                            <EventProgress
                                                event={currentEvent}
                                                nowMinutes={currentMinutes}
                                            />
                                        )}
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>

                    {/* Vertical divider */}
                    <motion.div
                        className='self-stretch mx-6 w-px shrink-0'
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{
                            duration: 0.8,
                            delay: 0.35,
                            ease: 'easeOut',
                        }}
                        style={{
                            background:
                                'linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.35) 30%, rgba(139,92,246,0.35) 70%, transparent 100%)',
                            minHeight: '120px',
                        }}
                    />

                    {/* Kid column */}
                    <motion.div
                        className='flex-1 flex flex-col items-center gap-5 text-center px-8'
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            duration: 1.1,
                            delay: 0.2,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                    >
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={displayKid.id}
                                className='flex flex-col items-center gap-5'
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.55 }}
                            >
                                <span
                                    className='text-xs font-semibold uppercase tracking-[0.25em]'
                                    style={{
                                        color: kidIsActive
                                            ? 'rgba(192,160,255,0.60)'
                                            : 'rgba(192,160,255,0.45)',
                                    }}
                                >
                                    {kidIsActive
                                        ? 'Kid · Now'
                                        : 'Kid · Up Next'}
                                </span>
                                <h2
                                    className='font-semibold leading-tight'
                                    style={{
                                        fontSize:
                                            'clamp(2.2rem, 4.2vw, 4.8rem)',
                                        color: kidIsActive
                                            ? 'rgba(216,180,255,0.88)'
                                            : 'rgba(210,180,255,0.65)',
                                        letterSpacing: '-0.02em',
                                    }}
                                >
                                    {displayKid.title}
                                </h2>
                                <span
                                    className='text-base font-light tabular-nums'
                                    style={{
                                        color: kidIsActive
                                            ? 'rgba(192,160,255,0.40)'
                                            : 'rgba(192,160,255,0.35)',
                                    }}
                                >
                                    {displayKid.startTime} –{' '}
                                    {displayKid.endTime}
                                </span>
                                {kidIsActive && currentKid && (
                                    <div
                                        className='w-full max-w-xs'
                                        style={{
                                            height: 2,
                                            borderRadius: 99,
                                            background: 'rgba(139,92,246,0.15)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${Math.min(100, Math.max(0, ((currentMinutes - timeToMinutes(currentKid.startTime)) / (timeToMinutes(currentKid.endTime) - timeToMinutes(currentKid.startTime))) * 100))}%`,
                                                borderRadius: 99,
                                                background:
                                                    'linear-gradient(90deg, rgba(139,92,246,0.6), rgba(192,160,255,0.8))',
                                                transition: 'width 60s linear',
                                            }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}

            {/* Now Playing footer — slides up when music is playing */}
            <AnimatePresence>
                {nowPlaying && isPlaying && (
                    <motion.div
                        className='fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none select-none'
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{
                            duration: 0.55,
                            ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                    >
                        <ZenWaveformBars
                            isPlaying={isPlaying}
                            color={accentColor}
                        />
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={nowPlaying.trackName}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.3 }}
                                className='flex items-baseline gap-1.5'
                            >
                                <span
                                    className='text-xs font-medium tabular-nums'
                                    style={{
                                        color: 'rgba(255,255,255,0.55)',
                                        letterSpacing: '0.01em',
                                    }}
                                >
                                    {nowPlaying.trackName || 'Unknown Track'}
                                </span>
                                <span
                                    style={{
                                        color: 'rgba(255,255,255,0.18)',
                                        fontSize: '0.6rem',
                                    }}
                                >
                                    ·
                                </span>
                                <span
                                    className='text-xs font-light'
                                    style={{
                                        color: 'rgba(255,255,255,0.25)',
                                        letterSpacing: '0.01em',
                                    }}
                                >
                                    {nowPlaying.artist || 'Unknown Artist'}
                                </span>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                data-exit
                onClick={(e) => {
                    e.stopPropagation();
                    onExit();
                }}
                className='fixed top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110'
                style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
                title='Exit Zen Mode'
            >
                <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='rgba(255,255,255,0.4)'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                >
                    <path d='M18 6L6 18' />
                    <path d='M6 6l12 12' />
                </svg>
            </button>
        </div>
    );
}
