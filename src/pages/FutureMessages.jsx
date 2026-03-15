import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Mail, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const toneLabels = { loving: 'Loving', encouraging: 'Encouraging', reflective: 'Reflective', celebratory: 'Celebratory', advisory: 'Advisory', nostalgic: 'Nostalgic' };
const relationLabels = { self: 'Myself', child: 'Child', spouse: 'Spouse', parent: 'Parent', sibling: 'Sibling', friend: 'Friend', grandchild: 'Grandchild', other: 'Other' };
const occasionLabels = { birthday: 'Birthday', anniversary: 'Anniversary', graduation: 'Graduation', milestone: 'Milestone', just_because: 'Just Because', in_case: 'In Case', holiday: 'Holiday', other: 'Other' };

export default function FutureMessages() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', content: '', recipient_name: '', recipient_relationship: 'self',
    delivery_date: '', occasion: 'just_because', emotional_tone: 'loving', status: 'draft',
  });
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['future-messages'],
    queryFn: () => base44.entities.FutureMessage.list('-created_date', 50),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.FutureMessage.create({ ...data, status: data.delivery_date ? 'scheduled' : 'draft' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['future-messages'] });
      setShowForm(false);
      setForm({ title: '', content: '', recipient_name: '', recipient_relationship: 'self', delivery_date: '', occasion: 'just_because', emotional_tone: 'loving', status: 'draft' });
    },
  });

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Future Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">Letters to the future</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> New Message
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">No future messages yet</h3>
          <p className="text-sm text-muted-foreground">Write a letter to someone special — or to your future self</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {messages.map(msg => (
            <div key={msg.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{msg.title || `To ${msg.recipient_name}`}</h3>
                <Badge variant="outline" className="text-xs rounded-lg">
                  {msg.status === 'scheduled' ? '📅 Scheduled' : msg.status === 'delivered' ? '✅ Delivered' : '📝 Draft'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{msg.content}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="text-xs rounded-lg bg-primary/10 text-primary">
                  For {msg.recipient_name}
                </Badge>
                <Badge variant="outline" className="text-xs rounded-lg">
                  {occasionLabels[msg.occasion] || msg.occasion}
                </Badge>
                {msg.delivery_date && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(msg.delivery_date), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Write a Future Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Message title (optional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-xl bg-secondary border-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Recipient's name"
                value={form.recipient_name}
                onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                className="rounded-xl bg-secondary border-none"
              />
              <Select value={form.recipient_relationship} onValueChange={(v) => setForm({ ...form, recipient_relationship: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(relationLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="What do you want to say?"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="rounded-xl bg-secondary border-none min-h-[150px] resize-none"
            />
            <div className="grid grid-cols-3 gap-3">
              <Select value={form.occasion} onValueChange={(v) => setForm({ ...form, occasion: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(occasionLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.emotional_tone} onValueChange={(v) => setForm({ ...form, emotional_tone: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(toneLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={form.delivery_date}
                onChange={(e) => setForm({ ...form, delivery_date: e.target.value })}
                className="rounded-xl"
                placeholder="Delivery date"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={() => saveMutation.mutate(form)} className="rounded-xl">Save Message</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}