import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Pencil, Trash2, Shield, MoreVertical, CheckSquare, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const categoryLabels = {
  life_lesson: 'Life Lesson', family_story: 'Family Story', milestone: 'Milestone',
  travel: 'Travel', achievement: 'Achievement', relationship: 'Relationship',
  wisdom: 'Wisdom', funny_moment: 'Funny Moment', tradition: 'Tradition', other: 'Other'
};

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 130;

export default function SwipeableMemoryCard({ memory, onEdit, onDelete, selectionMode, selected, onSelect }) {
  const x = useMotionValue(0);
  const [swiped, setSwiped] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cardRef = useRef(null);

  const bgOpacity = useTransform(x, [-ACTION_WIDTH, 0], [1, 0]);

  const handleDragEnd = useCallback((_, info) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      animate(x, -ACTION_WIDTH, { type: 'spring', stiffness: 300, damping: 30 });
      setSwiped(true);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      setSwiped(false);
    }
  }, [x]);

  const snapBack = () => {
    animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    setSwiped(false);
  };

  const handleEdit = () => { snapBack(); onEdit(memory); };
  const handleDelete = () => { snapBack(); onDelete(memory); };

  if (isDeleting) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl" ref={cardRef}
      onMouseEnter={() => setShowDesktopMenu(true)}
      onMouseLeave={() => { setShowDesktopMenu(false); }}
    >
      {/* Revealed action buttons */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-stretch"
        style={{ width: ACTION_WIDTH, opacity: bgOpacity }}
      >
        <button
          onClick={handleEdit}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
        >
          <Pencil className="w-4 h-4" />
          <span className="text-xs font-medium">Edit</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 flex flex-col items-center justify-center gap-1 bg-red-100 dark:bg-red-900/40 text-red-500"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-xs font-medium">Delete</span>
        </button>
      </motion.div>

      {/* Main card */}
      <motion.div
        drag={selectionMode ? false : "x"}
        dragConstraints={{ left: -ACTION_WIDTH, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ x }}
        onClick={() => {
          if (selectionMode) { onSelect(memory.id); return; }
          if (swiped) { snapBack(); }
        }}
        onLongPress={() => onSelect && onSelect(memory.id)}
        className="relative bg-card border border-border rounded-2xl p-5 cursor-pointer select-none"
        whileTap={selectionMode ? {} : { scale: 0.99 }}
      >
        {/* Selection checkbox */}
        {selectionMode && (
          <div className="absolute top-4 left-4">
            {selected
              ? <CheckSquare className="w-5 h-5 text-primary" />
              : <Square className="w-5 h-5 text-muted-foreground" />
            }
          </div>
        )}

        {/* Desktop 3-dot menu */}
        {!selectionMode && showDesktopMenu && (
          <div className="absolute top-3 right-3 hidden md:block z-10">
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowDesktopMenu(v => v); }}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-lg overflow-hidden w-36 z-20">
                <button onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary text-violet-600">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary text-destructive">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={cn("flex items-start justify-between mb-3", selectionMode && "pl-7")}>
          <h3 className="font-semibold text-sm pr-8">{memory.title}</h3>
          {memory.is_in_vault && <Shield className="w-4 h-4 text-primary flex-shrink-0" />}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{memory.content}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs rounded-lg">
            {categoryLabels[memory.category] || memory.category}
          </Badge>
          {memory.date_of_memory && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(memory.date_of_memory), 'MMM d, yyyy')}
            </span>
          )}
          {memory.tags?.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs rounded-lg">{tag}</Badge>
          ))}
        </div>
      </motion.div>
    </div>
  );
}