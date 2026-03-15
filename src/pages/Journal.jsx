import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import JournalEntryCard from '../components/journal/JournalEntryCard';
import JournalForm from '../components/journal/JournalForm';

export default function Journal() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
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
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JournalEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setViewing(null);
    },
  });

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">Your reflections and daily entries</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> New Entry
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-accent" />
          </div>
          <h3 className="font-semibold mb-2">No journal entries yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Start capturing your thoughts and reflections</p>
          <Button onClick={() => setShowForm(true)} className="rounded-xl">Write your first entry</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {entries.map(entry => (
            <JournalEntryCard key={entry.id} entry={entry} onClick={setViewing} />
          ))}
        </div>
      )}

      {/* New/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Entry' : 'New Journal Entry'}</DialogTitle>
          </DialogHeader>
          <JournalForm
            entry={editing}
            onSave={(data) => saveMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

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
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => { setEditing(viewing); setViewing(null); setShowForm(true); }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => deleteMutation.mutate(viewing.id)}
                  >
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