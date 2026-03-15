import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, X, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PeopleTagger({ value = [], onChange, description = '' }) {
  const [inputVal, setInputVal] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const queryClient = useQueryClient();

  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn: () => base44.entities.Person.list('name', 200),
  });

  const createPerson = useMutation({
    mutationFn: (name) => base44.entities.Person.create({ name }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['people'] }),
  });

  // Auto-detect names in description
  useEffect(() => {
    if (!description) return;
    const words = description.split(/\s+/);
    const capitalizedWords = words.filter(w => /^[A-Z][a-z]{2,}$/.test(w));
    const existing = people.filter(p => capitalizedWords.some(w => p.name.includes(w)));
    existing.forEach(p => {
      if (!value.includes(p.name)) {
        // suggest but don't auto-add
      }
    });
  }, [description, people]);

  const handleInput = (e) => {
    const v = e.target.value;
    setInputVal(v);
    if (v.length > 1) {
      setSuggestions(people.filter(p => p.name.toLowerCase().includes(v.toLowerCase()) && !value.includes(p.name)));
    } else {
      setSuggestions([]);
    }
  };

  const addPerson = async (name) => {
    const trimmed = name.trim();
    if (!trimmed || value.includes(trimmed)) return;
    const existing = people.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (!existing) await createPerson.mutateAsync(trimmed);
    onChange([...value, trimmed]);
    setInputVal('');
    setSuggestions([]);
  };

  const removePerson = (name) => onChange(value.filter(n => n !== name));

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-2 block">People in this memory</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(name => (
          <span key={name} className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full">
            <User className="w-3 h-3" />{name}
            <button onClick={() => removePerson(name)} className="hover:opacity-70 ml-0.5">×</button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          value={inputVal}
          onChange={handleInput}
          onKeyDown={(e) => { if (e.key === 'Enter' && inputVal.trim()) { e.preventDefault(); addPerson(inputVal); } }}
          placeholder="Tag someone..."
          className="w-full rounded-xl bg-secondary border-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {suggestions.slice(0, 5).map(p => (
              <button key={p.id} onClick={() => addPerson(p.name)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary text-left">
                <User className="w-3.5 h-3.5 text-muted-foreground" /> {p.name}
              </button>
            ))}
            {inputVal && !people.find(p => p.name.toLowerCase() === inputVal.toLowerCase()) && (
              <button onClick={() => addPerson(inputVal)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary text-primary">
                <Plus className="w-3.5 h-3.5" /> Add "{inputVal}"
              </button>
            )}
          </div>
        )}
        {inputVal && suggestions.length === 0 && (
          <button onClick={() => addPerson(inputVal)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-primary font-medium flex items-center gap-1 hover:underline">
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>
    </div>
  );
}