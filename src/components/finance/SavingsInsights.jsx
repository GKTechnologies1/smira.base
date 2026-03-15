import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, TrendingDown, RefreshCw, AlertTriangle, PiggyBank } from 'lucide-react';
import { subMonths, parseISO, startOfMonth, endOfMonth, isWithinInterval, format } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS = {
  food: 'Food', transport: 'Transport', housing: 'Housing', utilities: 'Utilities',
  entertainment: 'Entertainment', health: 'Health', shopping: 'Shopping',
  education: 'Education', bills: 'Bills', other: 'Other',
};

function detectSubscriptions(transactions) {
  // Group expenses by description similarity (same description = recurring)
  const expenses = transactions.filter(t => t.type === 'expense');
  const groups = {};
  expenses.forEach(t => {
    const key = (t.description || '').toLowerCase().trim();
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return Object.entries(groups)
    .filter(([, txs]) => txs.length >= 2)
    .map(([desc, txs]) => ({
      description: desc,
      count: txs.length,
      avg: txs.reduce((s, t) => s + t.amount, 0) / txs.length,
      total: txs.reduce((s, t) => s + t.amount, 0),
      category: txs[0]?.category,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

function getTopCategories(transactions) {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const d = t.date ? parseISO(t.date) : new Date(t.created_date);
    return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });
  });
  const cats = {};
  thisMonth.forEach(t => { cats[t.category] = (cats[t.category] || 0) + t.amount; });
  return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 4);
}

export default function SavingsInsights({ transactions }) {
  const [aiTips, setAiTips] = useState(null);
  const [loading, setLoading] = useState(false);

  const subscriptions = useMemo(() => detectSubscriptions(transactions), [transactions]);
  const topCategories = useMemo(() => getTopCategories(transactions), [transactions]);
  const totalRecurring = subscriptions.reduce((s, r) => s + r.avg, 0);

  const generateAiTips = async () => {
    setLoading(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Smira, a caring financial companion. Analyze this user's spending and give 3 actionable savings tips.

Detected recurring expenses: ${subscriptions.map(s => `${s.description} (~$${s.avg.toFixed(2)}/occurrence, ${s.count}x)`).join('; ')}
Top spending categories this month: ${topCategories.map(([cat, amt]) => `${CATEGORY_LABELS[cat] || cat}: $${amt.toFixed(2)}`).join(', ')}
Total recurring monthly spend: $${totalRecurring.toFixed(2)}

Return 3 specific, actionable, warm savings suggestions. Be concise (15 words max each). Focus on realistic wins.`,
      response_json_schema: {
        type: 'object',
        properties: {
          tips: { type: 'array', items: { type: 'object', properties: { tip: { type: 'string' }, saving_estimate: { type: 'string' }, icon: { type: 'string' } } } }
        }
      }
    });
    setAiTips(result?.tips || []);
    setLoading(false);
  };

  if (transactions.length < 5) return null;

  return (
    <div className="space-y-4">
      {/* Recurring Detection */}
      {subscriptions.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-chart-3" />
            <h3 className="font-semibold text-sm">Detected Recurring Expenses</h3>
            <span className="ml-auto text-xs text-muted-foreground">${totalRecurring.toFixed(2)}/month est.</span>
          </div>
          <div className="space-y-2">
            {subscriptions.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium capitalize">{s.description}</p>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[s.category] || s.category} · {s.count}× recorded</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">${s.avg.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">avg/occurrence</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top categories this month */}
      {topCategories.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-accent-foreground" />
            <h3 className="font-semibold text-sm">Top Spending — {format(new Date(), 'MMMM')}</h3>
          </div>
          <div className="space-y-2">
            {topCategories.map(([cat, amt], i) => {
              const max = topCategories[0][1];
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 flex-shrink-0 capitalize">{CATEGORY_LABELS[cat] || cat}</span>
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(amt / max) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold w-16 text-right">${amt.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Tips */}
      <div className="bg-gradient-to-br from-primary/5 to-card border border-primary/20 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Smira's Savings Tips</h3>
          </div>
          {!aiTips && !loading && (
            <button onClick={generateAiTips} className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Generate
            </button>
          )}
          {aiTips && (
            <button onClick={generateAiTips} className="text-xs text-muted-foreground hover:text-primary transition-colors">
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Analyzing your patterns…
          </div>
        ) : aiTips ? (
          <div className="space-y-2">
            {aiTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 bg-background rounded-xl p-3 border border-border">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-3 h-3 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">{tip.tip}</p>
                  {tip.saving_estimate && <p className="text-xs text-primary font-medium mt-0.5">Est. savings: {tip.saving_estimate}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Smira will analyze your recurring expenses and variable spending to find savings opportunities.</p>
        )}
      </div>
    </div>
  );
}