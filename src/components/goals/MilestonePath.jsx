import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, Plus, X, ChevronDown, ChevronRight, DollarSign, CheckSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

function SubTaskList({ milestone, goalId }) {
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const queryClient = useQueryClient();

  const subTasks = milestone.sub_tasks || [];

  const saveSubTasks = async (updated) => {
    await base44.entities.Milestone.update(milestone.id, { sub_tasks: updated });
    queryClient.invalidateQueries({ queryKey: ['milestones', goalId] });
  };

  const addSubTask = async () => {
    if (!newTitle.trim()) return;
    const updated = [...subTasks, { id: Date.now().toString(), title: newTitle.trim(), done: false }];
    await saveSubTasks(updated);
    setNewTitle('');
    setAdding(false);
  };

  const toggleSubTask = async (id) => {
    const updated = subTasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    await saveSubTasks(updated);
  };

  const removeSubTask = async (id) => {
    await saveSubTasks(subTasks.filter(t => t.id !== id));
  };

  const doneCount = subTasks.filter(t => t.done).length;

  return (
    <div className="mt-2 space-y-1.5">
      {subTasks.length > 0 && (
        <div className="flex items-center gap-1.5 mb-1">
          <CheckSquare className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{doneCount}/{subTasks.length} sub-tasks</span>
          {subTasks.length > 0 && (
            <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden ml-1">
              <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${(doneCount / subTasks.length) * 100}%` }} />
            </div>
          )}
        </div>
      )}
      {subTasks.map(t => (
        <div key={t.id} className="flex items-center gap-2 group">
          <button onClick={() => toggleSubTask(t.id)} className="flex-shrink-0">
            {t.done
              ? <CheckCircle2 className="w-4 h-4 text-primary" />
              : <Circle className="w-4 h-4 text-muted-foreground" />}
          </button>
          <span className={cn("text-xs flex-1", t.done && "line-through text-muted-foreground")}>{t.title}</span>
          <button onClick={() => removeSubTask(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
      {adding ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addSubTask(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="Sub-task title..."
            className="flex-1 text-xs bg-background border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <button onClick={addSubTask} className="text-xs text-primary font-medium">Add</button>
          <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
          <Plus className="w-3 h-3" /> Add sub-task
        </button>
      )}
    </div>
  );
}

export default function MilestonePath({ milestones, onToggle, goalId, tasks = [], transactions = [] }) {
  const [expanded, setExpanded] = useState({});
  const sorted = [...milestones].sort((a, b) => (a.order || 0) - (b.order || 0));

  if (sorted.length === 0) return null;

  const completedCount = sorted.filter(m => m.status === 'completed').length;
  const progressPct = Math.round((completedCount / sorted.length) * 100);

  // Compute path-to-completion: find next non-completed milestone
  const nextIdx = sorted.findIndex(m => m.status !== 'completed');

  return (
    <div className="space-y-1">
      {/* Path progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden relative">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{completedCount}/{sorted.length} complete</span>
      </div>

      {sorted.map((m, i) => {
        const isNext = i === nextIdx;
        const isOpen = expanded[m.id];
        const subDone = (m.sub_tasks || []).filter(t => t.done).length;
        const subTotal = (m.sub_tasks || []).length;

        // Linked finance progress
        const totalSavings = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
        const savingsPct = m.linked_finance_amount > 0 ? Math.min(100, Math.round((totalSavings / m.linked_finance_amount) * 100)) : null;

        // Linked tasks
        const linkedTasks = m.linked_task_category
          ? tasks.filter(t => t.category === m.linked_task_category)
          : [];
        const linkedDone = linkedTasks.filter(t => t.status === 'completed').length;

        return (
          <div key={m.id} className="flex items-start gap-3 relative">
            {i < sorted.length - 1 && (
              <div className="absolute left-3.5 top-7 w-0.5 bg-border z-0" style={{ height: 'calc(100% + 4px)' }} />
            )}
            <button
              onClick={() => onToggle(m)}
              className="flex-shrink-0 z-10 transition-transform hover:scale-110 mt-0.5"
              title="Click to cycle status"
            >
              {m.status === 'completed' ? (
                <CheckCircle2 className="w-7 h-7 text-primary" />
              ) : m.status === 'in_progress' ? (
                <Clock className="w-7 h-7 text-accent-foreground" />
              ) : (
                <Circle className={cn("w-7 h-7", isNext ? "text-primary/60" : "text-muted-foreground")} />
              )}
            </button>

            <div className={cn(
              'flex-1 rounded-xl p-3 mb-3 transition-all',
              m.status === 'completed' ? 'bg-primary/5 border border-primary/20' :
              m.status === 'in_progress' ? 'bg-accent/10 border border-accent/30' :
              isNext ? 'bg-card border border-primary/40 shadow-sm' : 'bg-secondary border border-transparent'
            )}>
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {isNext && m.status !== 'completed' && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md mb-1 inline-block">Next up</span>
                  )}
                  <p className={cn('font-medium text-sm', m.status === 'completed' && 'line-through text-muted-foreground')}>
                    {m.title}
                  </p>
                  {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                </div>
                <button
                  onClick={() => setExpanded(e => ({ ...e, [m.id]: !e[m.id] }))}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                >
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              {/* Metadata row */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {m.target_date && (
                  <span className="text-xs text-muted-foreground">{format(parseISO(m.target_date), 'MMM d, yyyy')}</span>
                )}
                {subTotal > 0 && (
                  <span className="text-xs bg-secondary border border-border px-1.5 py-0.5 rounded-md">
                    ✓ {subDone}/{subTotal} tasks
                  </span>
                )}
                {m.linked_finance_amount > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">
                    <DollarSign className="w-2.5 h-2.5" />
                    {savingsPct !== null ? `${savingsPct}% of $${m.linked_finance_amount}` : `$${m.linked_finance_amount} target`}
                  </span>
                )}
                {linkedTasks.length > 0 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md font-medium">
                    {linkedDone}/{linkedTasks.length} {m.linked_task_category} tasks
                  </span>
                )}
              </div>

              {/* Finance progress bar */}
              {savingsPct !== null && (
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${savingsPct}%` }} />
                </div>
              )}

              {/* Expandable sub-tasks */}
              {isOpen && (
                <SubTaskList milestone={m} goalId={goalId} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}