import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const CATEGORIES = ['health', 'career', 'relationships', 'finance', 'learning', 'creativity', 'mindfulness', 'other'];

export default function EditGoalSheet({ goal, onSave, onClose, isSaving }) {
  const [form, setForm] = useState({ title: '', description: '', category: 'other', target_date: '', status: 'active' });

  useEffect(() => {
    if (goal) {
      setForm({
        title: goal.title || '',
        description: goal.description || '',
        category: goal.category || 'other',
        target_date: goal.target_date || '',
        status: goal.status || 'active',
      });
    }
  }, [goal]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl border border-border pb-safe"
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
        <h3 className="font-semibold text-base">Edit Goal</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <Input
          placeholder="Goal title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="rounded-xl bg-secondary border-none"
        />
        <Textarea
          placeholder="Why does this matter to you?"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="rounded-xl bg-secondary border-none resize-none min-h-[80px]"
        />
        <div className="grid grid-cols-2 gap-3">
          <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={form.target_date}
            onChange={e => setForm({ ...form, target_date: e.target.value })}
            className="rounded-xl"
          />
        </div>
        <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {['active', 'paused', 'completed', 'abandoned'].map(s => (
              <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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