import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, CheckSquare, Wallet, Heart } from 'lucide-react';

export default function StatsOverview() {
  const { data: journals = [] } = useQuery({
    queryKey: ['journals-all'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 100),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-all'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-all'],
    queryFn: () => base44.entities.FinancialTransaction.list('-created_date', 100),
  });

  const { data: memories = [] } = useQuery({
    queryKey: ['memories-all'],
    queryFn: () => base44.entities.Memory.list('-created_date', 100),
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);

  const stats = [
    { label: 'Journal Entries', value: journals.length, icon: BookOpen, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Pending Tasks', value: pendingTasks, icon: CheckSquare, color: 'text-chart-3', bg: 'bg-chart-3/10' },
    { label: 'This Month', value: `$${totalExpenses.toFixed(0)}`, icon: Wallet, color: 'text-chart-4', bg: 'bg-chart-4/10' },
    { label: 'Memories', value: memories.length, icon: Heart, color: 'text-chart-5', bg: 'bg-chart-5/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(stat => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}