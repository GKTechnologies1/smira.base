import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const priorityDot = {
  low: 'bg-green-400',
  medium: 'bg-apricot',
  high: 'bg-orange-400',
  urgent: 'bg-destructive',
};

const categoryLabels = {
  work: 'Work', personal: 'Personal', health: 'Health', family: 'Family',
  errands: 'Errands', finance: 'Finance', social: 'Social', learning: 'Learning', other: 'Other'
};

export default function TaskCard({ task, onToggle, onClick, onDelete }) {
  const isDone = task.status === 'completed';
  const [justDone, setJustDone] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isDone) setJustDone(true);
    setTimeout(() => setJustDone(false), 800);
    onToggle(task);
  };

  return (
    <motion.div
      layout
      animate={isDone ? { opacity: 0.55, x: 3 } : { opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3 p-4 bg-card rounded-[20px] transition-shadow group cursor-pointer relative overflow-hidden"
      style={{ border: '1px solid hsl(var(--border) / 0.5)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(task)}
    >
      <button onClick={handleToggle} className="mt-0.5 flex-shrink-0 relative">
        {isDone ? (
          <CheckCircle2 className="w-5 h-5 text-teal" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground group-hover:text-teal transition-colors" />
        )}
        <AnimatePresence>
          {justDone && (
            <motion.svg
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-1 w-7 h-7"
              viewBox="0 0 24 24" fill="none"
            >
              <path d="M4 13l5 5 10-10" stroke="#00C9A7" strokeWidth="2" strokeLinecap="round" className="draw-check" />
            </motion.svg>
          )}
        </AnimatePresence>
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium transition-all duration-300 relative",
          isDone && "text-muted-foreground task-strikethrough"
        )}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          {task.priority && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("w-1.5 h-1.5 rounded-full", priorityDot[task.priority])} />
              {task.priority}
            </span>
          )}
          <span className="text-xs text-muted-foreground/70">
            {categoryLabels[task.category] || task.category}
          </span>
          {task.due_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(task.due_date), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      {/* Hover action buttons */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onClick(task); }}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-amber-600 transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}