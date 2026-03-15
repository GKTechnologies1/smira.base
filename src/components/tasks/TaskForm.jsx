import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VoiceMicButton from '../voice/VoiceMicButton';
import WaveformPlayer from '../voice/WaveformPlayer';

export default function TaskForm({ task, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    category: task?.category || 'personal',
    due_date: task?.due_date || '',
    due_time: task?.due_time || '',
    status: task?.status || 'pending',
    voice_transcript: task?.voice_transcript || '',
    voice_url: task?.voice_url || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="What needs to be done?"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="rounded-xl bg-secondary border-none h-12 text-base flex-1"
          required
        />
        <VoiceMicButton onResult={(tx, url) => setForm(f => ({ ...f, title: f.title || tx, voice_transcript: tx, voice_url: url }))} size="sm" />
      </div>
      {form.voice_url && <WaveformPlayer audioUrl={form.voice_url} transcript={form.voice_transcript} />}
      <Textarea
        placeholder="Details (optional)"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="rounded-xl bg-secondary border-none min-h-[80px] resize-none"
      />
      <div className="grid grid-cols-2 gap-3">
        <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {['work','personal','health','family','errands','finance','social','learning','other'].map(c => (
              <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          className="rounded-xl"
          placeholder="Due date"
        />
        <Input
          type="time"
          value={form.due_time}
          onChange={(e) => setForm({ ...form, due_time: e.target.value })}
          className="rounded-xl"
          placeholder="Due time"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
        <Button type="submit" className="rounded-xl">{task ? 'Update' : 'Add Task'}</Button>
      </div>
    </form>
  );
}