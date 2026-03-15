import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

function getMonthlyTotals(transactions, monthsBack = 6) {
  const months = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const label = format(d, 'MMM yy');
    const start = startOfMonth(d);
    const end = endOfMonth(d);
    const monthTx = transactions.filter(t => {
      const txDate = t.date ? parseISO(t.date) : new Date(t.created_date);
      return isWithinInterval(txDate, { start, end });
    });
    const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    months.push({ label, expense: Math.round(expense * 100) / 100, income: Math.round(income * 100) / 100 });
  }
  return months;
}

function forecastNextMonth(monthlyData) {
  if (monthlyData.length < 2) return null;
  const expenses = monthlyData.map(m => m.expense).filter(e => e > 0);
  if (expenses.length === 0) return null;
  // Weighted average — recent months weigh more
  const weights = expenses.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weighted = expenses.reduce((sum, val, i) => sum + val * weights[i], 0) / totalWeight;
  const trend = expenses.length >= 2 ? ((expenses[expenses.length - 1] - expenses[expenses.length - 2]) / (expenses[expenses.length - 2] || 1)) * 100 : 0;
  return { forecast: Math.round(weighted * 100) / 100, trend: Math.round(trend * 10) / 10 };
}

export default function SpendingForecast({ transactions }) {
  const monthlyData = useMemo(() => getMonthlyTotals(transactions, 6), [transactions]);
  const nextMonth = useMemo(() => forecastNextMonth(monthlyData), [monthlyData]);
  const nextMonthLabel = format(subMonths(new Date(), -1), 'MMMM yyyy');

  const chartData = useMemo(() => {
    if (!nextMonth) return monthlyData;
    return [...monthlyData, { label: `${format(subMonths(new Date(), -1), 'MMM yy')} (est.)`, expense: nextMonth.forecast, income: null, forecast: true }];
  }, [monthlyData, nextMonth]);

  if (transactions.length < 3) return (
    <div className="bg-card border border-border rounded-2xl p-5 text-center text-sm text-muted-foreground">
      Add at least 3 transactions to see spending forecasts.
    </div>
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Spending Forecast</h3>
          <p className="text-xs text-muted-foreground mt-0.5">6-month history + {nextMonthLabel} prediction</p>
        </div>
        {nextMonth && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Forecasted for {format(subMonths(new Date(), -1), 'MMM')}</p>
            <p className="text-lg font-bold text-primary">${nextMonth.forecast.toLocaleString()}</p>
            <div className={`flex items-center gap-1 justify-end text-xs font-medium mt-0.5 ${nextMonth.trend > 5 ? 'text-destructive' : nextMonth.trend < -5 ? 'text-green-600' : 'text-muted-foreground'}`}>
              {nextMonth.trend > 5 ? <TrendingUp className="w-3 h-3" /> : nextMonth.trend < -5 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {nextMonth.trend > 0 ? '+' : ''}{nextMonth.trend}% vs last month
            </div>
          </div>
        )}
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val) => val !== null ? [`$${val?.toLocaleString()}`, ''] : ['—', '']} />
            <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fill="url(#incGrad)" strokeWidth={2} dot={false} name="Income" connectNulls />
            <Area type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" fill="url(#expGrad)" strokeWidth={2} strokeDasharray={(d) => d?.forecast ? "5 5" : undefined} dot={false} name="Expenses" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}