import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, CheckSquare, Wallet, Heart, Mail, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import FamilyStory from '../components/timeline/FamilyStory';

const typeConfig = {
  journal: { icon: BookOpen, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', label: 'Journal' },
  task: { icon: CheckSquare, color: 'text-chart-3', bg: 'bg-chart-3/10', border: 'border-chart-3/30', label: 'Task' },
  finance: { icon: Wallet, color: 'text-chart-4', bg: 'bg-chart-4/10', border: 'border-chart-4/30', label: 'Finance' },
  memory: { icon: Heart, color: 'text-chart-5', bg: 'bg-chart-5/10', border: 'border-chart-5/30', label: 'Memory' },
  message: { icon: Mail, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30', label: 'Future Message' },
};

export default function Timeline() {
  const [tab, setTab] = useState('my'); // my | family

  const { data: journals = [] } = useQuery({ queryKey: ['journals-timeline'], queryFn: () => base44.entities.JournalEntry.list('-created_date', 50) });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks-timeline'], queryFn: () => base44.entities.Task.list('-created_date', 50) });
  const { data: transactions = [] } = useQuery({ queryKey: ['transactions-timeline'], queryFn: () => base44.entities.FinancialTransaction.list('-created_date', 50) });
  const { data: memories = [] } = useQuery({ queryKey: ['memories-timeline'], queryFn: () => base44.entities.Memory.list('-created_date', 50) });
  const { data: messages = [] } = useQuery({ queryKey: ['messages-timeline'], queryFn: () => base44.entities.FutureMessage.list('-created_date', 50) });

  const items = [
    ...journals.map(j => ({ type: 'journal', title: j.title || 'Journal Entry', desc: j.content, date: j.created_date })),
    ...tasks.map(t => ({ type: 'task', title: t.title, desc: t.description, date: t.created_date, status: t.status })),
    ...transactions.map(t => ({ type: 'finance', title: t.description, desc: `${t.type === 'income' ? '+' : '-'}$${t.amount?.toFixed(2)}`, date: t.created_date })),
    ...memories.map(m => ({ type: 'memory', title: m.title, desc: m.content, date: m.created_date })),
    ...messages.map(m => ({ type: 'message', title: m.title || `To ${m.recipient_name}`, desc: m.content, date: m.created_date })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Timeline</h1>
          <p className="text-sm text-muted-foreground mt-1">Your life story in one view</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary rounded-xl p-1 w-fit mb-6">
        {[{ id: 'my', label: 'My Timeline', icon: Clock }, { id: 'family', label: 'Family Story', icon: Users }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
            tab === t.id ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          )}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'family' ? (
        <FamilyStory />
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">Your timeline is empty</h3>
          <p className="text-sm text-muted-foreground">Start by talking to Smira or adding entries</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6">
            {items.map((item, i) => {
              const config = typeConfig[item.type];
              const Icon = config.icon;
              return (
                <div key={i} className="flex gap-4 relative">
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 border-2", config.bg, config.border)}>
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  <div className="flex-1 bg-card rounded-2xl border border-border p-4 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs font-medium", config.color)}>{config.label}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(item.date), 'MMM d, h:mm a')}</span>
                    </div>
                    <h4 className="text-sm font-semibold">{item.title}</h4>
                    {item.desc && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.desc}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}