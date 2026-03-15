import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Pencil, Trash2, UtensilsCrossed, Car, Home, Zap, Play, Heart, ShoppingBag, GraduationCap, ArrowUpRight, Briefcase, TrendingUp, Gift, FileText, PiggyBank, Package } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORY_META = {
  food:          { icon: UtensilsCrossed, color: '#FF8C69', bg: '#FFF0EB' },
  transport:     { icon: Car,            color: '#6B8CFF', bg: '#EEF0FF' },
  housing:       { icon: Home,           color: '#7B61FF', bg: '#F0EEFF' },
  utilities:     { icon: Zap,            color: '#F5A623', bg: '#FFF8EC' },
  entertainment: { icon: Play,           color: '#E85D8A', bg: '#FDEEF4' },
  health:        { icon: Heart,          color: '#E85D8A', bg: '#FDEEF4' },
  shopping:      { icon: ShoppingBag,    color: '#FF8C69', bg: '#FFF0EB' },
  education:     { icon: GraduationCap,  color: '#6B8CFF', bg: '#EEF0FF' },
  salary:        { icon: ArrowUpRight,   color: '#1D9E75', bg: '#E6F7F2' },
  freelance:     { icon: Briefcase,      color: '#1D9E75', bg: '#E6F7F2' },
  investment:    { icon: TrendingUp,     color: '#1D9E75', bg: '#E6F7F2' },
  gift:          { icon: Gift,           color: '#E85D8A', bg: '#FDEEF4' },
  bills:         { icon: FileText,       color: '#6B7280', bg: '#F3F4F6' },
  savings:       { icon: PiggyBank,      color: '#1D9E75', bg: '#E6F7F2' },
  other:         { icon: Package,        color: '#9CA3AF', bg: '#F3F4F6' },
};

const REVEAL_WIDTH = 120;
const SWIPE_THRESHOLD = 60;

export default function SwipeableTransactionCard({ transaction, onEdit, onDelete, selected, onLongPress, selectionMode, onClick }) {
  const x = useMotionValue(0);
  const [revealed, setRevealed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const longPressTimer = useRef(null);
  const isIncome = transaction.type === 'income';
  const meta = CATEGORY_META[transaction.category] || CATEGORY_META.other;
  const Icon = meta.icon;

  const handleDragEnd = useCallback((_, info) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      animate(x, -REVEAL_WIDTH, { type: 'spring', stiffness: 320, damping: 28 });
      setRevealed(true);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 320, damping: 28 });
      setRevealed(false);
    }
  }, [x]);

  const snapBack = useCallback(() => {
    animate(x, 0, { type: 'spring', stiffness: 320, damping: 28 });
    setRevealed(false);
  }, [x]);

  const handleEdit = () => { snapBack(); onEdit(transaction); };
  const handleDelete = () => { snapBack(); onDelete(transaction); };

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => onLongPress?.(transaction.id), 500);
  };
  const handlePointerUp = () => clearTimeout(longPressTimer.current);

  const dateStr = transaction.date
    ? format(new Date(transaction.date), 'MMM d')
    : format(new Date(transaction.created_date), 'MMM d');

  const catLabel = transaction.category ? transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1) : 'Other';

  return (
    <div
      className="relative overflow-hidden"
      style={{ borderRadius: 16 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Revealed action buttons */}
      <div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: REVEAL_WIDTH }}>
        <motion.button
          onClick={handleEdit}
          animate={revealed ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex-1 flex flex-col items-center justify-center gap-1"
          style={{ background: '#FAEEDA' }}
        >
          <Pencil className="w-4 h-4" style={{ color: '#854F0B' }} />
          <span className="text-xs font-medium" style={{ color: '#854F0B' }}>Edit</span>
        </motion.button>
        <motion.button
          onClick={handleDelete}
          animate={revealed ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="flex-1 flex flex-col items-center justify-center gap-1"
          style={{ background: '#FCEBEB', borderRadius: '0 16px 16px 0' }}
        >
          <Trash2 className="w-4 h-4" style={{ color: '#A32D2D' }} />
          <span className="text-xs font-medium" style={{ color: '#A32D2D' }}>Delete</span>
        </motion.button>
      </div>

      {/* Swipeable card */}
      <motion.div
        drag={selectionMode ? false : 'x'}
        dragConstraints={{ left: -REVEAL_WIDTH, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        style={{ x, borderRadius: 16 }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={selectionMode ? onClick : (revealed ? snapBack : undefined)}
        className="relative z-10 bg-card touch-pan-y"
        whileTap={{ scale: 0.99 }}
      >
        <div
          className={cn("flex items-center gap-4 select-none", selected && "ring-2 ring-primary bg-primary/5")}
          style={{ padding: '14px 16px', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16 }}
        >
          {/* Selection circle */}
          {selectionMode && (
            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
              selected ? "bg-primary border-primary" : "border-muted-foreground")}>
              {selected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          )}

          {/* Category icon circle */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: meta.bg }}>
            <Icon className="w-5 h-5" style={{ color: meta.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{transaction.description}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-muted-foreground">{catLabel}</span>
              <span className="text-xs text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground">{dateStr}</span>
            </div>
          </div>

          {/* Amount */}
          <p className="text-sm font-semibold flex-shrink-0" style={{ color: isIncome ? '#1D9E75' : '#A32D2D' }}>
            {isIncome ? '+' : '−'}${transaction.amount?.toFixed(2)}
          </p>

          {/* Desktop hover actions — fade in/out */}
          <div className={cn(
            "hidden md:flex items-center gap-1 transition-opacity duration-150",
            hovered ? "opacity-100" : "opacity-0 pointer-events-none"
          )}>
            <button onClick={(e) => { e.stopPropagation(); handleEdit(); }}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-amber-700 transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground transition-colors"
              style={{ '--hover-color': '#A32D2D' }}>
              <Trash2 className="w-3.5 h-3.5 hover:text-red-600" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}