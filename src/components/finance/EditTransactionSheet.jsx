import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import VoiceMicButton from '../voice/VoiceMicButton';
import WaveformPlayer from '../voice/WaveformPlayer';

const categories = {
  expense: ['food','transport','housing','utilities','entertainment','health','shopping','education','bills','savings','other'],
  income: ['salary','freelance','investment','gift','savings','other'],
};

const categoryLabels = {
  food: '🍔 Food', transport: '🚗 Transport', housing: '🏠 Housing', utilities: '💡 Utilities',
  entertainment: '🎬 Entertainment', health: '❤️ Health', shopping: '🛍 Shopping',
  education: '📚 Education', salary: '💼 Salary', freelance: '💻 Freelance',
  investment: '📈 Investment', gift: '🎁 Gift', bills: '📄 Bills', savings: '🏦 Savings', other: '📦 Other'
};

export default function EditTransactionSheet({ transaction, onSave, onClose }) {
  const [form, setForm] = useState({ ...transaction });
  const [saved, setSaved] = useState(false);
  const [smiraSuggestion, setSmiraSuggestion] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  useEffect(() => {
    if (transaction) setForm({ ...transaction, amount: String(transaction.amount) });
  }, [transaction]);

  const handleCategoryChange = async (val) => {
    setForm(f => ({ ...f, category: val }));
    if (!form.description) return;
    setLoadingSuggestion(true);
    setSmiraSuggestion(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `For the transaction described as "${form.description}" with amount $${form.amount}, what single category fits best from this list: food, transport, housing, utilities, entertainment, health, shopping, education, salary, freelance, investment, gift, bills, savings, other? Reply with only the category word.`,
        response_json_schema: { type: 'object', properties: { category: { type: 'string' } } }
      });
      if (res?.category) setSmiraSuggestion(res.category);
    } catch (_) {}
    setLoadingSuggestion(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form.id, { ...form, amount: parseFloat(form.amount) });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  };

  return (
    <AnimatePresence>
      {transaction && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 shadow-2xl max-w-lg mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">Edit Transaction</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="rounded-xl bg-secondary border-none h-12 text-lg font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={form.date || ''}
                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                    className="rounded-xl bg-secondary border-none h-12"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <Select value={form.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="rounded-xl h-11 bg-secondary border-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories[form.type || 'expense'].map(c => (
                      <SelectItem key={c} value={c}>{categoryLabels[c] || c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <AnimatePresence>
                  {(smiraSuggestion || loadingSuggestion) && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2"
                    >
                      {loadingSuggestion ? (
                        <span className="text-xs text-muted-foreground">Smira is thinking...</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, category: smiraSuggestion }))}
                          className="text-xs bg-primary/10 text-primary rounded-full px-3 py-1 hover:bg-primary/20 transition-colors"
                        >
                          Smira thinks this is: {categoryLabels[smiraSuggestion] || smiraSuggestion}
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={form.description || ''}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    className="rounded-xl bg-secondary border-none h-11 flex-1"
                    placeholder="What was it for?"
                  />
                  <VoiceMicButton onResult={(tx) => setForm(f => ({ ...f, description: tx }))} size="sm" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <Input
                  value={form.note || ''}
                  onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))}
                  className="rounded-xl bg-secondary border-none h-11"
                  placeholder="Any extra details"
                />
              </div>

              {form.voice_url && (
                <WaveformPlayer audioUrl={form.voice_url} transcript={form.voice_transcript} />
              )}

              <Button
                type="submit"
                className="w-full rounded-xl h-12 text-sm font-medium relative overflow-hidden"
              >
                {saved ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 text-green-100"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Saved!
                  </motion.span>
                ) : 'Save changes'}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}