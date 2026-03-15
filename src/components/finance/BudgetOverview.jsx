import React from 'react';
import { cn } from '@/lib/utils';

const BUDGETS = {
  food: 400,
  transport: 200,
  housing: 2000,
  health: 150,
  entertainment: 100,
  shopping: 200,
  utilities: 150,
  bills: 300,
  education: 100,
  other: 100,
};

const CATEGORY_LABELS = {
  food: 'Food', transport: 'Transport', housing: 'Housing',
  health: 'Health', entertainment: 'Lifestyle', shopping: 'Shopping',
  utilities: 'Utilities', bills: 'Bills', education: 'Education', other: 'Other',
};

export default function BudgetOverview({ transactions }) {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate();

  // current month expenses only
  const monthExpenses = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const d = t.date ? new Date(t.date) : new Date(t.created_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const spentByCategory = {};
  monthExpenses.forEach(t => {
    spentByCategory[t.category] = (spentByCategory[t.category] || 0) + (t.amount || 0);
  });

  const categories = Object.keys(spentByCategory).filter(c => spentByCategory[c] > 0);
  if (categories.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 mb-6">
      <h3 className="text-sm font-semibold mb-4">Monthly Budget</h3>
      <div className="space-y-4">
        {categories.map(cat => {
          const spent = spentByCategory[cat] || 0;
          const budget = BUDGETS[cat] || 200;
          const pct = Math.min((spent / budget) * 100, 100);
          const over = spent > budget;
          const label = CATEGORY_LABELS[cat] || cat;

          return (
            <div key={cat}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium">{label}</span>
                <span className={cn("font-medium", over ? "text-destructive" : "text-muted-foreground")}>
                  ${spent.toFixed(0)} / ${budget}
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", over ? "bg-destructive" : pct > 75 ? "bg-accent" : "bg-primary")}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {pct >= 50 && (
                <p className="text-xs text-muted-foreground mt-1">
                  You've spent {Math.round(pct)}% of your {label.toLowerCase()} budget
                  {daysLeft > 0 ? ` with ${daysLeft} days left this month.` : ' — end of month!'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}