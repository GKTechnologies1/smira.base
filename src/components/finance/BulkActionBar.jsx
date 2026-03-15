import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BulkActionBar({ selectedIds, onDeleteSelected, onExportSelected, onCancel }) {
  if (selectedIds.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 min-w-[300px]"
    >
      <span className="text-sm text-muted-foreground flex-1">{selectedIds.length} selected</span>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl gap-1.5 text-xs"
        onClick={onExportSelected}
      >
        <Download className="w-3.5 h-3.5" /> Export
      </Button>
      <Button
        size="sm"
        className="rounded-xl gap-1.5 text-xs bg-red-500 hover:bg-red-600 text-white"
        onClick={onDeleteSelected}
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </Button>
      <button onClick={onCancel} className="p-1 rounded-lg hover:bg-secondary ml-1">
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </motion.div>
  );
}