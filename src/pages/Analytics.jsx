import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { format, parseISO, startOfWeek, addDays, eachWeekOfInterval, subWeeks } from 'date-fns';
import { Brain, TrendingUp, BarChart2 } from 'lucide-react';

const MOOD_SCORE = {
  joyful: 5, grateful: 5, motivated: 5,
  calm: 4, reflective: 3, neutral: 3,
  tired: 2, stressed: 2, anxious: 1, sad: 1,
};

export default function Analytics() {
  const { data: journals = [] } = useQuery({
    queryKey: ['journals-all'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 300),
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.FinancialTransaction.list('-created_date', 300),
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 300),
  });

  const moodEntries = journals.filter(j => j.mood && j.tags?.includes('daily-checkin'));

  // Weekly mood trend (last 8 weeks)
  const moodTrend = useMemo(() => {
    const weeks = eachWeekOfInterval({ start: subWeeks(new Date(), 7), end: new Date() }, { weekStartsOn: 1 });
    return weeks.map(weekStart => {
      const weekEnd = addDays(weekStart, 7);
      const weekEntries = moodEntries.filter(j => {
        const d = parseISO(j.created_date);
        return d >= weekStart && d < weekEnd;
      });
      const avg = weekEntries.length
        ? weekEntries.reduce((s, j) => s + (MOOD_SCORE[j.mood] || 3), 0) / weekEntries.length
        : null;
      return { week: format(weekStart, 'MMM d'), mood: avg ? parseFloat(avg.toFixed(2)) : null, count: weekEntries.length };
    }).filter(d => d.mood !== null);
  }, [moodEntries]);

  // Mood distribution
  const moodDist = useMemo(() => {
    const dist = {};
    moodEntries.forEach(j => { if (j.mood) dist[j.mood] = (dist[j.mood] || 0) + 1; });
    return Object.entries(dist).map(([mood, count]) => ({ mood, count, score: MOOD_SCORE[mood] || 3 })).sort((a, b) => b.count - a.count);
  }, [moodEntries]);

  // Weekly spending vs mood correlation
  const correlationData = useMemo(() => {
    const weeks = eachWeekOfInterval({ start: subWeeks(new Date(), 7), end: new Date() }, { weekStartsOn: 1 });
    return weeks.map(weekStart => {
      const weekEnd = addDays(weekStart, 7);
      const weekMoods = moodEntries.filter(j => {
        const d = parseISO(j.created_date);
        return d >= weekStart && d < weekEnd;
      });
      const weekSpend = transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const d = t.date ? parseISO(t.date) : parseISO(t.created_date);
        return d >= weekStart && d < weekEnd;
      }).reduce((s, t) => s + (t.amount || 0), 0);
      const weekTasks = tasks.filter(t => {
        const d = parseISO(t.created_date);
        return d >= weekStart && d < weekEnd;
      }).length;
      const avgMood = weekMoods.length
        ? weekMoods.reduce((s, j) => s + (MOOD_SCORE[j.mood] || 3), 0) / weekMoods.length
        : null;
      if (!avgMood) return null;
      return {
        week: format(weekStart, 'MMM d'),
        mood: parseFloat(avgMood.toFixed(2)),
        spending: Math.round(weekSpend),
        tasks: weekTasks,
      };
    }).filter(Boolean);
  }, [moodEntries, transactions, tasks]);

  const avgMood = moodEntries.length
    ? (moodEntries.reduce((s, j) => s + (MOOD_SCORE[j.mood] || 3), 0) / moodEntries.length).toFixed(1)
    : '–';

  const moodLabel = parseFloat(avgMood) >= 4.5 ? 'Thriving 🌟' : parseFloat(avgMood) >= 3.5 ? 'Good ✨' : parseFloat(avgMood) >= 2.5 ? 'Okay 🌤' : 'Needs care 💙';

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Your emotional well-being insights</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Avg. Mood Score</span>
          </div>
          <p className="text-2xl font-bold text-primary">{avgMood}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
          <p className="text-xs text-muted-foreground mt-1">{moodLabel}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-chart-3" />
            <span className="text-xs text-muted-foreground">Check-ins</span>
          </div>
          <p className="text-2xl font-bold">{moodEntries.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total entries tracked</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-4 h-4 text-chart-2" />
            <span className="text-xs text-muted-foreground">Most Common Mood</span>
          </div>
          <p className="text-2xl font-bold capitalize">{moodDist[0]?.mood || '–'}</p>
          <p className="text-xs text-muted-foreground mt-1">{moodDist[0]?.count || 0} times</p>
        </div>
      </div>

      {/* Mood trend over time */}
      {moodTrend.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4">Mood Trend (8 Weeks)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={moodTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [v, 'Mood Score']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mood distribution */}
      {moodDist.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-4">Mood Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={moodDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="mood" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Correlation: Spending + Tasks vs Mood */}
      {correlationData.length > 1 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold mb-1">Spending & Workload vs. Mood</h3>
          <p className="text-xs text-muted-foreground mb-4">Weekly comparison of how spending and task load relate to your emotional well-being</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={correlationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 5]} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="spending" name="Spending ($)" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Bar yAxisId="left" dataKey="tasks" name="Tasks Created" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Line yAxisId="right" type="monotone" dataKey="mood" name="Mood Score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {moodEntries.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">No data yet</h3>
          <p className="text-sm text-muted-foreground">Complete daily check-ins to see your mood analytics</p>
        </div>
      )}
    </div>
  );
}