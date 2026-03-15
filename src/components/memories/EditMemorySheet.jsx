import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import VoiceMicButton from '../voice/VoiceMicButton';
import WaveformPlayer from '../voice/WaveformPlayer';
import PeopleTagger from './PeopleTagger';
import LocationPicker from './LocationPicker';
import { MapPin } from 'lucide-react';

const TONES = [
  { value: 'joyful', label: 'Joyful', emoji: '😊' },
  { value: 'bittersweet', label: 'Bittersweet', emoji: '🥹' },
  { value: 'proud', label: 'Proud', emoji: '🌟' },
  { value: 'peaceful', label: 'Peaceful', emoji: '🕊️' },
  { value: 'meaningful', label: 'Meaningful', emoji: '💎' },
];

const VISIBILITY = [
  { value: 'private', label: 'Private' },
  { value: 'family', label: 'Family' },
  { value: 'legacy', label: 'Legacy Vault' },
];

const SUGGESTED_TAGS = ['Family', 'Travel', 'Milestone', 'Lesson', 'Personal', 'Childhood', 'Work', 'Love', 'Growth', 'Adventure'];

export default function EditMemorySheet({ memory, onSave, onClose, isSaving }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    date_of_memory: '',
    tags: [],
    emotional_tone: 'joyful',
    visibility: 'private',
    is_in_vault: false,
    media_urls: [],
    people_involved: [],
    lat: null,
    lng: null,
    location_name: '',
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [rerecording, setRerecording] = useState(false);
  const [newTranscript, setNewTranscript] = useState('');
  const [askUpdate, setAskUpdate] = useState(false);

  useEffect(() => {
    if (memory) {
      setForm({
        title: memory.title || '',
        content: memory.content || '',
        date_of_memory: memory.date_of_memory || '',
        tags: memory.tags || [],
        emotional_tone: memory.emotional_tone || 'joyful',
        visibility: memory.is_in_vault ? 'legacy' : 'private',
        is_in_vault: memory.is_in_vault || false,
        media_urls: memory.media_urls || [],
        people_involved: memory.people_involved || [],
        lat: memory.lat || null,
        lng: memory.lng || null,
        location_name: memory.location_name || '',
      });
    }
  }, [memory]);

  const addTag = (tag) => {
    const t = tag.trim();
    if (t && !form.tags.includes(t)) setForm(f => ({ ...f, tags: [...f.tags, t] }));
    setTagInput('');
  };

  const removeTag = (tag) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));

  const handleSave = async () => {
    const data = {
      ...form,
      is_in_vault: form.visibility === 'legacy',
    };
    await onSave(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleRerecordResult = (transcript, audioUrl) => {
    setNewTranscript(transcript);
    if (form.content.trim()) {
      setAskUpdate(true);
    } else {
      setForm(f => ({ ...f, content: transcript, media_urls: audioUrl ? [audioUrl] : f.media_urls }));
      setRerecording(false);
    }
  };

  const audioUrl = form.media_urls?.[0];

  return (
    <>
      <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col"
    >
      {/* Handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-muted" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h2 className="font-semibold font-lora text-base">Edit memory</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
        <Input
          placeholder="Memory title"
          value={form.title}
          onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
          className="rounded-xl bg-secondary border-none h-11"
        />

        <Textarea
          placeholder="Tell the full story..."
          value={form.content}
          onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
          className="rounded-xl bg-secondary border-none min-h-[110px] resize-none text-sm"
        />

        <Input
          type="date"
          value={form.date_of_memory}
          onChange={(e) => setForm(f => ({ ...f, date_of_memory: e.target.value }))}
          className="rounded-xl bg-secondary border-none"
        />

        {/* Emotional tone */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">How does this memory feel?</p>
          <div className="flex flex-wrap gap-2">
            {TONES.map(t => (
              <button key={t.value}
                onClick={() => setForm(f => ({ ...f, emotional_tone: t.value }))}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all",
                  form.emotional_tone === t.value
                    ? "bg-primary/10 border-primary text-primary font-medium"
                    : "bg-secondary border-transparent text-muted-foreground"
                )}
              >
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Who can see this?</p>
          <div className="flex gap-2">
            {VISIBILITY.map(v => (
              <button key={v.value}
                onClick={() => setForm(f => ({ ...f, visibility: v.value }))}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs border transition-all font-medium",
                  form.visibility === v.value
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-secondary border-transparent text-muted-foreground"
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:opacity-70">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); addTag(tagInput); } }}
              className="rounded-xl bg-secondary border-none text-sm h-9 flex-1"
            />
            <Button size="sm" variant="outline" onClick={() => addTag(tagInput)} className="rounded-xl px-3">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {SUGGESTED_TAGS.filter(t => !form.tags.includes(t)).map(t => (
              <button key={t} onClick={() => addTag(t)}
                className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                + {t}
              </button>
            ))}
          </div>
        </div>

        {/* People tagger */}
        <PeopleTagger
          value={form.people_involved}
          onChange={(v) => setForm(f => ({ ...f, people_involved: v }))}
          description={form.content}
        />

        {/* Location */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Location</p>
          <button
            onClick={() => setShowLocationPicker(true)}
            className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl bg-secondary text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MapPin className="w-4 h-4 flex-shrink-0" />
            {form.location_name || 'Add a location'}
            {form.lat && <span className="ml-auto text-xs text-primary">📍 Set</span>}
          </button>
        </div>

        {/* Voice section */}
        <div className="border border-border rounded-xl p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Voice recording</p>
          {audioUrl && !rerecording && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <WaveformPlayer audioUrl={audioUrl} />
              </div>
              <Button size="sm" variant="outline" onClick={() => setRerecording(true)} className="rounded-xl text-xs px-3 shrink-0">
                Re-record
              </Button>
            </div>
          )}
          {(rerecording || !audioUrl) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex-1">
                {rerecording ? 'Record a new version:' : 'Add a voice note:'}
              </span>
              <VoiceMicButton onResult={(t) => handleRerecordResult(t, null)} size="sm" />
              {rerecording && (
                <button onClick={() => setRerecording(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              )}
            </div>
          )}
          {askUpdate && (
            <div className="bg-secondary rounded-xl p-3 text-sm space-y-2">
              <p className="text-xs font-medium">Update description from new recording?</p>
              <p className="text-xs text-muted-foreground line-clamp-2 italic">"{newTranscript}"</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 rounded-xl text-xs"
                  onClick={() => { setForm(f => ({ ...f, content: newTranscript })); setAskUpdate(false); setRerecording(false); }}>
                  Yes, update
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 rounded-xl text-xs"
                  onClick={() => { setAskUpdate(false); setRerecording(false); }}>
                  Keep current
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <Button onClick={handleSave} disabled={isSaving || saved} className="w-full rounded-2xl h-12 text-sm font-medium relative">
          {saved ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal" /> Saved
            </motion.div>
          ) : isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : 'Save changes'}
        </Button>
      </div>
      </motion.div>

      {showLocationPicker && (
        <LocationPicker
          lat={form.lat}
          lng={form.lng}
          locationName={form.location_name}
          onChange={({ lat, lng, location_name }) => setForm(f => ({ ...f, lat, lng, location_name }))}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </>
  );
}