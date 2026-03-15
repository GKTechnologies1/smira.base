import React from 'react';
import { format } from 'date-fns';

const moodEmojis = {
  joyful: '😊', grateful: '🙏', calm: '😌', neutral: '😐', stressed: '😰',
  sad: '😢', anxious: '😟', reflective: '🤔', motivated: '💪', tired: '😴'
};

const moodColors = {
  joyful: '#FFD166', grateful: '#06D6A0', calm: '#118AB2', neutral: '#8D99AE',
  stressed: '#EF476F', sad: '#6B9AC4', anxious: '#F4A261', reflective: '#9B89B4',
  motivated: '#00C9A7', tired: '#ADB5BD'
};

export default function JournalEntryCard({ entry, onClick }) {
  const borderColor = moodColors[entry.mood] || '#00C9A7';

  return (
    <button
      onClick={() => onClick(entry)}
      className="w-full text-left bg-card rounded-[20px] p-5 hover:shadow-md transition-all duration-200 group relative overflow-hidden mood-border"
      style={{ border: '1px solid hsl(var(--border) / 0.5)' }}
    >
      {/* Mood border fill */}
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[20px]"
        style={{ background: borderColor }}
      />

      <div className="pl-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-lora font-medium text-sm group-hover:text-teal transition-colors truncate">
              {entry.title || 'Untitled Entry'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(entry.created_date), 'MMM d, yyyy · h:mm a')}
            </p>
          </div>
          {entry.mood && (
            <span className="text-lg ml-2 flex-shrink-0">{moodEmojis[entry.mood] || '📝'}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {entry.content}
        </p>
        {entry.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {entry.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-xs px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}