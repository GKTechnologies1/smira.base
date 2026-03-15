import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, CheckSquare, Wallet, Heart } from 'lucide-react';
import { format } from 'date-fns';

const typeConfig = {
  journal: { icon: BookOpen, color: 'text-accent', bg: 'bg-accent/10' },
  task: { icon: CheckSquare, color: 'text-chart-3', bg: 'bg-chart-3/10' },
  finance: { icon: Wallet, color: 'text-chart-4', bg: 'bg-chart-4/10' },
  memory: { icon: Heart, color: 'text-chart-5', bg: 'bg-chart-5/10' },
};

export default function RecentActivity() {
  const { data: journals = [] } = useQuery({
    queryKey: ['journals-recent'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 3),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-recent'],
    queryFn: () => base44.entities.Task.list('-created_date', 3),
  });

  const activities = [
    ...journals.map(j => ({ type: 'journal', title: j.title || 'Journal entry', date: j.created_date, mood: j.mood })),
    ...tasks.map(t => ({ type: 'task', title: t.title, date: t.created_date, status: t.status })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  if (activities.length === 0) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Activity</h3>
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">No activity yet. Start by talking to Smira!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Activity</h3>
      <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
        {activities.map((activity, i) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;
          return (
            <div key={i} className="flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors">
              <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{activity.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(activity.date), 'MMM d, h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}