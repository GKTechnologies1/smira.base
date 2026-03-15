import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Heart, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import SwipeableMemoryCard from '../components/memories/SwipeableMemoryCard';
import EditMemorySheet from '../components/memories/EditMemorySheet';
import DeleteMemorySheet from '../components/memories/DeleteMemorySheet';
import MemoryBulkBar from '../components/memories/MemoryBulkBar';

const categoryLabels = {
  life_lesson: 'Life Lesson', family_story: 'Family Story', milestone: 'Milestone',
  travel: 'Travel', achievement: 'Achievement', relationship: 'Relationship',
  wisdom: 'Wisdom', funny_moment: 'Funny Moment', tradition: 'Tradition', other: 'Other'
};

export default function Memories() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'other', date_of_memory: '', is_in_vault: false });
  const [editingMemory, setEditingMemory] = useState(null);
  const [deletingMemory, setDeletingMemory] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pendingDelete, setPendingDelete] = useState(null); // { memory, timeoutId }
  const [removedIds, setRemovedIds] = useState(new Set()); // IDs optimistically hidden
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: () => base44.entities.Memory.list('-created_date', 100),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.Memory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setShowForm(false);
      setForm({ title: '', content: '', category: 'other', date_of_memory: '', is_in_vault: false });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Memory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setEditingMemory(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Memory.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memories'] }),
  });

  const handleEditSave = (data) => {
    updateMutation.mutate({ id: editingMemory.id, data });
  };

  const handleDeleteRequest = (memory) => {
    setDeletingMemory(memory);
  };

  const handleDeleteConfirm = () => {
    const memory = deletingMemory;
    setDeletingMemory(null);

    // Optimistically hide
    setRemovedIds(s => new Set([...s, memory.id]));

    // 1s pause then delete
    const timeoutId = setTimeout(() => {
      deleteMutation.mutate(memory.id);
      setPendingDelete(null);
      setRemovedIds(s => { const n = new Set(s); n.delete(memory.id); return n; });
    }, 1000);

    setPendingDelete({ memory, timeoutId });

    toast({
      description: (
        <div className="flex items-center justify-between gap-4">
          <span>Memory removed</span>
          <button
            className="text-primary font-medium text-sm underline-offset-2 hover:underline"
            onClick={() => {
              clearTimeout(timeoutId);
              setPendingDelete(null);
              setRemovedIds(s => { const n = new Set(s); n.delete(memory.id); return n; });
            }}
          >
            Undo
          </button>
        </div>
      ),
      duration: 6000,
    });
  };

  const handleSelect = (id) => {
    if (!selectionMode) setSelectionMode(true);
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleBulkDelete = () => {
    selectedIds.forEach(id => deleteMutation.mutate(id));
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkVault = async () => {
    for (const id of selectedIds) {
      await base44.entities.Memory.update(id, { is_in_vault: true });
    }
    queryClient.invalidateQueries({ queryKey: ['memories'] });
    setSelectionMode(false);
    setSelectedIds(new Set());
    toast({ description: `${selectedIds.size} memories moved to Legacy Vault ✦` });
  };

  const visibleMemories = memories.filter(m => !removedIds.has(m.id));

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-lora font-semibold">Memories</h1>
          <p className="text-sm text-muted-foreground mt-1">Preserve what matters most</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Save Memory
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : visibleMemories.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
        >
          <div className="text-5xl mb-5">🌿</div>
          <h3 className="font-lora font-medium text-xl mb-2">Your memories live here.</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Tell me something worth keeping.
          </p>
          <Button onClick={() => setShowForm(true)} className="rounded-xl mt-6">
            <Plus className="w-4 h-4 mr-2" /> Save your first memory
          </Button>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {visibleMemories.map((memory, i) => (
              <motion.div
                key={memory.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scaleY: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.35, delay: i < 6 ? i * 0.04 : 0 }}
                style={{ originY: 0 }}
              >
                <SwipeableMemoryCard
                  memory={memory}
                  onEdit={setEditingMemory}
                  onDelete={handleDeleteRequest}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(memory.id)}
                  onSelect={handleSelect}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Backdrop for sheets */}
      <AnimatePresence>
        {(editingMemory || deletingMemory) && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => { setEditingMemory(null); setDeletingMemory(null); }}
          />
        )}
      </AnimatePresence>

      {/* Edit sheet */}
      <AnimatePresence>
        {editingMemory && (
          <EditMemorySheet
            key="edit-sheet"
            memory={editingMemory}
            onSave={handleEditSave}
            onClose={() => setEditingMemory(null)}
            isSaving={updateMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation sheet */}
      <AnimatePresence>
        {deletingMemory && (
          <DeleteMemorySheet
            key="delete-sheet"
            memory={deletingMemory}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeletingMemory(null)}
          />
        )}
      </AnimatePresence>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <MemoryBulkBar
            count={selectedIds.size}
            onDelete={handleBulkDelete}
            onVault={handleBulkVault}
            onCancel={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
          />
        )}
      </AnimatePresence>

      {/* Create new memory dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-lora">Save a Memory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Give this memory a title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="rounded-xl bg-secondary border-none h-12"
            />
            <Textarea
              placeholder="Tell the story..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="rounded-xl bg-secondary border-none min-h-[120px] resize-none"
            />
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={form.date_of_memory}
                onChange={(e) => setForm({ ...form, date_of_memory: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_in_vault}
                onChange={(e) => setForm({ ...form, is_in_vault: e.target.checked })}
                className="rounded"
              />
              <Shield className="w-4 h-4 text-primary" />
              Save to Legacy Vault
            </label>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="rounded-xl">
                Save Memory
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}