import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Sun, Mic } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import JournalEntryCard from '../components/journal/JournalEntryCard';
import JournalForm from '../components/journal/JournalForm';
import DailyDigest from '../components/journal/DailyDigest';
import VoiceJournalMode from '../components/voice/VoiceJournalMode';

export default function Journal() {
  const [tab, setTab] = useState('entries'); // entries | digest
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [prefillContent, setPrefillContent] = useState('');
  const [voiceJournalOpen, setVoiceJournalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 50),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.JournalEntry.update(editing.id, data)
      : base44.entities.JournalEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setShowForm(false);
      setEditing(null);
      setPrefillContent('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JournalEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setViewing(null);
    },
  });

  const handleUsePrompt = (prompt) => {
    setPrefillContent(prompt + '\n\n');
    setEditing(null);
    setTab('entries');
    setShowForm(true);
  };

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-lora font-medium">Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">Your reflections and daily entries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setVoiceJournalOpen(true)} className="rounded-xl gap-2">
            <Mic className="w-4 h-4" /> Speak your day
          </Button>
          <Button onClick={() => { setEditing(null); setPrefillContent(''); setShowForm(true); }} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> New Entry
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary rounded-xl p-1 w-fit mb-6">
        {[{ id: 'entries', label: 'Entries', icon: BookOpen }, { id: 'digest', label: "Today's Digest", icon: Sun }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
            tab === t.id ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
          )}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'digest' ? (
        <DailyDigest onUsePrompt={handleUsePrompt} />
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20 fade-up fade-up-1">
          <svg viewBox="0 0 120 100" className="w-32 h-28 mx-auto mb-6 opacity-60" fill="none">
            <path d="M20 80 Q20 20 60 15 Q100 20 100 80" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <path d="M35 45 Q60 38 85 45" stroke="hsl(var(--accent))" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M35 55 Q60 50 75 55" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
            <path d="M35 65 Q55 61 65 65" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
            <circle cx="60" cy="88" r="3" fill="hsl(var(--accent))" opacity="0.6"/>
          </svg>
          <p className="font-lora text-lg text-foreground/70 mb-4">Your story starts here.<br/>Tell me about your day.</p>
          <Button onClick={() => setShowForm(true)} className="rounded-3xl px-6">Write your first entry</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {entries.map(entry => (
            <JournalEntryCard key={entry.id} entry={entry} onClick={setViewing} />
          ))}
        </div>
      )}

      {/* New/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) setPrefillContent(''); }}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Entry' : 'New Journal Entry'}</DialogTitle>
          </DialogHeader>
          <JournalForm
            entry={editing ? editing : prefillContent ? { content: prefillContent } : null}
            onSave={(data) => saveMutation.mutate(data)}
            onCancel={() => { setShowForm(false); setPrefillContent(''); }}
          />
        </DialogContent>
      </Dialog>

      {/* Voice Journal Mode */}
      {voiceJournalOpen && (
        <VoiceJournalMode
          onSave={(data) => { saveMutation.mutate(data); setVoiceJournalOpen(false); }}
          onDiscard={() => setVoiceJournalOpen(false)}
        />
      )}

      {/* View Dialog */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.title || 'Journal Entry'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{viewing.content}</p>
                <div className="flex gap-3 justify-end pt-4">
                  <Button variant="outline" size="sm" className="rounded-xl"
                    onClick={() => { setEditing(viewing); setViewing(null); setShowForm(true); }}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" className="rounded-xl"
                    onClick={() => deleteMutation.mutate(viewing.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}