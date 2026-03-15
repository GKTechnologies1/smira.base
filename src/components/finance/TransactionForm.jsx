import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VoiceMicButton from '../voice/VoiceMicButton';
import WaveformPlayer from '../voice/WaveformPlayer';

const categories = {
  expense: ['food','transport','housing','utilities','entertainment','health','shopping','education','bills','other'],
  income: ['salary','freelance','investment','gift','other'],
};

export default function TransactionForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    note: '',
    voice_transcript: '',
    voice_url: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Tabs value={form.type} onValueChange={(v) => setForm({ ...form, type: v, category: 'other' })}>
        <TabsList className="w-full rounded-xl">
          <TabsTrigger value="expense" className="flex-1 rounded-lg">Expense</TabsTrigger>
          <TabsTrigger value="income" className="flex-1 rounded-lg">Income</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2">
        <Input
          placeholder="What was it for?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="rounded-xl bg-secondary border-none h-12 flex-1"
          required
        />
        <VoiceMicButton onResult={(tx, url) => setForm(f => ({ ...f, description: f.description || tx, voice_transcript: tx, voice_url: url }))} size="sm" />
      </div>
      {form.voice_url && <WaveformPlayer audioUrl={form.voice_url} transcript={form.voice_transcript} />}
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="rounded-xl bg-secondary border-none h-12 text-lg font-semibold"
          required
        />
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
          <SelectContent>
            {categories[form.type].map(c => (
              <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Input
        type="date"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        className="rounded-xl"
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
        <Button type="submit" className="rounded-xl">Log {form.type === 'income' ? 'Income' : 'Expense'}</Button>
      </div>
    </form>
  );
}