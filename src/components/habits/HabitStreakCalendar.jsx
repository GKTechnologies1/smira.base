import React from 'react';
import { format, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

export default function HabitStreakCalendar({ logs }) {
  const days = Array.from({ length: 28 }, (_, i) => {
    const date = subDays(new Date(), 27 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const completed = logs.some(l => l.date === dateStr && l.completed);
    const isToday = i === 27;
    return { dateStr, completed, isToday };
  });

  return (
    <div className="flex gap-1 flex-wrap">
      {days.map(({ dateStr, completed, isToday }) => (
        <div
          key={dateStr}
          title={dateStr}
          className={cn(
            'w-5 h-5 rounded-sm transition-all',
            completed ? 'bg-primary opacity-90' : 'bg-secondary',
            isToday && !completed && 'ring-1 ring-primary/50'
          )}
        />
      ))}
    </div>
  );
}