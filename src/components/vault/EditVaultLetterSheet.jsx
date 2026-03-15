import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function EditVaultLetterSheet({ message, onSave, onClose, isSaving }) {
  const [form, setForm] = useState({ title: '', content: '', recipient_name: '', recipient_relationship: 'child', delivery_date: '', emotional_tone: 'loving' });

  useEffect(() => {
    if (message) {
      setForm({
        title: message.title || '',
        content: message.content || '',
        recipient_name: message.recipient_name || '',
        recipient_relationship: message.recipient_relationship || 'child',
        delivery_date: message.delivery_date || '',
        emotional_tone: message.emotional_tone || 'loving',
      });
    }
  }, [message]);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl border border-border pb-safe"
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
        <h3 className="font-semibold text-base">Edit Letter</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <Input
          placeholder="Letter title (optional)"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="rounded-xl bg-secondary border-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Recipient name"
            value={form.recipient_name}
            onChange={e => setForm({ ...form, recipient_name: e.target.value })}
            className="rounded-xl bg-secondary border-none"
          />
          <Select value={form.recipient_relationship} onValueChange={v => setForm({ ...form, recipient_relationship: v })}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['self','child','spouse','parent','sibling','friend','grandchild','other'].map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder="Write your letter…"
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
          className="rounded-xl bg-secondary border-none min-h-[100px] resize-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Unlock Date</label>
            <Input
              type="date"
              value={form.delivery_date}
              onChange={e => setForm({ ...form, delivery_date: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <Select value={form.emotional_tone} onValueChange={v => setForm({ ...form, emotional_tone: v })}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['loving','encouraging','reflective','celebratory','advisory','nostalgic'].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="w-full rounded-xl"
          onClick={() => onSave(form)}
          disabled={!form.content.trim() || isSaving}
        >
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </motion.div>
  );
}