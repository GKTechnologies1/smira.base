import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Mic, Loader2, ChevronRight, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import VoiceRecorder from '../components/chat/VoiceRecorder';
import GoalCard from '../components/goals/GoalCard';

const categoryColors = {
  health: 'bg-green-100 text-green-700',
  career: 'bg-blue-100 text-blue-700',
  relationships: 'bg-pink-100 text-pink-700',
  finance: 'bg-yellow-100 text-yellow-700',
  learning: 'bg-purple-100 text-purple-700',
  creativity: 'bg-orange-100 text-orange-700',
  mindfulness: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function Goals() {
  const [showForm, setShowForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [updateText, setUpdateText] = useState('');
  const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'other', target_date: '' });
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goal.list('-created_date', 50),
  });

  const { data: updates = [] } = useQuery({
    queryKey: ['goal-updates', selectedGoal?.id],
    queryFn: () => base44.entities.GoalUpdate.filter({ goal_id: selectedGoal.id }, '-created_date', 20),
    enabled: !!selectedGoal,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); setShowForm(false); setForm({ title: '', description: '', category: 'other', target_date: '' }); },
  });

  const handleVoiceTranscript = (text) => setUpdateText(text);

  const handleSubmitUpdate = async () => {
    if (!updateText.trim() || !selectedGoal) return;
    setIsSubmittingUpdate(true);
    const aiResult = await base44.integrations.Core.InvokeLLM({
      prompt: `The user is tracking a goal: "${selectedGoal.title}". They recorded this progress update: "${updateText}". 
      Please provide: 1) A warm 1-2 sentence summary of their progress, 2) Estimate a progress percentage (0-100) based on language cues (words like "almost done", "halfway", "just started" etc). 
      Return JSON with keys: summary (string), progress_delta (number 0-100).`,
      response_json_schema: {
        type: 'object',
        properties: { summary: { type: 'string' }, progress_delta: { type: 'number' } }
      }
    });

    await base44.entities.GoalUpdate.create({
      goal_id: selectedGoal.id,
      goal_title: selectedGoal.title,
      content: updateText.trim(),
      ai_summary: aiResult?.summary || '',
      source: 'voice',
      progress_delta: aiResult?.progress_delta || 0,
    });

    if (aiResult?.progress_delta) {
      await base44.entities.Goal.update(selectedGoal.id, { progress_percent: Math.min(aiResult.progress_delta, 100) });
    }

    queryClient.invalidateQueries({ queryKey: ['goal-updates', selectedGoal.id] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    setUpdateText('');
    setIsSubmittingUpdate(false);
  };

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">Your long-term life objectives</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> New Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">No goals yet</h3>
          <p className="text-sm text-muted-foreground">Define what matters most to you</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {goals.map(goal => (
            <button key={goal.id} onClick={() => setSelectedGoal(goal)} className="text-left">
              <GoalCard goal={goal} categoryColors={categoryColors} />
            </button>
          ))}
        </div>
      )}

      {/* Goal Detail / Update Modal */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          {selectedGoal && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {selectedGoal.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span>{selectedGoal.progress_percent || 0}%</span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${selectedGoal.progress_percent || 0}%` }} />
                  </div>
                </div>

                {/* Voice update */}
                <div className="bg-secondary rounded-2xl p-4">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2"><Mic className="w-4 h-4 text-primary" /> Record a progress update</p>
                  <div className="flex gap-2 items-start">
                    <VoiceRecorder onTranscript={handleVoiceTranscript} disabled={isSubmittingUpdate} />
                    <Textarea
                      value={updateText}
                      onChange={(e) => setUpdateText(e.target.value)}
                      placeholder="Or type your progress update..."
                      className="rounded-xl bg-card border-none resize-none flex-1 min-h-[80px] text-sm"
                    />
                  </div>
                  <Button onClick={handleSubmitUpdate} disabled={!updateText.trim() || isSubmittingUpdate} className="mt-3 w-full rounded-xl">
                    {isSubmittingUpdate ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Smira is analyzing...</> : 'Save Update'}
                  </Button>
                </div>

                {/* Past updates */}
                {updates.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progress History</p>
                    {updates.map(u => (
                      <div key={u.id} className="bg-card border border-border rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">{format(parseISO(u.created_date), 'MMM d, yyyy')}</p>
                        <p className="text-sm">{u.content}</p>
                        {u.ai_summary && (
                          <p className="text-xs text-primary mt-2 bg-primary/5 rounded-lg px-3 py-1.5">✨ {u.ai_summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Goal Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle>Define a New Goal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="What do you want to achieve?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl bg-secondary border-none" />
            <Textarea placeholder="Why does this matter to you?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl bg-secondary border-none resize-none min-h-[80px]" />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(categoryColors).map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={() => saveMutation.mutate(form)} className="rounded-xl">Create Goal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}