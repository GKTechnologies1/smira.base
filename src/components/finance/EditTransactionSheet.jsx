import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, X, UtensilsCrossed, Car, Home, Zap, Play, Heart, ShoppingBag, GraduationCap, ArrowUpRight, Briefcase, TrendingUp, Gift, FileText, PiggyBank, Package } from 'lucide-react';
import WaveformPlayer from '../voice/WaveformPlayer';
import VoiceMicButton from '../voice/VoiceMicButton';
import { cn } from '@/lib/utils';

const EXPENSE_CATS = [
  { value: 'food', label: 'Food', icon: UtensilsCrossed },
  { value: 'transport', label: 'Transport', icon: Car },
  { value: 'housing', label: 'Housing', icon: Home },
  { value: 'utilities', label: 'Utilities', icon: Zap },
  { value: 'entertainment', label: 'Fun', icon: Play },
  { value: 'health', label: 'Health', icon: Heart },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { value: 'education', label: 'Learning', icon: GraduationCap },
  { value: 'bills', label: 'Bills', icon: FileText },
  { value: 'savings', label: 'Savings', icon: PiggyBank },
  { value: 'other', label: 'Other', icon: Package },
];

const INCOME_CATS = [
  { value: 'salary', label: 'Salary', icon: ArrowUpRight },
  { value: 'freelance', label: 'Freelance', icon: Briefcase },
  { value: 'investment', label: 'Invest', icon: TrendingUp },
  { value: 'gift', label: 'Gift', icon: Gift },
  { value: 'savings', label: 'Savings', icon: PiggyBank },
  { value: 'other', label: 'Other', icon: Package },
];

export default function EditTransactionSheet({ transaction, onSave, onClose, onDeleteRequest }) {
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (transaction) {
      setForm({ ...transaction, amount: String(transaction.amount || '') });
      setSaved(false);
    }
  }, [transaction]);

  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  const handleTypeToggle = (type) => {
    const newCats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
    const catExists = newCats.find(c => c.value === form.category);
    setForm(f => ({ ...f, type, category: catExists ? f.category : newCats[0].value }));
  };

  const handleSubmit = async () => {
    await onSave(form.id, { ...form, amount: parseFloat(form.amount) });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  };

  return (
    <AnimatePresence>
      {transaction && (
        <>
          <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-w-lg mx-auto flex flex-col max-h-[92vh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-muted" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <h2 className="font-lora font-semibold text-base">Edit transaction</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable form */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
              {/* Amount */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={form.amount || ''}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="rounded-xl bg-secondary border-none h-14 text-xl font-bold pl-8"
                  />
                </div>
              </div>

              {/* Type toggle */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
                <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                  {['expense', 'income'].map(t => (
                    <button key={t} onClick={() => handleTypeToggle(t)}
                      className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                        form.type === t
                          ? t === 'income' ? 'bg-teal text-white shadow' : 'bg-destructive text-white shadow'
                          : 'text-muted-foreground'
                      )}>
                      {t === 'expense' ? 'Expense' : 'Income'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category chips */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" ref={scrollRef}>
                  {cats.map(c => {
                    const CIcon = c.icon;
                    const isActive = form.category === c.value;
                    return (
                      <motion.button
                        key={c.value}
                        onClick={() => setForm(f => ({ ...f, category: c.value }))}
                        animate={isActive ? { scale: 1 } : { scale: 1 }}
                        className={cn(
                          "flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium flex-shrink-0 border transition-all",
                          isActive
                            ? "bg-primary/10 border-primary/40 text-primary"
                            : "bg-secondary border-transparent text-muted-foreground"
                        )}
                        style={{ minWidth: 64 }}
                      >
                        <CIcon className="w-4 h-4" />
                        {c.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Description</label>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Input
                      value={form.description || ''}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="rounded-xl bg-secondary border-none h-11 pr-8"
                      placeholder="What was it for?"
                    />
                    {form.description && (
                      <button onClick={() => setForm(f => ({ ...f, description: '' }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <VoiceMicButton onResult={t => setForm(f => ({ ...f, description: t }))} size="sm" />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Date</label>
                <Input
                  type="date"
                  value={form.date || ''}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="rounded-xl bg-secondary border-none h-11"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Notes <span className="text-muted-foreground/50">(optional)</span></label>
                <textarea
                  value={form.note || ''}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full rounded-xl bg-secondary border-none px-3 py-2.5 text-sm resize-none min-h-[64px] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Any extra context..."
                />
              </div>

              {/* Voice */}
              {form.voice_url && (
                <div className="border border-border rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-2">Voice note</p>
                  <WaveformPlayer audioUrl={form.voice_url} transcript={form.voice_transcript} />
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="px-5 pb-6 pt-3 border-t border-border space-y-2 flex-shrink-0">
              <Button onClick={handleSubmit} className="w-full rounded-2xl text-sm font-medium" style={{ height: 50, background: '#1D9E75' }}>
                {saved ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Saved
                  </motion.span>
                ) : 'Save changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { onClose(); onDeleteRequest?.(transaction); }}
                className="w-full rounded-2xl text-sm border-red-200 text-red-600 hover:bg-red-50"
                style={{ height: 44 }}
              >
                Delete transaction
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}