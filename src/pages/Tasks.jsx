import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Plus, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import SmartTaskPanel from '../components/tasks/SmartTaskPanel';

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('active');
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
  });

  const { data: journals = [] } = useQuery({
    queryKey: ['journals-tasks'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 14),
    staleTime: 120000,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Task.update(editing.id, data)
      : base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowForm(false);
      setEditing(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (task) => base44.entities.Task.update(task.id, {
      status: task.status === 'completed' ? 'pending' : 'completed'
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditing(null);
      setShowForm(false);
    },
  });

  const filtered = tasks.filter(t => {
    if (filter === 'active') return t.status !== 'completed' && t.status !== 'cancelled';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-lora font-medium">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">Stay on top of your to-dos</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="rounded-3xl">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      <SmartTaskPanel tasks={tasks} journals={journals} />

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg">Active</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 fade-up fade-up-1">
          <svg viewBox="0 0 120 100" className="w-32 h-28 mx-auto mb-6 opacity-60" fill="none">
            <rect x="25" y="18" width="70" height="65" rx="8" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>
            <path d="M38 40 L50 52 L70 32" stroke="#00C9A7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M38 60 L82 60" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
            <path d="M38 70 L70 70" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeLinecap="round" opacity="0.25"/>
          </svg>
          <p className="font-lora text-lg text-foreground/70 mb-4">
            {filter === 'completed' ? 'No completed tasks yet.' : 'Your list is clear. Enjoy the calm.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <TaskCard
            key={task.id}
            task={task}
            onToggle={(t) => toggleMutation.mutate(t)}
            onClick={(t) => { setEditing(t); setShowForm(true); }}
            onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={editing}
            onSave={(data) => saveMutation.mutate(data)}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
          {editing && (
            <Button
              variant="destructive"
              size="sm"
              className="rounded-xl mt-2"
              onClick={() => deleteMutation.mutate(editing.id)}
            >
              Delete Task
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}