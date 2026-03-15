import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const moodEmojis = {
  joyful: '😊', grateful: '🙏', calm: '😌', neutral: '😐', stressed: '😰',
  sad: '😢', anxious: '😟', reflective: '🤔', motivated: '💪', tired: '😴'
};

export default function JournalEntryCard({ entry, onClick }) {
  return (
    <button
      onClick={() => onClick(entry)}
      className="w-full text-left bg-card rounded-2xl border border-border p-5 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
            {entry.title || 'Untitled Entry'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(entry.created_date), 'MMM d, yyyy · h:mm a')}
          </p>
        </div>
        {entry.mood && (
          <span className="text-xl ml-2">{moodEmojis[entry.mood] || '📝'}</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
        {entry.content}
      </p>
      {entry.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {entry.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs rounded-lg">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}