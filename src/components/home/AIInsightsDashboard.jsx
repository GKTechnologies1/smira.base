import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, TrendingUp, Brain, Heart, Wallet, Flame, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays, parseISO, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';

const moodColors = {
  joyful: 'bg-yellow-100 text-yellow-700', grateful: 'bg-green-100 text-green-700',
  calm: 'bg-blue-100 text-blue-700', neutral: 'bg-gray-100 text-gray-600',
  stressed: 'bg-orange-100 text-orange-700', sad: 'bg-indigo-100 text-indigo-700',
  anxious: 'bg-red-100 text-red-700', reflective: 'bg-purple-100 text-purple-700',
  motivated: 'bg-teal-100 text-teal-700', tired: 'bg-slate-100 text-slate-600',
};

const positiveModds = ['joyful', 'grateful', 'calm', 'motivated'];

export default function AIInsightsDashboard() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const last30 = subDays(new Date(), 30);

  const { data: journals = [] } = useQuery({
    queryKey: ['journals-insights'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 100),
  });
  const { data: habitLogs = [] } = useQuery({
    queryKey: ['habit-logs-insights'],
    queryFn: () => base44.entities.HabitLog.list('-date', 200),
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-insights'],
    queryFn: () => base44.entities.FinancialTransaction.list('-date', 100),
  });

  // --- Local analytics ---
  const recentJournals = useMemo(() => journals.filter(j => j.created_date && isAfter(new Date(j.created_date), last30)), [journals]);
  const recentLogs = useMemo(() => habitLogs.filter(l => l.date && isAfter(parseISO(l.date), last30)), [habitLogs]);
  const recentTx = useMemo(() => transactions.filter(t => t.date && isAfter(parseISO(t.date), last30)), [transactions]);

  const moodFreq = useMemo(() => {
    const freq = {};
    recentJournals.forEach(j => { if (j.mood) freq[j.mood] = (freq[j.mood] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [recentJournals]);

  const topMood = moodFreq[0]?.[0];
  const positiveRatio = recentJournals.length
    ? Math.round((recentJournals.filter(j => positiveModds.includes(j.mood)).length / recentJournals.length) * 100)
    : null;

  const totalExpenses = recentTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const totalIncome = recentTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);

  // Mood-habit correlation: days with habits completed → avg positive mood
  const moodHabitCorrelation = useMemo(() => {
    const dayMap = {};
    recentLogs.forEach(l => {
      if (!dayMap[l.date]) dayMap[l.date] = { habits: 0 };
      dayMap[l.date].habits += 1;
    });
    recentJournals.forEach(j => {
      const d = j.created_date?.slice(0, 10);
      if (d && dayMap[d]) dayMap[d].mood = j.mood;
    });
    const withBoth = Object.values(dayMap).filter(d => d.mood);
    if (!withBoth.length) return null;
    const highHabit = withBoth.filter(d => d.habits >= 2);
    const lowHabit = withBoth.filter(d => d.habits < 2);
    const posRate = arr => arr.length ? Math.round((arr.filter(d => positiveModds.includes(d.mood)).length / arr.length) * 100) : null;
    return { high: posRate(highHabit), low: posRate(lowHabit), highCount: highHabit.length, lowCount: lowHabit.length };
  }, [recentLogs, recentJournals]);

  const generateInsights = async () => {
    setLoading(true);
    setInsights(null);
    const moodSummary = moodFreq.map(([m, c]) => `${m}: ${c}x`).join(', ');
    const topExpCategories = {};
    recentTx.filter(t => t.type === 'expense').forEach(t => {
      topExpCategories[t.category] = (topExpCategories[t.category] || 0) + t.amount;
    });
    const topCats = Object.entries(topExpCategories).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}: $${v.toFixed(0)}`).join(', ');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Smira, a warm and empathetic life companion. Analyze 30 days of data and give warm, specific life-improvement insights.

DATA:
- Journal moods (last 30 days): ${moodSummary || 'no data'}
- Positive mood rate: ${positiveRatio !== null ? positiveRatio + '%' : 'unknown'}
- Habit completions logged: ${recentLogs.length}
- Financial: income $${totalIncome.toFixed(0)}, expenses $${totalExpenses.toFixed(0)} (top: ${topCats || 'none'})
- Mood-habit link: on days with 2+ habits, positive mood ${moodHabitCorrelation?.high ?? '?'}% vs ${moodHabitCorrelation?.low ?? '?'}% on low-habit days

Give exactly 3 insights as a JSON array. Each insight has: "title" (5 words max), "body" (2 sentences, specific and actionable), "type" (one of: mood, habits, finance, balance).
Return only valid JSON like: [{"title":"...","body":"...","type":"..."},...]`,
      response_json_schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: { title: { type: 'string' }, body: { type: 'string' }, type: { type: 'string' } }
            }
          }
        }
      }
    });
    setInsights(Array.isArray(result) ? result : result?.insights || []);
    setLoading(false);
    setExpanded(true);
  };

  const typeConfig = {
    mood: { icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50 border-pink-100' },
    habits: { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-100' },
    finance: { icon: Wallet, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-100' },
    balance: { icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' },
  };

  const hasData = recentJournals.length > 0 || recentLogs.length > 0 || recentTx.length > 0;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold font-lora">Your Life Patterns</h2>
              <p className="text-xs text-muted-foreground">Smira's reflections from the last 30 days</p>
            </div>
          </div>
          <Button size="sm" onClick={generateInsights} disabled={loading || !hasData} className="rounded-xl gap-2">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : insights ? <RefreshCw className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
            {insights ? 'Refresh' : 'Show insights'}
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border border-b border-border">
        <div className="p-4 text-center">
          <p className="text-2xl font-bold">{recentJournals.length}</p>
          <p className="text-xs text-muted-foreground">Journal entries</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-2xl font-bold">{recentLogs.length}</p>
          <p className="text-xs text-muted-foreground">Habit check-ins</p>
        </div>
        <div className="p-4 text-center">
          <p className={cn("text-2xl font-bold", positiveRatio >= 60 ? 'text-green-600' : positiveRatio >= 40 ? 'text-yellow-600' : 'text-destructive')}>
            {positiveRatio !== null ? `${positiveRatio}%` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Positive moods</p>
        </div>
        <div className="p-4 text-center">
          <p className={cn("text-2xl font-bold", totalIncome >= totalExpenses ? 'text-green-600' : 'text-destructive')}>
            {totalIncome >= totalExpenses ? '+' : '-'}${Math.abs(totalIncome - totalExpenses).toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">Net balance</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Mood frequency */}
        {moodFreq.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mood Frequency</p>
            <div className="flex flex-wrap gap-2">
              {moodFreq.map(([mood, count]) => (
                <span key={mood} className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border", moodColors[mood] || 'bg-secondary text-foreground')}>
                  {mood} × {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mood-habit correlation */}
        {moodHabitCorrelation && moodHabitCorrelation.high !== null && (
          <div className="bg-secondary rounded-xl p-4">
            <p className="text-xs font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Mood × Habit Correlation
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-lg font-bold text-green-600">{moodHabitCorrelation.high}%</p>
                <p className="text-xs text-muted-foreground">positive mood on high-habit days</p>
              </div>
              <div>
                <p className="text-lg font-bold text-muted-foreground">{moodHabitCorrelation.low}%</p>
                <p className="text-xs text-muted-foreground">positive mood on low-habit days</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Insights */}
        {!hasData && (
          <p className="text-sm text-muted-foreground text-center py-4">Add journal entries, habits, and transactions to unlock insights.</p>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-3 py-6 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm">Smira is analyzing your patterns…</span>
          </div>
        )}

        {insights && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What Smira Noticed</p>
            {insights.map((insight, i) => {
              const cfg = typeConfig[insight.type] || typeConfig.balance;
              const Icon = cfg.icon;
              return (
                <div key={i} className={cn("rounded-xl p-4 border", cfg.bg)}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn("w-4 h-4", cfg.color)} />
                    <p className="text-sm font-semibold">{insight.title}</p>
                  </div>
                  <p className="text-sm leading-relaxed">{insight.body}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}