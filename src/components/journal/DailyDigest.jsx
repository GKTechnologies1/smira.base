import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, isToday, parseISO, startOfDay } from 'date-fns';
import { Sparkles, Loader2, CheckCircle2, Heart, Wallet, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const today = format(new Date(), 'yyyy-MM-dd');

export default function DailyDigest({ onUsePrompt }) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: habitLogs = [] } = useQuery({
    queryKey: ['habit-logs-today'],
    queryFn: () => base44.entities.HabitLog.filter({ date: today, completed: true }, '-created_date', 20),
  });

  const { data: memories = [] } = useQuery({
    queryKey: ['memories-today'],
    queryFn: async () => {
      const all = await base44.entities.Memory.list('-created_date', 50);
      return all.filter(m => m.date_of_memory === today || isToday(new Date(m.created_date)));
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-today'],
    queryFn: async () => {
      const all = await base44.entities.FinancialTransaction.list('-created_date', 50);
      return all.filter(t => t.date === today || isToday(new Date(t.created_date)));
    },
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

  const generatePrompt = async () => {
    setLoading(true);
    setAiPrompt('');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Smira, a warm life companion. Today (${format(new Date(), 'MMMM d, yyyy')}) the user:
- Completed ${habitLogs.length} habit${habitLogs.length !== 1 ? 's' : ''}: ${habitLogs.map(h => h.habit_title).join(', ') || 'none'}
- Logged ${memories.length} memory/memories: ${memories.map(m => m.title).join(', ') || 'none'}
- Had ${transactions.length} transactions: income $${totalIncome.toFixed(0)}, expenses $${totalExpense.toFixed(0)}

Write ONE warm, thoughtful journal reflection prompt (not a question list — just a single opening sentence or two) that ties their day together and invites them to reflect. Be personal, specific to their data, and inspiring. Keep it under 40 words.`,
    });
    setAiPrompt(typeof result === 'string' ? result.trim() : '');
    setLoading(false);
  };

  const hasData = habitLogs.length > 0 || memories.length > 0 || transactions.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
        <p className="text-xs text-muted-foreground mb-1">{format(new Date(), 'EEEE, MMMM d')}</p>
        <h2 className="font-semibold text-lg">Today's Digest</h2>
        <p className="text-sm text-muted-foreground mt-0.5">A snapshot of your day before you write</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Flame className="w-5 h-5 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{habitLogs.length}</p>
          <p className="text-xs text-muted-foreground">Habits done</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Heart className="w-5 h-5 text-pink-500 mx-auto mb-2" />
          <p className="text-2xl font-bold">{memories.length}</p>
          <p className="text-xs text-muted-foreground">Memories</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <Wallet className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{transactions.length}</p>
          <p className="text-xs text-muted-foreground">Transactions</p>
        </div>
      </div>

      {/* Detail lists */}
      {habitLogs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Completed Habits</p>
          <div className="flex flex-wrap gap-2">
            {habitLogs.map(log => (
              <Badge key={log.id} className="bg-orange-100 text-orange-700 border-none rounded-lg gap-1">
                <CheckCircle2 className="w-3 h-3" /> {log.habit_title}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {memories.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Today's Memories</p>
          <div className="space-y-1.5">
            {memories.map(m => (
              <p key={m.id} className="text-sm flex items-center gap-2">
                <Heart className="w-3 h-3 text-pink-500 flex-shrink-0" /> {m.title}
              </p>
            ))}
          </div>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Financial Activity</p>
          <div className="flex gap-4 text-sm">
            {totalIncome > 0 && <span className="text-green-600 font-medium">+${totalIncome.toFixed(2)} income</span>}
            {totalExpense > 0 && <span className="text-destructive font-medium">-${totalExpense.toFixed(2)} spent</span>}
          </div>
        </div>
      )}

      {!hasData && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Nothing logged yet today. Your digest will fill in as you go through your day.</p>
        </div>
      )}

      {/* AI Prompt generator */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">Smira's Reflection Prompt</p>
          </div>
          <Button size="sm" variant="ghost" onClick={generatePrompt} disabled={loading} className="h-7 text-xs rounded-lg">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Generate'}
          </Button>
        </div>
        {aiPrompt ? (
          <div className="space-y-3">
            <p className="text-sm italic leading-relaxed">"{aiPrompt}"</p>
            {onUsePrompt && (
              <Button size="sm" onClick={() => onUsePrompt(aiPrompt)} className="rounded-xl w-full">
                Use This Prompt to Write
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Click Generate to get a personalized reflection prompt based on your day.</p>
        )}
      </div>
    </div>
  );
}