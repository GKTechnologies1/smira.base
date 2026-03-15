import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import VoiceMicButton from '../voice/VoiceMicButton';
import WaveformPlayer from '../voice/WaveformPlayer';
import { cn } from '@/lib/utils';

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
    voice_transcript: entry?.voice_transcript || '',
    voice_url: entry?.voice_url || '',
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
        className="rounded-2xl font-lora text-base font-medium border-none bg-secondary px-4 py-3 h-auto"
      />
      <div className="relative">
        <Textarea
          placeholder="What's on your mind today?"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="rounded-2xl min-h-[200px] border-none bg-secondary px-4 py-3 resize-none pr-12"
          required
        />
        <div className="absolute bottom-3 right-3">
          <VoiceMicButton onResult={(tx, url) => setForm(f => ({ ...f, content: f.content ? f.content + '\n' + tx : tx, voice_transcript: tx, voice_url: url }))} size="sm" />
        </div>
      </div>
      {form.voice_url && <WaveformPlayer audioUrl={form.voice_url} transcript={form.voice_transcript} />}

      {/* Mood chips */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-medium">How are you feeling?</p>
        <div className="flex flex-wrap gap-2">
          {moods.map(m => {
            const isSelected = form.mood === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm({ ...form, mood: m.value })}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                  isSelected
                    ? "bg-teal text-white shadow-sm"
                    : "bg-secondary text-muted-foreground opacity-70 hover:opacity-100"
                )}
                style={{
                  paddingLeft: isSelected ? '14px' : '12px',
                  paddingRight: isSelected ? '14px' : '12px',
                }}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
        <SelectTrigger className="w-48 rounded-2xl">
          <SelectValue placeholder="Entry type" />
        </SelectTrigger>
        <SelectContent>
          {types.map(t => (
            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-2">
        {form.tags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-sm">
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
          className="w-28 rounded-full h-8 text-sm"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-3xl">Cancel</Button>
        <Button type="submit" className="rounded-3xl">{entry ? 'Update' : 'Save Entry'}</Button>
      </div>
    </form>
  );
}