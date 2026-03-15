import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Zap, Loader2, ChevronRight, Battery, Brain, Clock } from 'lucide-react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { cn } from '@/lib/utils';

const ENERGY_KEY = 'smira_energy_profile';

function getEnergyLevel() {
  const hour = new Date().getHours();
  // Log current hour to build profile
  const profile = JSON.parse(localStorage.getItem(ENERGY_KEY) || '{}');
  const completedByHour = profile.completedByHour || {};
  const maxHour = Object.entries(completedByHour).sort((a, b) => b[1] - a[1])[0]?.[0];
  
  if (maxHour === null || maxHour === undefined) {
    // Default heuristic
    if (hour >= 8 && hour <= 11) return { level: 'peak', label: 'Peak Energy', color: 'text-green-600', bg: 'bg-green-50', icon: Zap };
    if (hour >= 14 && hour <= 16) return { level: 'moderate', label: 'Good Focus', color: 'text-amber-600', bg: 'bg-amber-50', icon: Brain };
    if (hour >= 20 || hour <= 6) return { level: 'low', label: 'Wind Down', color: 'text-blue-500', bg: 'bg-blue-50', icon: Clock };
    return { level: 'moderate', label: 'Steady Pace', color: 'text-amber-600', bg: 'bg-amber-50', icon: Brain };
  }
  
  const diff = Math.abs(hour - parseInt(maxHour));
  if (diff <= 1) return { level: 'peak', label: 'Peak Energy', color: 'text-green-600', bg: 'bg-green-50', icon: Zap };
  if (diff <= 3) return { level: 'moderate', label: 'Good Focus', color: 'text-amber-600', bg: 'bg-amber-50', icon: Brain };
  return { level: 'low', label: 'Low Energy', color: 'text-blue-500', bg: 'bg-blue-50', icon: Clock };
}

export function logTaskCompletion() {
  const hour = new Date().getHours();
  const profile = JSON.parse(localStorage.getItem(ENERGY_KEY) || '{}');
  const completedByHour = profile.completedByHour || {};
  completedByHour[hour] = (completedByHour[hour] || 0) + 1;
  localStorage.setItem(ENERGY_KEY, JSON.stringify({ completedByHour }));
}

export default function SmartTaskPanel({ tasks = [], journals = [] }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const energy = getEnergyLevel();
  const EnergyIcon = energy.icon;

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');

  useEffect(() => {
    if (activeTasks.length === 0) return;
    generateInsights();
  }, [tasks.length, journals.length]);

  const generateInsights = async () => {
    setLoading(true);
    const recentMoods = journals.slice(0, 7).map(j => j.mood).filter(Boolean);
    const overdueTasks = activeTasks.filter(t => t.due_date && differenceInDays(new Date(), parseISO(t.due_date)) > 0);
    const urgentTasks = activeTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
    const topTasks = activeTasks.slice(0, 10).map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      category: t.category,
      due_date: t.due_date,
      overdue: t.due_date ? differenceInDays(new Date(), parseISO(t.due_date)) > 0 : false,
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Smira, a warm and intuitive life companion. Based on the user's data, pick the top 3 tasks for today and give a brief, warm reason for each.

Current energy level: ${energy.label} (hour: ${new Date().getHours()})
Recent moods (last 7 days): ${recentMoods.join(', ') || 'unknown'}
Overdue tasks count: ${overdueTasks.length}
High/urgent tasks: ${urgentTasks.length}

Tasks to consider:
${topTasks.map(t => `- [${t.priority}] "${t.title}" (${t.category})${t.overdue ? ' ⚠️ OVERDUE' : ''}${t.due_date ? ` due ${t.due_date}` : ''}`).join('\n')}

Return EXACTLY 3 task recommendations. For each, include the exact task title, a nudge message (15 words max, personal and motivating), and an energy match ("high", "medium", or "low" energy task).`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                nudge: { type: 'string' },
                energy_match: { type: 'string' },
              }
            }
          }
        }
      }
    });
    setInsights(result);
    setLoading(false);
  };

  if (activeTasks.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-primary/5 via-card to-card border border-primary/20 rounded-2xl overflow-hidden mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold">Smira's Focus for Today</p>
            <p className="text-xs text-muted-foreground">Your focus plan for today</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium", energy.bg, energy.color)}>
            <EnergyIcon className="w-3 h-3" />
            {energy.label}
          </div>
          <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Smira is analyzing your tasks and energy…
            </div>
          ) : insights ? (
            <>
              {insights.summary && (
                <p className="text-xs text-muted-foreground italic mb-3 border-l-2 border-primary/30 pl-3">{insights.summary}</p>
              )}
              <div className="space-y-2">
                {insights.tasks?.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-background rounded-xl p-3 border border-border">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.nudge}</p>
                    </div>
                    <div className={cn(
                      "text-xs px-2 py-0.5 rounded-md flex-shrink-0 font-medium",
                      item.energy_match === 'high' ? 'bg-red-50 text-red-600' :
                      item.energy_match === 'medium' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'
                    )}>
                      {item.energy_match}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground py-2">Smira is thinking about your day…</p>
          )}
        </div>
      )}
    </div>
  );
}