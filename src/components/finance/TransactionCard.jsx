import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const categoryLabels = {
  food: 'Food', transport: 'Transport', housing: 'Housing', utilities: 'Utilities',
  entertainment: 'Entertainment', health: 'Health', shopping: 'Shopping', education: 'Education',
  salary: 'Salary', freelance: 'Freelance', investment: 'Investment', gift: 'Gift',
  bills: 'Bills', savings: 'Savings', other: 'Other'
};

export default function TransactionCard({ transaction }) {
  const isIncome = transaction.type === 'income';

  return (
    <div className="flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:shadow-sm transition-all">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center",
        isIncome ? "bg-primary/10" : "bg-chart-4/10"
      )}>
        {isIncome ? (
          <ArrowDownRight className="w-5 h-5 text-primary" />
        ) : (
          <ArrowUpRight className="w-5 h-5 text-chart-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{transaction.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs rounded-lg">
            {categoryLabels[transaction.category] || transaction.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {transaction.date ? format(new Date(transaction.date), 'MMM d') : format(new Date(transaction.created_date), 'MMM d')}
          </span>
        </div>
      </div>
      <p className={cn("text-sm font-semibold", isIncome ? "text-primary" : "text-foreground")}>
        {isIncome ? '+' : '-'}${transaction.amount?.toFixed(2)}
      </p>
    </div>
  );
}