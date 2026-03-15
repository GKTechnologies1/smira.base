import React from 'react';
import { Target, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

export default function GoalCard({ goal, categoryColors }) {
  const pct = goal.progress_percent || 0;
  const colorClass = categoryColors[goal.category] || 'bg-gray-100 text-gray-700';

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all w-full">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm leading-tight">{goal.title}</h3>
        </div>
        <Badge className={`text-xs rounded-lg ${colorClass}`}>{goal.category}</Badge>
      </div>
      {goal.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{goal.description}</p>}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {goal.target_date && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          <Calendar className="w-3 h-3" />
          <span>Target: {format(parseISO(goal.target_date), 'MMM d, yyyy')}</span>
        </div>
      )}
    </div>
  );
}