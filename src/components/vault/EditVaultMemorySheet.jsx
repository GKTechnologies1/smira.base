import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const CATEGORIES = ['milestone','family_story','achievement','travel','relationship','wisdom','life_lesson','tradition','funny_moment','other'];

export default function EditVaultMemorySheet({ memory, onSave, onClose, isSaving }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'milestone', date_of_memory: '' });

  useEffect(() => {
    if (memory) {
      setForm({
        title: memory.title || '',
        content: memory.content || '',
        category: memory.category || 'milestone',
        date_of_memory: memory.date_of_memory || '',
      });
    }
  }, [memory]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl border border-border pb-safe"
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
        <h3 className="font-semibold text-base">Edit Memory</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <Input
          placeholder="Memory title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="rounded-xl bg-secondary border-none"
        />
        <Textarea
          placeholder="Tell the story…"
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
          className="rounded-xl bg-secondary border-none min-h-[100px] resize-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={form.date_of_memory}
            onChange={e => setForm({ ...form, date_of_memory: e.target.value })}
            className="rounded-xl"
          />
        </div>
        <Button
          className="w-full rounded-xl"
          onClick={() => onSave(form)}
          disabled={!form.title.trim() || isSaving}
        >
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </motion.div>
  );
}