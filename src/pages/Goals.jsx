import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Loader2, Sparkles, ChevronRight, TrendingUp, CheckCircle2, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import MilestonePath from '../components/goals/MilestonePath';

const CATEGORIES = ['health', 'career', 'relationships', 'finance', 'learning', 'creativity', 'mindfulness', 'other'];
const catColors = {
  health: 'bg-green-100 text-green-700', career: 'bg-blue-100 text-blue-700',
  relationships: 'bg-pink-100 text-pink-700', finance: 'bg-yellow-100 text-yellow-700',
  learning: 'bg-purple-100 text-purple-700', creativity: 'bg-orange-100 text-orange-700',
  mindfulness: 'bg-teal-100 text-teal-700', other: 'bg-gray-100 text-gray-700',
};

export default function Goals() {
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', description: '', category: 'other', target_date: '' });
  const [msForm, setMsForm] = useState({ title: '', description: '', target_date: '', linked_finance_amount: '' });
  const [smiraSuggestion, setSmiraSuggestion] = useState('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goal.list('-created_date', 50),
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', selectedGoal?.id],
    queryFn: () => base44.entities.Milestone.filter({ goal_id: selectedGoal.id }, 'order', 50),
    enabled: !!selectedGoal,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-for-goals'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
    enabled: !!selectedGoal,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-for-goals'],
    queryFn: () => base44.entities.FinancialTransaction.filter({ type: 'income' }, '-date', 50),
    enabled: !!selectedGoal?.id && selectedGoal?.category === 'finance',
  });

  const createGoal = useMutation({
    mutationFn: (d) => base44.entities.Goal.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); setShowGoalForm(false); setGoalForm({ title: '', description: '', category: 'other', target_date: '' }); },
  });

  const createMilestone = useMutation({
    mutationFn: (d) => base44.entities.Milestone.create({ ...d, goal_id: selectedGoal.id, goal_title: selectedGoal.title, order: milestones.length }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['milestones', selectedGoal.id] }); setShowMilestoneForm(false); setMsForm({ title: '', description: '', target_date: '', linked_finance_amount: '' }); },
  });

  const toggleMilestone = useMutation({
    mutationFn: async (m) => {
      const nextStatus = m.status === 'completed' ? 'pending' : m.status === 'in_progress' ? 'completed' : 'in_progress';
      await base44.entities.Milestone.update(m.id, { status: nextStatus });
      // Update goal progress
      const allMs = milestones.map(x => x.id === m.id ? { ...x, status: nextStatus } : x);
      const pct = Math.round((allMs.filter(x => x.status === 'completed').length / allMs.length) * 100);
      await base44.entities.Goal.update(selectedGoal.id, { progress_percent: pct });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', selectedGoal.id] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const getSmiraSuggestion = async () => {
    if (!selectedGoal) return;
    setLoadingSuggestion(true);
    setSmiraSuggestion('');
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Smira. The user has a goal: "${selectedGoal.title}" (category: ${selectedGoal.category}, progress: ${selectedGoal.progress_percent || 0}%).
Milestones: ${milestones.map(m => `${m.title} [${m.status}]`).join(', ') || 'none yet'}.
They have ${completedTasks} completed tasks overall.
Give 2-3 specific, actionable suggestions to accelerate progress on this goal. Mention tasks they could create or financial steps if it's a finance goal. Keep it warm and encouraging. 3 sentences max.`,
    });
    setSmiraSuggestion(result);
    setLoadingSuggestion(false);
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalSavings = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Goals & Milestones</h1>
          <p className="text-sm text-muted-foreground mt-1">Break big dreams into actionable paths</p>
        </div>
        <Button onClick={() => setShowGoalForm(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> New Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20">
          <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="font-semibold mb-2">No goals yet</h3>
          <p className="text-sm text-muted-foreground">Define what matters most to you</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const pct = goal.progress_percent || 0;
            return (
              <button key={goal.id} onClick={() => setSelectedGoal(goal)} className="text-left">
                <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold mb-1">{goal.title}</h3>
                      <Badge className={`${catColors[goal.category] || catColors.other} border-none text-xs rounded-lg`}>{goal.category}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{pct}%</p>
                      <p className="text-xs text-muted-foreground">complete</p>
                    </div>
                  </div>
                  {goal.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{goal.description}</p>}
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  {goal.target_date && (
                    <p className="text-xs text-muted-foreground mt-2">Target: {format(parseISO(goal.target_date), 'MMM d, yyyy')}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Goal detail modal */}
      <Dialog open={!!selectedGoal} onOpenChange={() => { setSelectedGoal(null); setSmiraSuggestion(''); }}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedGoal && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" /> {selectedGoal.title}
                </DialogTitle>
              </DialogHeader>

              {/* Progress */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${selectedGoal.progress_percent || 0}%` }} />
                </div>
                <span className="text-sm font-medium">{selectedGoal.progress_percent || 0}%</span>
              </div>

              {/* Linked data stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-secondary rounded-xl p-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tasks Done</p>
                    <p className="font-semibold text-sm">{completedTasks}</p>
                  </div>
                </div>
                {selectedGoal.category === 'finance' && (
                  <div className="bg-secondary rounded-xl p-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Income Logged</p>
                      <p className="font-semibold text-sm">${totalSavings.toFixed(0)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Milestone path */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Milestone Path</p>
                  <Button size="sm" variant="outline" onClick={() => setShowMilestoneForm(true)} className="rounded-lg h-7 text-xs">
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                {milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No milestones yet. Add steps to track your path!</p>
                ) : (
                  <MilestonePath milestones={milestones} onToggle={(m) => toggleMilestone.mutate(m)} goalId={selectedGoal.id} tasks={tasks} transactions={transactions} />
                )}
              </div>

              {/* Smira suggestion */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium">Smira's Suggestions</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={getSmiraSuggestion} disabled={loadingSuggestion} className="h-7 rounded-lg text-xs">
                    {loadingSuggestion ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingUp className="w-3 h-3" />}
                    Analyze
                  </Button>
                </div>
                {smiraSuggestion ? (
                  <p className="text-sm">{smiraSuggestion}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Click Analyze to get personalized suggestions based on your tasks & finances.</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Milestone form */}
      <Dialog open={showMilestoneForm} onOpenChange={setShowMilestoneForm}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle>Add Milestone</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Milestone title" value={msForm.title} onChange={e => setMsForm({ ...msForm, title: e.target.value })} className="rounded-xl bg-secondary border-none" />
            <Input placeholder="Description (optional)" value={msForm.description} onChange={e => setMsForm({ ...msForm, description: e.target.value })} className="rounded-xl bg-secondary border-none" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Target Date</label>
                <Input type="date" value={msForm.target_date} onChange={e => setMsForm({ ...msForm, target_date: e.target.value })} className="rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">$ Target (optional)</label>
                <Input type="number" placeholder="0" value={msForm.linked_finance_amount} onChange={e => setMsForm({ ...msForm, linked_finance_amount: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowMilestoneForm(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={() => createMilestone.mutate(msForm)} disabled={!msForm.title.trim()} className="rounded-xl">Add Milestone</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Goal form */}
      <Dialog open={showGoalForm} onOpenChange={setShowGoalForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle>Define a New Goal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="What do you want to achieve?" value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} className="rounded-xl bg-secondary border-none" />
            <Textarea placeholder="Why does this matter to you?" value={goalForm.description} onChange={e => setGoalForm({ ...goalForm, description: e.target.value })} className="rounded-xl bg-secondary border-none resize-none min-h-[80px]" />
            <div className="grid grid-cols-2 gap-3">
              <Select value={goalForm.category} onValueChange={v => setGoalForm({ ...goalForm, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="date" value={goalForm.target_date} onChange={e => setGoalForm({ ...goalForm, target_date: e.target.value })} className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowGoalForm(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={() => createGoal.mutate(goalForm)} disabled={!goalForm.title.trim()} className="rounded-xl">Create Goal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}