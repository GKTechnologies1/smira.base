import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

const moods = [
  { value: 'joyful', label: '😊 Joyful' },
  { value: 'grateful', label: '🙏 Grateful' },
  { value: 'calm', label: '😌 Calm' },
  { value: 'neutral', label: '😐 Neutral' },
  { value: 'stressed', label: '😰 Stressed' },
  { value: 'sad', label: '😢 Sad' },
  { value: 'anxious', label: '😟 Anxious' },
  { value: 'reflective', label: '🤔 Reflective' },
  { value: 'motivated', label: '💪 Motivated' },
  { value: 'tired', label: '😴 Tired' },
];

const types = [
  { value: 'daily_reflection', label: 'Daily Reflection' },
  { value: 'guided_prompt', label: 'Guided Prompt' },
  { value: 'event_reflection', label: 'Event Reflection' },
  { value: 'lesson_learned', label: 'Lesson Learned' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'free_write', label: 'Free Write' },
];

export default function JournalForm({ entry, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: entry?.title || '',
    content: entry?.content || '',
    mood: entry?.mood || '',
    type: entry?.type || 'daily_reflection',
    tags: entry?.tags || [],
  });
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        placeholder="Entry title (optional)"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="rounded-xl text-lg font-medium border-none bg-secondary px-4 py-3 h-auto"
      />
      <Textarea
        placeholder="What's on your mind today?"
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        className="rounded-xl min-h-[200px] border-none bg-secondary px-4 py-3 resize-none"
        required
      />
      <div className="flex flex-wrap gap-3">
        <Select value={form.mood} onValueChange={(v) => setForm({ ...form, mood: v })}>
          <SelectTrigger className="w-44 rounded-xl">
            <SelectValue placeholder="How are you feeling?" />
          </SelectTrigger>
          <SelectContent>
            {moods.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
          <SelectTrigger className="w-44 rounded-xl">
            <SelectValue placeholder="Entry type" />
          </SelectTrigger>
          <SelectContent>
            {types.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2">
        {form.tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-secondary text-sm">
            {tag}
            <button type="button" onClick={() => removeTag(tag)}>
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <Input
          placeholder="Add tag..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
          className="w-32 rounded-xl h-8 text-sm"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
        <Button type="submit" className="rounded-xl">{entry ? 'Update' : 'Save Entry'}</Button>
      </div>
    </form>
  );
}