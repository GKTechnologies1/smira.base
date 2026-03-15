import React from 'react';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const priorityStyles = {
  low: 'bg-secondary text-secondary-foreground',
  medium: 'bg-accent/10 text-accent-foreground',
  high: 'bg-chart-4/10 text-chart-4',
  urgent: 'bg-destructive/10 text-destructive',
};

const categoryLabels = {
  work: 'Work', personal: 'Personal', health: 'Health', family: 'Family',
  errands: 'Errands', finance: 'Finance', social: 'Social', learning: 'Learning', other: 'Other'
};

export default function TaskCard({ task, onToggle, onClick }) {
  const isDone = task.status === 'completed';

  return (
    <div
      className="flex items-start gap-3 p-4 bg-card rounded-2xl border border-border hover:shadow-sm transition-all group cursor-pointer"
      onClick={() => onClick(task)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task); }}
        className="mt-0.5 flex-shrink-0"
      >
        {isDone ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", isDone && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge className={cn("text-xs rounded-lg", priorityStyles[task.priority])}>
            {task.priority}
          </Badge>
          <Badge variant="outline" className="text-xs rounded-lg">
            {categoryLabels[task.category] || task.category}
          </Badge>
          {task.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(task.due_date), 'MMM d')}
              {task.due_time && ` · ${task.due_time}`}
            </span>
          )}
          {task.source === 'ai_extracted' && (
            <Badge className="text-xs rounded-lg bg-primary/10 text-primary">AI</Badge>
          )}
        </div>
      </div>
    </div>
  );
}