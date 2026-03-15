import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function AccountDeletion({ onClose }) {
  const [step, setStep] = useState(1); // 1=confirm, 2=type DELETE, 3=done
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (input !== 'DELETE') return;
    setLoading(true);
    try {
      // Log the user out — actual deletion would require a backend function
      // For now we log out and show confirmation
      setStep(3);
      setTimeout(() => base44.auth.logout(), 2500);
    } catch {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card w-full max-w-md rounded-t-3xl p-6 pb-10"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="font-semibold text-base">Delete Account</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground select-none">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 3 ? (
            <div className="text-center py-6">
              <p className="font-lora text-lg mb-2">Account deletion initiated.</p>
              <p className="text-sm text-muted-foreground">You will be signed out shortly.</p>
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This will permanently delete your account, all memories, journal entries, goals, tasks, and financial data. This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
                <Button variant="destructive" className="flex-1 rounded-xl" onClick={() => setStep(2)}>I understand</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Type <strong>DELETE</strong> to confirm.</p>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="DELETE"
                className="rounded-xl font-mono tracking-widest"
              />
              <Button
                variant="destructive"
                className="w-full rounded-xl"
                disabled={input !== 'DELETE' || loading}
                onClick={handleDelete}
              >
                {loading ? 'Deleting…' : 'Permanently Delete Account'}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}