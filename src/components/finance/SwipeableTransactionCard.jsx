import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const categoryLabels = {
  food: '🍔 Food', transport: '🚗 Transport', housing: '🏠 Housing', utilities: '💡 Utilities',
  entertainment: '🎬 Entertainment', health: '❤️ Health', shopping: '🛍 Shopping',
  education: '📚 Education', salary: '💼 Salary', freelance: '💻 Freelance',
  investment: '📈 Investment', gift: '🎁 Gift', bills: '📄 Bills', savings: '🏦 Savings', other: '📦 Other'
};

const SWIPE_THRESHOLD = 80;
const REVEAL_WIDTH = 130;

export default function SwipeableTransactionCard({ transaction, onEdit, onDelete, selected, onLongPress, selectionMode }) {
  const x = useMotionValue(0);
  const [revealed, setRevealed] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const longPressTimer = useRef(null);
  const startX = useRef(null);
  const isIncome = transaction.type === 'income';

  const handleDragEnd = useCallback((_, info) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      animate(x, -REVEAL_WIDTH, { type: 'spring', stiffness: 300, damping: 30 });
      setRevealed(true);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setRevealed(false);
    }
  }, [x]);

  const closeSwipe = useCallback(() => {
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    setRevealed(false);
  }, [x]);

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      onLongPress?.(transaction.id);
    }, 500);
  };

  const handlePointerUp = () => clearTimeout(longPressTimer.current);

  const handleEdit = () => { closeSwipe(); onEdit(transaction); };
  const handleDelete = () => { closeSwipe(); onDelete(transaction); };

  return (
    <div className="relative overflow-hidden rounded-2xl group">
      {/* Actions behind card */}
      <div className="absolute right-0 top-0 bottom-0 flex items-stretch">
        <button
          onClick={handleEdit}
          className="flex items-center justify-center w-16 bg-amber-100 hover:bg-amber-200 transition-colors"
        >
          <Pencil className="w-4 h-4 text-amber-700" />
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center justify-center w-16 bg-red-100 hover:bg-red-200 transition-colors rounded-r-2xl"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>

      {/* Swipeable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -REVEAL_WIDTH, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="relative z-10 touch-pan-y"
      >
        <div
          className={cn(
            "flex items-center gap-4 p-4 bg-card border border-border transition-all cursor-pointer rounded-2xl",
            selected && "ring-2 ring-primary bg-primary/5"
          )}
          onMouseEnter={() => setShowDesktopMenu(true)}
          onMouseLeave={() => setShowDesktopMenu(false)}
        >
          {selectionMode && (
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
              selected ? "bg-primary border-primary" : "border-muted-foreground"
            )}>
              {selected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          )}

          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            isIncome ? "bg-primary/10" : "bg-chart-4/10"
          )}>
            {isIncome
              ? <ArrowDownRight className="w-5 h-5 text-primary" />
              : <ArrowUpRight className="w-5 h-5 text-chart-4" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{transaction.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs rounded-lg">
                {categoryLabels[transaction.category] || transaction.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {transaction.date ? format(new Date(transaction.date), 'MMM d') : format(new Date(transaction.created_date), 'MMM d')}
              </span>
            </div>
          </div>

          <p className={cn("text-sm font-semibold", isIncome ? "text-primary" : "text-foreground")}>
            {isIncome ? '+' : '-'}${transaction.amount?.toFixed(2)}
          </p>

          {/* Desktop three-dot menu */}
          <div className={cn("hidden md:flex items-center transition-opacity", showDesktopMenu ? "opacity-100" : "opacity-0")}>
            <div className="relative">
              <button
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
                onClick={(e) => { e.stopPropagation(); setShowDesktopMenu(v => !v); }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showDesktopMenu && (
                <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden w-36">
                  <button onClick={handleEdit} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors">
                    <Pencil className="w-3.5 h-3.5 text-amber-600" /> Edit
                  </button>
                  <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors text-red-600">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}