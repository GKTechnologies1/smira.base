import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, CalendarDays, Sparkles, Loader2, Mail, UserPlus } from 'lucide-react';
import { format, parseISO, isFuture, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

const categoryColors = {
  family: 'bg-pink-100 text-pink-700',
  anniversary: 'bg-red-100 text-red-700',
  birthday: 'bg-yellow-100 text-yellow-700',
  trip: 'bg-green-100 text-green-700',
  appointment: 'bg-blue-100 text-blue-700',
  celebration: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function Collaboration() {
  const [showEventForm, setShowEventForm] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', category: 'other', participants: '' });
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['shared-events'],
    queryFn: () => base44.entities.SharedEvent.list('date', 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.SharedEvent.create({
      ...data,
      participants: data.participants ? data.participants.split(',').map(e => e.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-events'] });
      setShowEventForm(false);
      setForm({ title: '', description: '', date: '', time: '', category: 'other', participants: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SharedEvent.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-events'] }),
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await base44.users.inviteUser(inviteEmail.trim(), 'user');
    setInviting(false);
    setInviteSuccess(true);
    setInviteEmail('');
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  const generateSuggestion = async (event) => {
    setLoadingSuggestion(event.id);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Smira, a warm AI companion. A family/partner shared event is coming up: "${event.title}" on ${event.date}${event.description ? ', context: ' + event.description : ''}. 
      Generate ONE short, warm, actionable suggestion — either a task to prepare for it OR a future message to write for someone involved. Keep it to 1-2 sentences, personal and specific.`,
    });
    await updateMutation.mutateAsync({ id: event.id, data: { smira_suggestion: typeof result === 'string' ? result.trim() : '' } });
    setLoadingSuggestion(null);
  };

  const upcoming = events.filter(e => e.date && isFuture(parseISO(e.date)));
  const past = events.filter(e => e.date && !isFuture(parseISO(e.date)));

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shared Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan together with the people you love</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowInvite(true)} className="rounded-xl">
            <UserPlus className="w-4 h-4 mr-2" /> Invite
          </Button>
          <Button onClick={() => setShowEventForm(true)} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Add Event
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold mb-2">No shared events yet</h3>
          <p className="text-sm text-muted-foreground">Add family birthdays, anniversaries, or shared trips</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Upcoming</h3>
              <div className="space-y-3">
                {upcoming.map(event => (
                  <EventCard key={event.id} event={event} categoryColors={categoryColors} onSuggest={generateSuggestion} loadingSuggestion={loadingSuggestion} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Past Events</h3>
              <div className="space-y-3 opacity-70">
                {past.slice(0, 5).map(event => (
                  <EventCard key={event.id} event={event} categoryColors={categoryColors} onSuggest={generateSuggestion} loadingSuggestion={loadingSuggestion} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Invite Someone</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Invite a family member or partner to join Smira and share this calendar.</p>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="their@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="rounded-xl bg-secondary border-none"
              type="email"
            />
            {inviteSuccess && <p className="text-sm text-primary font-medium">✓ Invitation sent!</p>}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowInvite(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()} className="rounded-xl">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Event Dialog */}
      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle>Add Shared Event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl bg-secondary border-none" />
            <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl bg-secondary border-none" />
            <div className="grid grid-cols-3 gap-3">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(categoryColors).map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-xl" />
              <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="rounded-xl" />
            </div>
            <Input placeholder="Participants (emails, comma-separated)" value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} className="rounded-xl bg-secondary border-none" />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEventForm(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={() => saveMutation.mutate(form)} className="rounded-xl">Save Event</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventCard({ event, categoryColors, onSuggest, loadingSuggestion }) {
  const daysLeft = event.date ? differenceInDays(parseISO(event.date), new Date()) : null;
  const colorClass = categoryColors[event.category] || 'bg-gray-100 text-gray-700';

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="font-semibold text-sm">{event.title}</p>
        </div>
        <Badge className={cn("text-xs rounded-lg flex-shrink-0 ml-2", colorClass)}>{event.category}</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-muted-foreground">
        <span>{format(parseISO(event.date), 'MMMM d, yyyy')}{event.time ? ` at ${event.time}` : ''}</span>
        {daysLeft !== null && daysLeft >= 0 && <span className="text-primary font-medium">in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>}
        {event.participants?.length > 0 && <span>👥 {event.participants.join(', ')}</span>}
      </div>

      {event.smira_suggestion ? (
        <div className="bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 text-xs text-foreground">
          <span className="text-primary font-semibold">✨ Smira suggests: </span>{event.smira_suggestion}
        </div>
      ) : (
        <button onClick={() => onSuggest(event)} disabled={loadingSuggestion === event.id} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
          {loadingSuggestion === event.id ? <><Loader2 className="w-3 h-3 animate-spin" /> Thinking…</> : <><Sparkles className="w-3 h-3" /> Ask Smira for suggestions</>}
        </button>
      )}
    </div>
  );
}