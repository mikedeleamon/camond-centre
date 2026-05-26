import { useState, useRef, useEffect } from 'react';
import GlassTile from '../GlassTile';
import type { Task, TaskPriority, RepeatOption, Subtask } from '../../types';
import type { TileId } from '../../hooks/useGridLayout';

// ── visual maps ───────────────────────────────────────────────────────────────

const PRIORITY_DOT: Record<TaskPriority, string> = {
    none: 'rgba(255,255,255,0.12)',
    low: 'rgba(var(--accent), 0.75)',
    medium: 'rgba(245,158,11,0.85)',
    high: 'rgba(239,68,68,0.85)',
};

const KID_CHIP = {
    bg: 'rgba(var(--accent), 0.14)',
    border: 'rgba(var(--accent), 0.30)',
    color: 'rgba(var(--accent-light), 0.90)',
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
        bg: 'rgba(var(--accent), 0.14)',
        border: 'rgba(var(--accent), 0.25)',
        color: 'rgba(var(--accent-light), 0.85)',
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

// ── markdown renderer ─────────────────────────────────────────────────────────
// Supports: **bold**, *italic*, - bullet lists

function renderMarkdown(text: string): React.ReactNode[] {
    const lines = text.split('\n');
    return lines.map((line, i) => {
        // Bullet
        const isBullet = /^[-*]\s/.test(line);
        const content  = isBullet ? line.replace(/^[-*]\s/, '') : line;

        // Inline bold / italic
        const parts: React.ReactNode[] = [];
        const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
        let last = 0, m: RegExpExecArray | null;
        while ((m = regex.exec(content)) !== null) {
            if (m.index > last) parts.push(content.slice(last, m.index));
            if (m[2]) parts.push(<strong key={`b-${i}-${m.index}`} className="font-semibold text-white/60">{m[2]}</strong>);
            else if (m[3]) parts.push(<em key={`e-${i}-${m.index}`} className="italic">{m[3]}</em>);
            last = m.index + m[0].length;
        }
        if (last < content.length) parts.push(content.slice(last));

        return isBullet ? (
            <div key={i} className="flex items-start gap-1.5">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-white/25 shrink-0" />
                <span>{parts}</span>
            </div>
        ) : (
            <div key={i}>{parts}</div>
        );
    });
}

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

function getNextDueDate(date: string, repeat: RepeatOption): string {
    const current = new Date(date + 'T00:00:00');

    switch (repeat) {
        case 'daily':
            current.setDate(current.getDate() + 1);
            break;
        case 'weekly':
            current.setDate(current.getDate() + 7);
            break;
        case 'monthly':
            current.setMonth(current.getMonth() + 1);
            break;
        default:
            return date;
    }

    return current.toISOString().slice(0, 10);
}

// ── task row ─────────────────────────────────────────────────────────────────

function TaskRow({
    task,
    onEdit,
    onToggle,
}: {
    task: Task;
    onEdit: (id: string) => void;
    onToggle: (id: string) => void;
}) {
    const due = fmtDue(task.dueDate, task.dueTime);
    const dur = fmtDuration(task.duration);
    const overdue = isOverdue(task.dueDate, task.dueTime);
    const dot = PRIORITY_DOT[task.priority ?? 'none'];

    return (
        <div
            key={task.id}
            className='flex items-start gap-2.5 px-2 py-2.5 rounded-lg group cursor-pointer transition-colors hover:bg-white/[0.03]'
            onClick={() => onEdit(task.id)}
        >
            <button
                onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                className='mt-0.5 w-3.5 h-3.5 rounded-full border border-white/15 shrink-0 transition-colors'
                style={{ '--hover-border': 'rgba(var(--accent), 0.5)' } as React.CSSProperties}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(var(--accent), 0.5)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
            />
            <div
                className='w-1.5 h-1.5 rounded-full shrink-0 mt-1.5'
                style={{ background: dot }}
            />
            <div className='flex-1 min-w-0'>
                <p className='text-sm text-white/60 leading-snug truncate'>
                    {task.title || (
                        <span className='text-white/20 italic'>Untitled</span>
                    )}
                </p>
                {task.notes && (
                    <div className='text-xs text-white/30 leading-snug mt-0.5 line-clamp-2 space-y-0.5'>
                        {renderMarkdown(task.notes)}
                    </div>
                )}
                {task.subtasks && task.subtasks.length > 0 && (
                    <p className='text-[10px] text-white/20 mt-0.5'>
                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} done
                    </p>
                )}
                <div className='flex items-center gap-2 mt-1 flex-wrap'>
                    {task.isKid && (
                        <span
                            className='text-[9px] font-medium px-1 rounded'
                            style={{ background: 'rgba(var(--accent), 0.15)', color: 'rgba(var(--accent-light), 0.70)' }}
                        >
                            Kid
                        </span>
                    )}
                    {due ? (
                        <span
                            className='text-[10px]'
                            style={{ color: overdue ? 'rgba(248,113,113,0.65)' : 'rgba(255,255,255,0.28)' }}
                        >
                            {due}
                        </span>
                    ) : null}
                    {dur ? (
                        <span className='text-[10px] text-white/20'>{dur}</span>
                    ) : null}
                    {task.repeat && task.repeat !== 'none' ? (
                        <span className='text-[10px] capitalize' style={{ color: 'rgba(var(--accent-light), 0.45)' }}>
                            ↻ {task.repeat}
                        </span>
                    ) : null}
                    {!task.isKid && !due && !dur && (!task.repeat || task.repeat === 'none') && (
                        <span className='text-[10px] text-white/15'>
                            {new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); onEdit(task.id); }}
                className='shrink-0 mt-0.5 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-white/[0.07] transition-all'
                title='Edit'
            >
                <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                    <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                    <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
                </svg>
            </button>
        </div>
    );
}

// ── props ─────────────────────────────────────────────────────────────────────

interface Props {
    tasks: Task[];
    onUpdate: (tasks: Task[]) => void;
    openTaskId?: string | null;
    onOpenTaskIdConsumed?: () => void;
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
    openTaskId,
    onOpenTaskIdConsumed,
    tileId,
    onTileResize,
    gridStyle,
    idleOpacity,
}: Props) {
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        if (openTaskId) {
            setEditingId(openTaskId);
            onOpenTaskIdConsumed?.();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openTaskId]);

    const editing = tasks.find((t) => t.id === editingId) ?? null;

    const active = tasks.filter((t) => !t.completed);

    const timeBound = active
        .filter((t) => t.dueDate)
        .sort((a, b) => {
            const dc = a.dueDate!.localeCompare(b.dueDate!);
            if (dc) return dc;
            if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime);
            return a.dueTime ? -1 : b.dueTime ? 1 : 0;
        });

    const general = active
        .filter((t) => !t.dueDate)
        .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

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
        const task = tasks.find((t) => t.id === id);
        if (!task) return;

        if (task.completed) {
            // If already completed, just uncheck it
            onUpdate(
                tasks.map((t) =>
                    t.id === id ? { ...t, completed: false } : t,
                ),
            );
        } else if (task.repeat && task.repeat !== 'none' && task.dueDate) {
            // If repeating task, create a new one and mark original as completed
            const nextDueDate = getNextDueDate(task.dueDate, task.repeat);
            const newTask: Task = {
                ...task,
                id: `task-${Date.now()}`,
                dueDate: nextDueDate,
                completed: false,
                createdAt: new Date().toISOString(),
                // Reset subtasks to incomplete for the new occurrence
                subtasks: task.subtasks?.map((s) => ({ ...s, completed: false })),
            };
            onUpdate([
                ...tasks.map((t) =>
                    t.id === id ? { ...t, completed: true } : t,
                ),
                newTask,
            ]);
        } else {
            // Regular task, just mark as completed
            onUpdate(
                tasks.map((t) =>
                    t.id === id ? { ...t, completed: true } : t,
                ),
            );
        }
    }

    const isOpen = editingId !== null;

    return (
        <GlassTile
            delay={5}
            className='flex flex-col'
            tileId={tileId}
            onResize={onTileResize}
            style={gridStyle}
            idleOpacity={idleOpacity}
        >
            {/*
              overflow:clip masks the off-screen panel without creating a scroll
              container (overflow:hidden would absorb wheel events in macOS
              transparent Electron windows).
            */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'clip' }}>
                {/* Sliding track — 200% wide, shifts left by 50% to reveal detail */}
                <div
                    style={{
                        display: 'flex',
                        width: '200%',
                        height: '100%',
                        transform: isOpen ? 'translateX(-50%)' : 'translateX(0%)',
                        transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    {/* ── List panel ──────────────────────────────────── */}
                    <div
                        style={{ width: '50%', flexShrink: 0 }}
                        className='flex flex-col h-full'
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
                                    <line x1='12' y1='5' x2='12' y2='19' />
                                    <line x1='5' y1='12' x2='19' y2='12' />
                                </svg>
                            </button>
                        </div>

                        {/* Task rows */}
                        <div className='flex-1 min-h-0 overflow-y-auto space-y-1 pr-1'>
                            {/* ── Time-bound tasks ── */}
                            {timeBound.length > 0 && (
                                <p className='text-[9px] font-semibold uppercase tracking-[0.18em] px-2 pt-1 pb-1' style={{ color: 'rgba(var(--accent-light), 0.35)' }}>
                                    Scheduled
                                </p>
                            )}
                            {timeBound.map((task) => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    onEdit={setEditingId}
                                    onToggle={toggleComplete}
                                />
                            ))}

                            {/* ── General tasks ── */}
                            {general.length > 0 && (
                                <p className='text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25 px-2 pt-3 pb-1'>
                                    General
                                </p>
                            )}
                            {general.map((task) => (
                                <TaskRow
                                    key={task.id}
                                    task={task}
                                    onEdit={setEditingId}
                                    onToggle={toggleComplete}
                                />
                            ))}

                            {timeBound.length === 0 && general.length === 0 && (
                                <p className='text-xs text-white/20 text-center py-6'>
                                    All clear
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ── Detail panel ────────────────────────────────── */}
                    <div
                        style={{ width: '50%', flexShrink: 0 }}
                        className='flex flex-col h-full'
                    >
                        {editing && (
                            <TaskDetail
                                task={editing}
                                onChange={patch}
                                onClose={closeDetail}
                                onDelete={deleteTask}
                            />
                        )}
                    </div>
                </div>
            </div>
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
    const [notesPreview, setNotesPreview] = useState(false);
    const [newSubtask, setNewSubtask]     = useState('');
    const subtaskInputRef                 = useRef<HTMLInputElement>(null);

    function addSubtask() {
        const t = newSubtask.trim();
        if (!t) return;
        const sub: Subtask = { id: `sub-${Date.now()}`, title: t, completed: false };
        onChange({ subtasks: [...(task.subtasks ?? []), sub] });
        setNewSubtask('');
        subtaskInputRef.current?.focus();
    }

    function toggleSubtask(id: string) {
        onChange({
            subtasks: (task.subtasks ?? []).map((s) =>
                s.id === id ? { ...s, completed: !s.completed } : s,
            ),
        });
    }

    function removeSubtask(id: string) {
        onChange({ subtasks: (task.subtasks ?? []).filter((s) => s.id !== id) });
    }

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
                            'rgba(var(--accent), 0.35)')
                    }
                    onBlur={(e) =>
                        (e.currentTarget.style.borderBottomColor =
                            'rgba(255,255,255,0.08)')
                    }
                    autoFocus={!task.title}
                />

                {/* Notes — with markdown preview toggle */}
                <div>
                    <div className='flex items-center justify-between mb-1.5'>
                        <FieldLabel>Notes</FieldLabel>
                        {task.notes && (
                            <button
                                onClick={() => setNotesPreview((v) => !v)}
                                className='text-[9px] px-1.5 py-0.5 rounded transition-colors'
                                style={{
                                    color: notesPreview ? 'rgba(var(--accent-light), 0.80)' : 'rgba(255,255,255,0.28)',
                                    background: notesPreview ? 'rgba(var(--accent), 0.15)' : 'transparent',
                                    border: '1px solid rgba(255,255,255,0.07)',
                                }}
                            >
                                {notesPreview ? 'Edit' : 'Preview'}
                            </button>
                        )}
                    </div>
                    {notesPreview && task.notes ? (
                        <div
                            className='text-xs text-white/40 leading-relaxed space-y-1'
                            onClick={() => setNotesPreview(false)}
                            style={{ cursor: 'text', minHeight: 48 }}
                        >
                            {renderMarkdown(task.notes)}
                        </div>
                    ) : (
                        <textarea
                            className='w-full bg-transparent text-xs text-white/45 placeholder-white/18 outline-none resize-none leading-relaxed'
                            placeholder={'Add notes… (supports **bold**, *italic*, - bullets)'}
                            rows={3}
                            value={task.notes ?? ''}
                            onChange={(e) =>
                                onChange({ notes: e.target.value || undefined })
                            }
                        />
                    )}
                </div>

                {/* Subtasks */}
                <div>
                    <FieldLabel>Subtasks</FieldLabel>
                    <div className='space-y-1 mb-2'>
                        {(task.subtasks ?? []).map((sub) => (
                            <div key={sub.id} className='flex items-center gap-2 group/sub'>
                                <button
                                    onClick={() => toggleSubtask(sub.id)}
                                    className='w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center transition-colors'
                                    style={{
                                        borderColor: sub.completed ? 'rgba(var(--accent), 0.60)' : 'rgba(255,255,255,0.18)',
                                        background: sub.completed ? 'rgba(var(--accent), 0.22)' : 'transparent',
                                    }}
                                >
                                    {sub.completed && (
                                        <svg width='7' height='7' viewBox='0 0 10 10' fill='none'>
                                            <polyline points='1,5 4,8 9,2' style={{ stroke: 'rgba(var(--accent-light), 0.9)' }} strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
                                        </svg>
                                    )}
                                </button>
                                <span
                                    className='flex-1 text-xs leading-snug'
                                    style={{
                                        color: sub.completed ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.52)',
                                        textDecoration: sub.completed ? 'line-through' : 'none',
                                    }}
                                >
                                    {sub.title}
                                </span>
                                <button
                                    onClick={() => removeSubtask(sub.id)}
                                    className='opacity-0 group-hover/sub:opacity-100 transition-opacity text-white/25 hover:text-white/55'
                                    style={{ fontSize: 12, lineHeight: 1 }}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    {/* Add subtask input */}
                    <div className='flex items-center gap-1.5'>
                        <input
                            ref={subtaskInputRef}
                            className='flex-1 bg-transparent text-xs text-white/50 placeholder-white/18 outline-none'
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                            placeholder='Add subtask…'
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); addSubtask(); }
                            }}
                        />
                        <button
                            onClick={addSubtask}
                            className='text-white/25 hover:text-white/55 transition-colors'
                            style={{ fontSize: 16, lineHeight: 1 }}
                        >
                            +
                        </button>
                    </div>
                </div>

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
                                onChange({ dueDate: e.target.value || undefined })
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
                                onChange({ dueTime: e.target.value || undefined })
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
                                            task.duration === value ? undefined : value,
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
                                            style={{ background: PRIORITY_DOT[opt] }}
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
                    className='text-xs transition-colors text-red-400/45 hover:text-red-400/80'
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
