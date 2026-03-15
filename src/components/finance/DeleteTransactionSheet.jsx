import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { X } from 'lucide-react';

const categoryLabels = {
  food: '🍔 Food', transport: '🚗 Transport', housing: '🏠 Housing', utilities: '💡 Utilities',
  entertainment: '🎬 Entertainment', health: '❤️ Health', shopping: '🛍 Shopping',
  education: '📚 Education', salary: '💼 Salary', freelance: '💻 Freelance',
  investment: '📈 Investment', gift: '🎁 Gift', bills: '📄 Bills', savings: '🏦 Savings', other: '📦 Other'
};

export default function DeleteTransactionSheet({ transaction, onConfirm, onCancel }) {
  if (!transaction) return null;
  const isIncome = transaction.type === 'income';

  return (
    <AnimatePresence>
      {transaction && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 shadow-2xl max-w-lg mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 35 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Remove this transaction?</h2>
              <button onClick={onCancel} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="bg-secondary rounded-2xl p-4 mb-6">
              <p className="font-medium text-sm">{transaction.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {categoryLabels[transaction.category] || transaction.category}
                  {' · '}
                  {transaction.date ? format(new Date(transaction.date), 'MMM d, yyyy') : ''}
                </span>
                <span className={`font-semibold text-sm ${isIncome ? 'text-primary' : 'text-foreground'}`}>
                  {isIncome ? '+' : '-'}${transaction.amount?.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12"
                onClick={onCancel}
              >
                Keep it
              </Button>
              <Button
                className="flex-1 rounded-xl h-12 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => onConfirm(transaction.id)}
              >
                Yes, remove it
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}