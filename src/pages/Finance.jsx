import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import TransactionForm from '../components/finance/TransactionForm';
import BudgetOverview from '../components/finance/BudgetOverview';
import SpendingForecast from '../components/finance/SpendingForecast';
import SavingsInsights from '../components/finance/SavingsInsights';
import SwipeableTransactionCard from '../components/finance/SwipeableTransactionCard';
import EditTransactionSheet from '../components/finance/EditTransactionSheet';
import DeleteTransactionSheet from '../components/finance/DeleteTransactionSheet';
import BulkActionBar from '../components/finance/BulkActionBar';
import AnimatedBalance from '../components/finance/AnimatedBalance';

export default function Finance() {
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [removedIds, setRemovedIds] = useState([]); // for collapse animation after delete

  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.FinancialTransaction.list('-created_date', 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.FinancialTransaction.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FinancialTransaction.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialTransaction.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const handleEdit = useCallback((tx) => setEditTarget(tx), []);
  const handleDelete = useCallback((tx) => setDeleteTarget(tx), []);

  const handleSaveEdit = async (id, data) => {
    await updateMutation.mutateAsync({ id, data });
    setEditTarget(null);
  };

  const handleConfirmDelete = (id) => {
    const tx = transactions.find(t => t.id === id);
    setDeleteTarget(null);
    setRemovedIds(prev => [...prev, id]);

    let undone = false;
    const toastId = toast('Entry removed', {
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: () => {
          undone = true;
          setRemovedIds(prev => prev.filter(rid => rid !== id));
          toast.dismiss(toastId);
        },
      },
    });

    setTimeout(() => {
      if (!undone) deleteMutation.mutate(id);
    }, 5200);
  };

  const handleBulkDelete = () => {
    const ids = [...selectedIds];
    ids.forEach((id, i) => {
      setTimeout(() => {
        setRemovedIds(prev => [...prev, id]);
        setTimeout(() => deleteMutation.mutate(id), 400);
      }, i * 60);
    });
    setSelectedIds([]);
    setSelectionMode(false);
  };

  const handleExportSelected = () => {
    const selected = transactions.filter(t => selectedIds.includes(t.id));
    const csv = ['Description,Amount,Type,Category,Date', ...selected.map(t =>
      `"${t.description}",${t.amount},${t.type},${t.category},${t.date || ''}`
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'transactions.csv'; a.click();
    URL.revokeObjectURL(url);
    setSelectedIds([]);
    setSelectionMode(false);
  };

  const handleLongPress = (id) => {
    setSelectionMode(true);
    setSelectedIds([id]);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const visibleTransactions = transactions.filter(t => !removedIds.includes(t.id));

  const totalIncome = visibleTransactions.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const totalExpense = visibleTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto pb-28">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-lora font-medium">Finance</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your income and expenses</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-3xl">
          <Plus className="w-4 h-4 mr-2" /> Add Transaction
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Income</span>
          </div>
          <AnimatedBalance value={totalIncome} className="text-xl font-bold text-primary" />
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-chart-4" />
            <span className="text-xs text-muted-foreground">Expenses</span>
          </div>
          <AnimatedBalance value={totalExpense} className="text-xl font-bold" />
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Balance</span>
          </div>
          <AnimatedBalance value={balance} className={`text-xl font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`} />
        </div>
      </div>

      <BudgetOverview transactions={visibleTransactions} />
      <SpendingForecast transactions={visibleTransactions} />
      <SavingsInsights transactions={visibleTransactions} />

      {/* Transactions */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : visibleTransactions.length === 0 && transactions.length === 0 ? (
        <div className="text-center py-20 fade-up fade-up-1">
          <svg viewBox="0 0 120 100" className="w-32 h-28 mx-auto mb-6 opacity-60" fill="none">
            <rect x="20" y="30" width="80" height="50" rx="10" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>
            <path d="M20 45 L100 45" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>
            <circle cx="72" cy="58" r="7" stroke="#FFB085" strokeWidth="1.5"/>
            <path d="M72 54 L72 58 L75 60" stroke="#FFB085" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M35 58 L52 58" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
          </svg>
          <p className="font-lora text-lg text-foreground/70 mb-4">Nothing here yet.<br/>What did you spend today?</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {transactions.map(t => {
              const isRemoving = removedIds.includes(t.id);
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 1, height: 'auto' }}
                  animate={isRemoving ? { opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' } : { opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                >
                  <SwipeableTransactionCard
                    transaction={t}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    selectionMode={selectionMode}
                    selected={selectedIds.includes(t.id)}
                    onLongPress={handleLongPress}
                    onClick={() => selectionMode && toggleSelect(t.id)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* New Transaction Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSave={(data) => saveMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Sheet */}
      <EditTransactionSheet
        transaction={editTarget}
        onSave={handleSaveEdit}
        onClose={() => setEditTarget(null)}
      />

      {/* Delete Sheet */}
      <DeleteTransactionSheet
        transaction={deleteTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectionMode && (
          <BulkActionBar
            selectedIds={selectedIds}
            onDeleteSelected={handleBulkDelete}
            onExportSelected={handleExportSelected}
            onCancel={() => { setSelectionMode(false); setSelectedIds([]); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}