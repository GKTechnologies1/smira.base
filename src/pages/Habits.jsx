import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Flame, Loader2, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { format, subDays, differenceInDays, parseISO } from 'date-fns';
import HabitStreakCalendar from '../components/habits/HabitStreakCalendar';

const CATEGORIES = ['health', 'mindfulness', 'learning', 'fitness', 'social', 'work', 'other'];

function calcStreak(logs) {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = format(subDays(today, i), 'yyyy-MM-dd');
    if (logs.some(l => l.date === dateStr && l.completed)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function Habits() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'health' });
  const [nudge, setNudge] = useState('');
  const [loadingNudge, setLoadingNudge] = useState(false);
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: habits = [], isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: () => base44.entities.Habit.filter({ is_active: true }, '-created_date', 50),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['habit-logs'],
    queryFn: () => base44.entities.HabitLog.list('-date', 500),
    enabled: habits.length > 0,
  });

  const createHabit = useMutation({
    mutationFn: (d) => base44.entities.Habit.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['habits'] }); setShowForm(false); setForm({ title: '', description: '', category: 'health' }); },
  });

  const toggleLog = useMutation({
    mutationFn: async ({ habit, done }) => {
      const existing = logs.find(l => l.habit_id === habit.id && l.date === today);
      if (done && !existing) {
        return base44.entities.HabitLog.create({ habit_id: habit.id, habit_title: habit.title, date: today, completed: true });
      } else if (!done && existing) {
        return base44.entities.HabitLog.delete(existing.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habit-logs'] }),
  });

  const getSmiraNudge = async () => {
    setLoadingNudge(true);
    const missedHabits = habits.filter(h => {
      const streak = calcStreak(logs.filter(l => l.habit_id === h.id));
      return streak === 0;
    });
    if (missedHabits.length === 0) {
      setNudge("🎉 You've completed all your habits today! Smira is proud of you.");
      setLoadingNudge(false);
      return;
    }
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Smira, a warm life companion. The user has missed these daily habits today: ${missedHabits.map(h => h.title).join(', ')}. Write a short, warm, encouraging nudge (2 sentences max) to gently motivate them to still do it today. Be specific to their habits.`,
    });
    setNudge(result);
    setLoadingNudge(false);
  };

  const habitsDoneToday = habits.filter(h => logs.some(l => l.habit_id === h.id && l.date === today && l.completed));

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Daily Habits</h1>
          <p className="text-sm text-muted-foreground mt-1">{habitsDoneToday.length}/{habits.length} completed today</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={getSmiraNudge} disabled={loadingNudge} className="rounded-xl gap-2">
            {loadingNudge ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Ask Smira
          </Button>
          <Button onClick={() => setShowForm(true)} className="rounded-xl"><Plus className="w-4 h-4 mr-2" /> New Habit</Button>
        </div>
      </div>

      {/* Smira nudge */}
      {nudge && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-6 flex gap-3">
          <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm">{nudge}</p>
        </div>
      )}

      {/* Today summary banner */}
      {habits.length > 0 && (
        <div className="flex items-center gap-3 bg-secondary rounded-2xl p-4 mb-6">
          <Flame className="w-5 h-5 text-orange-500" />
          <div className="flex-1">
            <div className="h-2 bg-card rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${habits.length ? (habitsDoneToday.length / habits.length) * 100 : 0}%` }} />
            </div>
          </div>
          <span className="text-sm font-medium">{habits.length ? Math.round((habitsDoneToday.length / habits.length) * 100) : 0}%</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : habits.length === 0 ? (
        <div className="text-center py-20">
          <Flame className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">No habits tracked yet</p>
          <p className="text-sm text-muted-foreground">Define daily habits and build your streaks</p>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map(habit => {
            const habitLogs = logs.filter(l => l.habit_id === habit.id);
            const streak = calcStreak(habitLogs);
            const doneToday = habitLogs.some(l => l.date === today && l.completed);
            return (
              <div key={habit.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleLog.mutate({ habit, done: !doneToday })} className="transition-transform hover:scale-110">
                      {doneToday ? <CheckCircle2 className="w-7 h-7 text-primary" /> : <Circle className="w-7 h-7 text-muted-foreground" />}
                    </button>
                    <div>
                      <p className="font-semibold">{habit.title}</p>
                      {habit.description && <p className="text-xs text-muted-foreground">{habit.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {streak > 0 && (
                      <Badge className="bg-orange-100 text-orange-700 border-none gap-1 rounded-lg">
                        <Flame className="w-3 h-3" /> {streak}d
                      </Badge>
                    )}
                    <Badge variant="outline" className="rounded-lg text-xs">{habit.category}</Badge>
                  </div>
                </div>
                <HabitStreakCalendar logs={habitLogs} />
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>New Daily Habit</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Habit name (e.g. Morning meditation)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl bg-secondary border-none" />
            <Input placeholder="Why does this matter? (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl bg-secondary border-none" />
            <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={() => createHabit.mutate(form)} disabled={!form.title.trim()} className="rounded-xl">Create Habit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}