import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO } from 'date-fns';
import { Heart, Plus, Users, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const catColors = {
  family: 'bg-pink-100 text-pink-700', anniversary: 'bg-red-100 text-red-700',
  birthday: 'bg-yellow-100 text-yellow-700', trip: 'bg-blue-100 text-blue-700',
  celebration: 'bg-purple-100 text-purple-700', appointment: 'bg-gray-100 text-gray-700', other: 'bg-secondary text-muted-foreground',
};

export default function FamilyStory() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', date: '', category: 'family', participants: '' });
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['shared-events-family'],
    queryFn: () => base44.entities.SharedEvent.list('-date', 100),
  });

  // Public (non-vault) memories
  const { data: sharedMemories = [] } = useQuery({
    queryKey: ['shared-memories'],
    queryFn: async () => {
      const all = await base44.entities.Memory.list('-date_of_memory', 100);
      return all.filter(m => !m.is_in_vault && m.date_of_memory);
    },
  });

  const createEvent = useMutation({
    mutationFn: (d) => base44.entities.SharedEvent.create({
      ...d,
      participants: d.participants ? d.participants.split(',').map(s => s.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-events-family'] });
      setShowForm(false);
      setForm({ title: '', description: '', date: '', category: 'family', participants: '' });
    },
  });

  // Merge events + public memories into a single chronological story
  const storyItems = [
    ...events.map(e => ({ ...e, _type: 'event' })),
    ...sharedMemories.map(m => ({ ...m, _type: 'memory', date: m.date_of_memory })),
  ].filter(i => i.date).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-semibold">Family Story</h2>
            <p className="text-xs text-muted-foreground">Shared events & memories — your private data stays private</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Event
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : storyItems.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="font-semibold mb-1">No shared events yet</p>
          <p className="text-sm text-muted-foreground">Add events that your family can contribute to</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
          <div className="space-y-5">
            {storyItems.map((item, i) => (
              <div key={item.id} className="flex gap-4 relative">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 border-2",
                  item._type === 'memory' ? 'bg-pink-50 border-pink-200' : 'bg-primary/10 border-primary/30'
                )}>
                  {item._type === 'memory'
                    ? <Heart className="w-4 h-4 text-pink-500" />
                    : <Star className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1 bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <span className="text-xs text-muted-foreground">{format(parseISO(item.date), 'MMMM d, yyyy')}</span>
                      <h4 className="text-sm font-semibold mt-0.5">{item.title}</h4>
                    </div>
                    <Badge className={cn('border-none text-xs rounded-lg flex-shrink-0', catColors[item.category] || catColors.other)}>
                      {item._type === 'memory' ? item.category?.replace('_', ' ') : item.category}
                    </Badge>
                  </div>
                  {(item.description || item.content) && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description || item.content}</p>
                  )}
                  {item._type === 'event' && item.participants?.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">{item.participants.join(', ')}</p>
                    </div>
                  )}
                  {item._type === 'event' && item.smira_suggestion && (
                    <p className="text-xs text-primary mt-2 italic">{item.smira_suggestion}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Event Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Family Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Event title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl bg-secondary border-none" />
            <Textarea placeholder="What happened? (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl bg-secondary border-none resize-none min-h-[70px]" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="rounded-xl" />
              </div>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl mt-5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['family', 'anniversary', 'birthday', 'trip', 'celebration', 'appointment', 'other'].map(c => (
                    <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Participants (emails, comma-separated)" value={form.participants} onChange={e => setForm({ ...form, participants: e.target.value })} className="rounded-xl bg-secondary border-none" />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={() => createEvent.mutate(form)} disabled={!form.title.trim() || !form.date} className="rounded-xl">
                {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Family Story'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}