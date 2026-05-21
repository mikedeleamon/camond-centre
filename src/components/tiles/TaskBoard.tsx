import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassTile from '../GlassTile';
import type { Task, TaskPriority, RepeatOption } from '../../types';
import type { TileId } from '../../hooks/useGridLayout';

// ── visual maps ───────────────────────────────────────────────────────────────

const PRIORITY_DOT: Record<TaskPriority, string> = {
    none: 'rgba(255,255,255,0.12)',
    low: 'rgba(99,102,241,0.75)',
    medium: 'rgba(245,158,11,0.85)',
    high: 'rgba(239,68,68,0.85)',
};

const KID_CHIP = {
    bg: 'rgba(139,92,246,0.14)',
    border: 'rgba(139,92,246,0.30)',
    color: 'rgba(192,160,255,0.90)',
};

const PRIORITY_CHIP: Record<
    TaskPriority,
    { bg: string; border: string; color: string }
> = {
    none: {
        bg: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.07)',
        color: 'rgba(255,255,255,0.30)',
    },
    low: {
        bg: 'rgba(99,102,241,0.14)',
        border: 'rgba(99,102,241,0.25)',
        color: 'rgba(165,167,255,0.85)',
    },
    medium: {
        bg: 'rgba(245,158,11,0.14)',
        border: 'rgba(245,158,11,0.30)',
        color: 'rgba(251,191,36,0.90)',
    },
    high: {
        bg: 'rgba(239,68,68,0.14)',
        border: 'rgba(239,68,68,0.30)',
        color: 'rgba(248,113,113,0.90)',
    },
};

const DURATION_PRESETS = [
    { label: '10m', value: 10 },
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '1h', value: 60 },
    { label: '2h', value: 120 },
    { label: '4h', value: 240 },
];

const REPEAT_OPTIONS: RepeatOption[] = ['none', 'daily', 'weekly', 'monthly'];
const PRIORITY_OPTIONS: TaskPriority[] = ['none', 'low', 'medium', 'high'];

// ── helpers ───────────────────────────────────────────────────────────────────

function priorityRank(p?: TaskPriority) {
    return p === 'high' ? 0 : p === 'medium' ? 1 : p === 'low' ? 2 : 3;
}

function fmtDuration(min?: number) {
    if (!min) return '';
    const h = Math.floor(min / 60),
        m = min % 60;
    return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
}

function fmtDue(date?: string, time?: string) {
    if (!date) return '';
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    const label =
        date === today
            ? 'Today'
            : date === tomorrow
              ? 'Tomorrow'
              : new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                });
    if (!time) return label;
    const [h, m] = time.split(':').map(Number);
    return `${label}  ${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function isOverdue(date?: string, time?: string) {
    if (!date) return false;
    return new Date(`${date}T${time ?? '23:59'}:00`) < new Date();
}

// ── props ─────────────────────────────────────────────────────────────────────

interface Props {
    tasks: Task[];
    onUpdate: (tasks: Task[]) => void;
    tileId?: TileId;
    onTileResize?: (
        edge: 'left' | 'right' | 'top' | 'bottom',
        delta: number,
    ) => void;
    gridStyle?: React.CSSProperties;
    idleOpacity?: number;
}

// ── root ──────────────────────────────────────────────────────────────────────

export default function TaskBoard({
    tasks,
    onUpdate,
    tileId,
    onTileResize,
    gridStyle,
    idleOpacity,
}: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);

    // Keep a stable snapshot of the task being edited so the panel doesn't
    // blank out for a frame if the parent re-renders mid-transition.
    const editing = tasks.find((t) => t.id === editingId) ?? null;

    const sorted = [...tasks.filter((t) => !t.completed)].sort((a, b) => {
        const pd = priorityRank(a.priority) - priorityRank(b.priority);
        if (pd) return pd;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        return a.dueDate ? -1 : b.dueDate ? 1 : 0;
    });

    function addNew() {
        const id = `task-${Date.now()}`;
        const newTask: Task = {
            id,
            title: '',
            completed: false,
            createdAt: new Date().toISOString(),
            priority: 'none',
            repeat: 'none',
        };
        // Update parent first so tasks contains the new entry before we open detail.
        onUpdate([...tasks, newTask]);
        setEditingId(id);
    }

    function patch(changes: Partial<Task>) {
        if (!editingId) return;
        onUpdate(
            tasks.map((t) => (t.id === editingId ? { ...t, ...changes } : t)),
        );
    }

    function closeDetail() {
        // Discard if the title was never filled in
        if (editing && !editing.title.trim()) {
            onUpdate(tasks.filter((t) => t.id !== editingId));
        }
        setEditingId(null);
    }

    function deleteTask() {
        onUpdate(tasks.filter((t) => t.id !== editingId));
        setEditingId(null);
    }

    function toggleComplete(id: string) {
        onUpdate(
            tasks.map((t) =>
                t.id === id ? { ...t, completed: !t.completed } : t,
            ),
        );
    }

    const isOpen = editingId !== null;

    return (
        <GlassTile
            delay={5}
            className=''
            tileId={tileId}
            onResize={onTileResize}
            style={gridStyle}
            idleOpacity={idleOpacity}
        >
            {/* ── List panel ──────────────────────────────────── */}
                <motion.div
                    className='absolute inset-0 flex flex-col p-5'
                    animate={{ x: isOpen ? '-100%' : '0%' }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                >
                    {/* Header */}
                    <div className='flex items-center justify-between mb-3 shrink-0'>
                        <h3 className='tile-label'>Tasks</h3>
                        <button
                            onClick={addNew}
                            className='w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all'
                            title='New task'
                        >
                            <svg
                                width='13'
                                height='13'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2.5'
                                strokeLinecap='round'
                            >
                                <line
                                    x1='12'
                                    y1='5'
                                    x2='12'
                                    y2='19'
                                />
                                <line
                                    x1='5'
                                    y1='12'
                                    x2='19'
                                    y2='12'
                                />
                            </svg>
                        </button>
                    </div>

                    {/* Task rows */}
                    <div className='flex-1 min-h-0 overflow-y-auto space-y-1 pr-1'>
                        <AnimatePresence initial={false}>
                            {sorted.map((task) => {
                                const due = fmtDue(task.dueDate, task.dueTime);
                                const dur = fmtDuration(task.duration);
                                const overdue = isOverdue(
                                    task.dueDate,
                                    task.dueTime,
                                );
                                const dot =
                                    PRIORITY_DOT[task.priority ?? 'none'];

                                return (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{
                                            opacity: 0,
                                            x: 8,
                                            height: 0,
                                            marginBottom: 0,
                                        }}
                                        transition={{ duration: 0.18 }}
                                        className='flex items-start gap-2.5 px-2 py-2.5 rounded-lg group cursor-pointer'
                                        style={{ background: 'transparent' }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.background =
                                                'rgba(255,255,255,0.03)')
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.background =
                                                'transparent')
                                        }
                                        onClick={() => setEditingId(task.id)}
                                    >
                                        {/* Complete circle */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleComplete(task.id);
                                            }}
                                            className='mt-0.5 w-3.5 h-3.5 rounded-full border border-white/15 shrink-0 hover:border-indigo-400/50 transition-colors'
                                        />

                                        {/* Priority dot */}
                                        <div
                                            className='w-1.5 h-1.5 rounded-full shrink-0 mt-1.5'
                                            style={{ background: dot }}
                                        />

                                        {/* Text */}
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-sm text-white/60 leading-snug truncate'>
                                                {task.title || (
                                                    <span className='text-white/20 italic'>
                                                        Untitled
                                                    </span>
                                                )}
                                            </p>
                                            {task.notes && (
                                                <p className='text-xs text-white/30 leading-snug mt-0.5 line-clamp-2'>
                                                    {task.notes}
                                                </p>
                                            )}
                                            <div className='flex items-center gap-2 mt-1 flex-wrap'>
                                                {task.isKid && (
                                                    <span
                                                        className='text-[9px] font-medium px-1 rounded'
                                                        style={{
                                                            background: 'rgba(139,92,246,0.15)',
                                                            color: 'rgba(192,160,255,0.70)',
                                                        }}
                                                    >
                                                        Kid
                                                    </span>
                                                )}
                                                {due ? (
                                                    <span
                                                        className='text-[10px]'
                                                        style={{
                                                            color: overdue
                                                                ? 'rgba(248,113,113,0.65)'
                                                                : 'rgba(255,255,255,0.28)',
                                                        }}
                                                    >
                                                        {due}
                                                    </span>
                                                ) : null}
                                                {dur ? (
                                                    <span className='text-[10px] text-white/20'>
                                                        {dur}
                                                    </span>
                                                ) : null}
                                                {task.repeat &&
                                                task.repeat !== 'none' ? (
                                                    <span className='text-[10px] text-indigo-400/45 capitalize'>
                                                        ↻ {task.repeat}
                                                    </span>
                                                ) : null}
                                                {!task.isKid &&
                                                    !due &&
                                                    !dur &&
                                                    (!task.repeat ||
                                                        task.repeat ===
                                                            'none') && (
                                                        <span className='text-[10px] text-white/15'>
                                                            {new Date(
                                                                task.createdAt,
                                                            ).toLocaleDateString(
                                                                'en-US',
                                                                {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                },
                                                            )}
                                                        </span>
                                                    )}
                                            </div>
                                        </div>

                                        {/* Edit icon — always visible, brightens on row hover */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingId(task.id);
                                            }}
                                            className='shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/[0.07] transition-all'
                                            title='Edit'
                                        >
                                            <svg
                                                width='10'
                                                height='10'
                                                viewBox='0 0 24 24'
                                                fill='none'
                                                stroke='rgba(255,255,255,0.4)'
                                                strokeWidth='2'
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                            >
                                                <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                                                <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
                                            </svg>
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {sorted.length === 0 && (
                            <p className='text-xs text-white/20 text-center py-6'>
                                All clear
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* ── Detail panel ────────────────────────────────── */}
                <motion.div
                    className='absolute inset-0 flex flex-col p-5'
                    initial={{ x: '100%' }}
                    animate={{ x: isOpen ? '0%' : '100%' }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                >
                    {editing && (
                        <TaskDetail
                            task={editing}
                            onChange={patch}
                            onClose={closeDetail}
                            onDelete={deleteTask}
                        />
                    )}
                </motion.div>
        </GlassTile>
    );
}

// ── helpers sub-components ────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
    return (
        <p
            className='text-[10px] uppercase tracking-wider mb-1.5'
            style={{ color: 'rgba(255,255,255,0.22)' }}
        >
            {children}
        </p>
    );
}

function ChipButton({
    active,
    color,
    onClick,
    children,
}: {
    active: boolean;
    color?: { bg: string; border: string; color: string };
    onClick: () => void;
    children: React.ReactNode;
}) {
    const c = color ?? PRIORITY_CHIP.none;
    return (
        <button
            onClick={onClick}
            className='px-2.5 py-1 rounded-md text-xs transition-all'
            style={{
                background: active ? c.bg : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? c.border : 'rgba(255,255,255,0.06)'}`,
                color: active ? c.color : 'rgba(255,255,255,0.32)',
            }}
        >
            {children}
        </button>
    );
}

// ── TaskDetail ────────────────────────────────────────────────────────────────

function TaskDetail({
    task,
    onChange,
    onClose,
    onDelete,
}: {
    task: Task;
    onChange: (changes: Partial<Task>) => void;
    onClose: () => void;
    onDelete: () => void;
}) {
    return (
        <div className='flex flex-col h-full'>
            {/* Header */}
            <div className='flex items-center gap-2 mb-4 shrink-0'>
                <button
                    onClick={onClose}
                    className='w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all shrink-0'
                    title='Back'
                >
                    <svg
                        width='13'
                        height='13'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    >
                        <polyline points='15 18 9 12 15 6' />
                    </svg>
                </button>
                <span className='tile-label'>Edit Task</span>
            </div>

            {/* Scrollable fields */}
            <div className='flex-1 min-h-0 overflow-y-auto space-y-4 pr-1'>
                {/* Title */}
                <input
                    className='w-full bg-transparent text-sm font-medium text-white/80 placeholder-white/20 outline-none pb-2 transition-colors'
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                    placeholder='Task title'
                    value={task.title}
                    onChange={(e) => onChange({ title: e.target.value })}
                    onFocus={(e) =>
                        (e.currentTarget.style.borderBottomColor =
                            'rgba(99,102,241,0.35)')
                    }
                    onBlur={(e) =>
                        (e.currentTarget.style.borderBottomColor =
                            'rgba(255,255,255,0.08)')
                    }
                    autoFocus={!task.title}
                />

                {/* Notes */}
                <textarea
                    className='w-full bg-transparent text-xs text-white/45 placeholder-white/18 outline-none resize-none leading-relaxed'
                    placeholder='Add notes…'
                    rows={3}
                    value={task.notes ?? ''}
                    onChange={(e) =>
                        onChange({ notes: e.target.value || undefined })
                    }
                />

                {/* Assignee — Me or Kid */}
                <div>
                    <FieldLabel>For</FieldLabel>
                    <div className='flex gap-1.5'>
                        <ChipButton
                            active={!task.isKid}
                            onClick={() => onChange({ isKid: false })}
                        >
                            Me
                        </ChipButton>
                        <ChipButton
                            active={!!task.isKid}
                            color={KID_CHIP}
                            onClick={() => onChange({ isKid: true })}
                        >
                            Kid
                        </ChipButton>
                    </div>
                </div>

                {/* Due date + time */}
                <div>
                    <FieldLabel>Due</FieldLabel>
                    <div className='flex gap-2'>
                        <input
                            type='date'
                            className='flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors'
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: task.dueDate
                                    ? 'rgba(255,255,255,0.55)'
                                    : 'rgba(255,255,255,0.20)',
                                colorScheme: 'dark',
                            }}
                            value={task.dueDate ?? ''}
                            onChange={(e) =>
                                onChange({
                                    dueDate: e.target.value || undefined,
                                })
                            }
                        />
                        <input
                            type='time'
                            className='flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none transition-colors'
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: task.dueTime
                                    ? 'rgba(255,255,255,0.55)'
                                    : 'rgba(255,255,255,0.20)',
                                colorScheme: 'dark',
                            }}
                            value={task.dueTime ?? ''}
                            onChange={(e) =>
                                onChange({
                                    dueTime: e.target.value || undefined,
                                })
                            }
                        />
                    </div>
                </div>

                {/* Duration */}
                <div>
                    <FieldLabel>Duration</FieldLabel>
                    <div className='flex gap-1.5 flex-wrap'>
                        {DURATION_PRESETS.map(({ label, value }) => (
                            <ChipButton
                                key={value}
                                active={task.duration === value}
                                onClick={() =>
                                    onChange({
                                        duration:
                                            task.duration === value
                                                ? undefined
                                                : value,
                                    })
                                }
                            >
                                {label}
                            </ChipButton>
                        ))}
                    </div>
                </div>

                {/* Repeat */}
                <div>
                    <FieldLabel>Repeat</FieldLabel>
                    <div className='flex gap-1.5 flex-wrap'>
                        {REPEAT_OPTIONS.map((opt) => (
                            <ChipButton
                                key={opt}
                                active={(task.repeat ?? 'none') === opt}
                                onClick={() => onChange({ repeat: opt })}
                            >
                                {opt === 'none' ? (
                                    '—'
                                ) : (
                                    <span className='capitalize'>{opt}</span>
                                )}
                            </ChipButton>
                        ))}
                    </div>
                </div>

                {/* Priority */}
                <div>
                    <FieldLabel>Priority</FieldLabel>
                    <div className='flex gap-1.5 flex-wrap'>
                        {PRIORITY_OPTIONS.map((opt) => (
                            <ChipButton
                                key={opt}
                                active={(task.priority ?? 'none') === opt}
                                color={PRIORITY_CHIP[opt]}
                                onClick={() => onChange({ priority: opt })}
                            >
                                <span className='flex items-center gap-1.5'>
                                    {opt !== 'none' && (
                                        <span
                                            className='w-1.5 h-1.5 rounded-full inline-block'
                                            style={{
                                                background: PRIORITY_DOT[opt],
                                            }}
                                        />
                                    )}
                                    <span className='capitalize'>
                                        {opt === 'none' ? '—' : opt}
                                    </span>
                                </span>
                            </ChipButton>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div
                className='shrink-0 pt-3 mt-3 flex items-center justify-between'
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
                <button
                    onClick={onDelete}
                    className='text-xs transition-colors'
                    style={{ color: 'rgba(248,113,113,0.45)' }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.color = 'rgba(248,113,113,0.80)')
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.color = 'rgba(248,113,113,0.45)')
                    }
                >
                    Delete task
                </button>
                <span className='text-[10px] text-white/15'>
                    {new Date(task.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                    })}
                </span>
            </div>
        </div>
    );
}
