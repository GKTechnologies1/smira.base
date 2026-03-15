import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MemoryBulkBar({ count, onDelete, onVault, onCancel }) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-6 inset-x-4 z-50 flex items-center gap-3 bg-card border border-border rounded-2xl shadow-xl px-4 py-3"
    >
      <span className="text-sm font-medium flex-1">{count} selected</span>
      <Button size="sm" variant="outline" onClick={onVault} className="rounded-xl gap-2 text-xs">
        <Shield className="w-3.5 h-3.5 text-primary" /> Move to Vault
      </Button>
      <Button size="sm" onClick={onDelete} className="rounded-xl gap-2 text-xs bg-destructive/90 hover:bg-destructive text-white border-0">
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </Button>
      <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground ml-1">Cancel</button>
    </motion.div>
  );
}