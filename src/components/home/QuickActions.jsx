import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, BookOpen, CheckSquare, Wallet, Heart, Mail } from 'lucide-react';

const actions = [
  { label: 'Talk to Smira', icon: MessageCircle, path: '/Chat', color: 'bg-primary/10 text-primary' },
  { label: 'Write Journal', icon: BookOpen, path: '/Journal', color: 'bg-chart-2/10 text-accent' },
  { label: 'Add Task', icon: CheckSquare, path: '/Tasks', color: 'bg-chart-3/10 text-chart-3' },
  { label: 'Log Expense', icon: Wallet, path: '/Finance', color: 'bg-chart-4/10 text-chart-4' },
  { label: 'Save Memory', icon: Heart, path: '/Memories', color: 'bg-chart-5/10 text-chart-5' },
  { label: 'Future Message', icon: Mail, path: '/FutureMessages', color: 'bg-chart-1/10 text-chart-1' },
];

export default function QuickActions() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <Link
              key={action.path}
              to={action.path}
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:shadow-md transition-all duration-200 group"
            >
              <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}