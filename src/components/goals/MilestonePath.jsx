import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function MilestonePath({ milestones, onToggle }) {
  const sorted = [...milestones].sort((a, b) => (a.order || 0) - (b.order || 0));

  if (sorted.length === 0) return null;

  const completedCount = sorted.filter(m => m.status === 'completed').length;
  const progressPct = Math.round((completedCount / sorted.length) * 100);

  return (
    <div className="space-y-1">
      {/* Path progress bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{completedCount}/{sorted.length}</span>
      </div>

      {sorted.map((m, i) => (
        <div key={m.id} className="flex items-start gap-3 relative">
          {/* Connector line */}
          {i < sorted.length - 1 && (
            <div className="absolute left-3.5 top-7 w-0.5 bg-border z-0" style={{ height: 'calc(100% + 4px)' }} />
          )}
          {/* Node toggle */}
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
              <Circle className="w-7 h-7 text-muted-foreground" />
            )}
          </button>
          {/* Content */}
          <div className={cn(
            'flex-1 rounded-xl p-3 mb-3',
            m.status === 'completed' ? 'bg-primary/5 border border-primary/20' :
            m.status === 'in_progress' ? 'bg-accent/10 border border-accent/30' : 'bg-secondary'
          )}>
            <p className={cn('font-medium text-sm', m.status === 'completed' && 'line-through text-muted-foreground')}>
              {m.title}
            </p>
            {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {m.target_date && (
                <span className="text-xs text-muted-foreground">{format(parseISO(m.target_date), 'MMM d, yyyy')}</span>
              )}
              {m.linked_finance_amount > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-md font-medium">
                  💰 ${m.linked_finance_amount} target
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}