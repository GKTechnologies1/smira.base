import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DeleteMemorySheet({ memory, onConfirm, onCancel }) {
  if (!memory) return null;

  const preview = memory.content?.split('\n')[0]?.slice(0, 100) || '';

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-2xl px-5 pb-8 pt-4"
    >
      <div className="flex justify-center mb-4">
        <div className="w-10 h-1 rounded-full bg-muted" />
      </div>
      <button onClick={onCancel} className="absolute top-4 right-5 p-1.5 text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>

      <div className="mb-6 text-center max-w-sm mx-auto">
        <div className="text-3xl mb-3">🕊️</div>
        <h3 className="font-lora font-semibold text-lg mb-1">{memory.title}</h3>
        {preview && <p className="text-sm text-muted-foreground italic">"{preview}..."</p>}
        <p className="text-sm text-muted-foreground mt-4">Remove this memory forever?</p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 rounded-2xl h-12 text-sm"
        >
          Keep it
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 rounded-2xl h-12 text-sm bg-red-500/90 hover:bg-red-500 text-white border-0"
        >
          Yes, let it go
        </Button>
      </div>
    </motion.div>
  );
}