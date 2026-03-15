import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const REL_COLORS = {
  family: 'bg-pink-100 text-pink-700',
  friend: 'bg-blue-100 text-blue-700',
  partner: 'bg-red-100 text-red-700',
  colleague: 'bg-amber-100 text-amber-700',
  mentor: 'bg-violet-100 text-violet-700',
  other: 'bg-secondary text-muted-foreground',
};

export default function People() {
  const { data: people = [], isLoading: loadingPeople } = useQuery({
    queryKey: ['people'],
    queryFn: () => base44.entities.Person.list('name', 200),
  });

  const { data: memories = [] } = useQuery({
    queryKey: ['memories'],
    queryFn: () => base44.entities.Memory.list('-date_of_memory', 200),
  });

  const peopleWithMemories = useMemo(() =>
    people.map(p => ({
      ...p,
      memories: memories.filter(m =>
        (m.people_involved || []).some(n => n.toLowerCase() === p.name.toLowerCase())
      ),
    })), [people, memories]);

  if (loadingPeople) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-lora font-semibold">People</h1>
        <p className="text-sm text-muted-foreground mt-1">Everyone who matters in your story</p>
      </div>

      {peopleWithMemories.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">🫂</div>
          <h3 className="font-lora font-medium text-xl mb-2">No people tagged yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            When you tag people in memories, their profiles appear here.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {peopleWithMemories.map(person => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}

function PersonCard({ person }) {
  const [expanded, setExpanded] = React.useState(false);
  const initials = person.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        {person.avatar_url ? (
          <img src={person.avatar_url} alt={person.name} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{person.name}</p>
          {person.relationship && (
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", REL_COLORS[person.relationship] || REL_COLORS.other)}>
              {person.relationship}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Heart className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{person.memories.length}</span>
        </div>
      </div>

      {person.notes && (
        <p className="text-xs text-muted-foreground mb-3 italic">"{person.notes}"</p>
      )}

      {person.memories.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Shared memories</p>
          {(expanded ? person.memories : person.memories.slice(0, 2)).map(m => (
            <div key={m.id} className="flex items-start gap-2 py-1.5 border-t border-border/50">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{m.title}</p>
                {m.date_of_memory && (
                  <p className="text-xs text-muted-foreground">{format(new Date(m.date_of_memory), 'MMM d, yyyy')}</p>
                )}
              </div>
            </div>
          ))}
          {person.memories.length > 2 && (
            <button onClick={() => setExpanded(e => !e)}
              className="text-xs text-primary font-medium hover:underline mt-1">
              {expanded ? 'Show less' : `+${person.memories.length - 2} more`}
            </button>
          )}
        </div>
      )}

      {person.memories.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic">No shared memories yet</p>
      )}
    </div>
  );
}