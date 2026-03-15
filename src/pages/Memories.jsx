import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Heart, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const categoryLabels = {
  life_lesson: 'Life Lesson', family_story: 'Family Story', milestone: 'Milestone',
  travel: 'Travel', achievement: 'Achievement', relationship: 'Relationship',
  wisdom: 'Wisdom', funny_moment: 'Funny Moment', tradition: 'Tradition', other: 'Other'
};

export default function Memories() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'other', date_of_memory: '', is_in_vault: false });
  const queryClient = useQueryClient();

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: () => base44.entities.Memory.list('-created_date', 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Memory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setShowForm(false);
      setForm({ title: '', content: '', category: 'other', date_of_memory: '', is_in_vault: false });
    },
  });

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Memories</h1>
          <p className="text-sm text-muted-foreground mt-1">Preserve what matters most</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Save Memory
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-chart-5/10 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-chart-5" />
          </div>
          <h3 className="font-semibold mb-2">No memories saved yet</h3>
          <p className="text-sm text-muted-foreground">Capture stories, lessons, and moments worth remembering</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {memories.map(memory => (
            <div key={memory.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-sm">{memory.title}</h3>
                {memory.is_in_vault && <Shield className="w-4 h-4 text-primary flex-shrink-0" />}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{memory.content}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs rounded-lg">
                  {categoryLabels[memory.category] || memory.category}
                </Badge>
                {memory.date_of_memory && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(memory.date_of_memory), 'MMM d, yyyy')}
                  </span>
                )}
                {memory.people_involved?.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    with {memory.people_involved.join(', ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Save a Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Give this memory a title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-xl bg-secondary border-none h-12"
            />
            <Textarea
              placeholder="Tell the story..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="rounded-xl bg-secondary border-none min-h-[120px] resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={form.date_of_memory}
                onChange={(e) => setForm({ ...form, date_of_memory: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_in_vault}
                onChange={(e) => setForm({ ...form, is_in_vault: e.target.checked })}
                className="rounded"
              />
              <Shield className="w-4 h-4 text-primary" />
              Save to Legacy Vault
            </label>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={() => saveMutation.mutate(form)} className="rounded-xl">Save Memory</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}