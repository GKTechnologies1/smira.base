import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const TASK_CATEGORIES = ['work', 'personal', 'health', 'family', 'errands', 'finance', 'social', 'learning', 'other'];

export default function ConditionalTriggerForm({ form, setForm }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Delivery Trigger</label>
        <Select value={form.trigger_type} onValueChange={v => setForm({ ...form, trigger_type: v })}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">📅 On a specific date</SelectItem>
            <SelectItem value="savings_goal">💰 When I reach a savings target</SelectItem>
            <SelectItem value="task_completion">✅ When I complete enough tasks</SelectItem>
            <SelectItem value="manual">✉️ Manual (draft only)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.trigger_type === 'date' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Delivery Date</label>
          <Input
            type="date"
            value={form.delivery_date}
            onChange={e => setForm({ ...form, delivery_date: e.target.value })}
            className="rounded-xl"
          />
        </div>
      )}

      {form.trigger_type === 'savings_goal' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-yellow-800">This message unlocks when your total logged income reaches the target.</p>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Total Income/Savings Target ($)</label>
            <Input
              type="number"
              placeholder="e.g. 10000"
              value={form.trigger_savings_target || ''}
              onChange={e => setForm({ ...form, trigger_savings_target: parseFloat(e.target.value) || '' })}
              className="rounded-xl"
            />
          </div>
        </div>
      )}

      {form.trigger_type === 'task_completion' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <p className="text-xs font-medium text-blue-800">This message unlocks when you've completed a certain number of tasks.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Tasks Needed</label>
              <Input
                type="number"
                placeholder="e.g. 10"
                value={form.trigger_task_count || ''}
                onChange={e => setForm({ ...form, trigger_task_count: parseInt(e.target.value) || '' })}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category (optional)</label>
              <Select value={form.trigger_task_category || 'any'} onValueChange={v => setForm({ ...form, trigger_task_category: v === 'any' ? '' : v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any category</SelectItem>
                  {TASK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}