import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, BookOpen, Heart } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

const MILESTONES = [
  { days: 365, label: 'On this day last year' },
  { days: 30, label: '30 days ago' },
  { days: 7, label: 'One week ago' },
];

function matchesMilestone(dateStr) {
  const created = parseISO(dateStr);
  const today = new Date();
  const diff = differenceInDays(today, created);
  return MILESTONES.find(m => diff === m.days);
}

export default function OnThisDay() {
  const { data: journals = [] } = useQuery({
    queryKey: ['journals-all'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 200),
  });
  const { data: memories = [] } = useQuery({
    queryKey: ['memories-all'],
    queryFn: () => base44.entities.Memory.list('-created_date', 200),
  });

  const matches = [
    ...journals.map(j => ({ ...j, _type: 'journal' })),
    ...memories.map(m => ({ ...m, _type: 'memory' })),
  ]
    .map(item => ({ item, milestone: matchesMilestone(item.created_date) }))
    .filter(({ milestone }) => !!milestone);

  if (matches.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4" /> On This Day
      </h3>
      <div className="space-y-3">
        {matches.map(({ item, milestone }) => (
          <Link
            key={item.id}
            to={item._type === 'journal' ? '/Journal' : '/Memories'}
            className="block bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-2xl p-4 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                {item._type === 'journal'
                  ? <BookOpen className="w-4 h-4 text-primary" />
                  : <Heart className="w-4 h-4 text-chart-5" />}
              </div>
              <div>
                <p className="text-xs font-medium text-primary mb-1">{milestone.label}</p>
                <p className="text-sm font-semibold leading-snug">
                  {item.title || item.content?.slice(0, 60) + '…'}
                </p>
                {item.content && item.title && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.content}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}