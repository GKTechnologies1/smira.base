import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

const MOODS = [
  { value: 'grateful', emoji: '🙏', label: 'Grateful' },
  { value: 'calm', emoji: '😌', label: 'Calm' },
  { value: 'reflective', emoji: '🤔', label: 'Reflective' },
  { value: 'stressed', emoji: '😰', label: 'Stressed' },
  { value: 'motivated', emoji: '✨', label: 'Excited' },
];

const TODAY_KEY = 'smira_checkin_date';

export default function DailyCheckIn() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState('mood'); // mood | followup | done
  const [selectedMood, setSelectedMood] = useState(null);
  const [followupText, setFollowupText] = useState('');
  const [followupQuestion, setFollowupQuestion] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const lastCheckin = localStorage.getItem(TODAY_KEY);
    const today = new Date().toDateString();
    if (lastCheckin !== today) {
      setVisible(true);
    }
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const handleMoodSelect = async (mood) => {
    setSelectedMood(mood);
    setLoading(true);
    const warmMessages = {
      grateful: "That's beautiful — gratitude is such a powerful way to start the day. What are you most grateful for right now?",
      calm: "Calm is a gift. What's helping you feel at peace today?",
      reflective: "Reflection is how we grow. What's been on your mind lately?",
      stressed: "I hear you — stress is real. What's weighing on you most right now?",
      motivated: "Love that energy! What are you most excited about today?",
    };
    setFollowupQuestion(warmMessages[mood.value]);
    setLoading(false);
    setStep('followup');
  };

  const handleFollowupSubmit = async () => {
    if (!followupText.trim()) { dismiss(); return; }
    setLoading(true);
    await base44.entities.JournalEntry.create({
      title: `${greeting} check-in — feeling ${selectedMood.label}`,
      content: followupText.trim(),
      mood: selectedMood.value,
      type: 'daily_reflection',
      tags: ['daily-checkin'],
    });
    localStorage.setItem(TODAY_KEY, new Date().toDateString());
    setLoading(false);
    setStep('done');
    setTimeout(() => setVisible(false), 2000);
  };

  const dismiss = () => {
    localStorage.setItem(TODAY_KEY, new Date().toDateString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>

        {step === 'mood' && (
          <>
            <h2 className="text-2xl font-bold mb-2">{greeting}, {firstName} 👋</h2>
            <p className="text-muted-foreground mb-8">How are you feeling today?</p>
            <div className="grid grid-cols-5 gap-3 mb-6">
              {MOODS.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodSelect(mood)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <span className="text-2xl group-hover:scale-125 transition-transform">{mood.emoji}</span>
                  <span className="text-xs text-muted-foreground font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
            <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Skip for now
            </button>
          </>
        )}

        {step === 'followup' && (
          <>
            <div className="text-3xl mb-4">{selectedMood?.emoji}</div>
            <p className="text-sm font-medium text-primary mb-1">Smira says:</p>
            <h3 className="text-lg font-semibold mb-6">{followupQuestion}</h3>
            <textarea
              value={followupText}
              onChange={(e) => setFollowupText(e.target.value)}
              placeholder="Write your thoughts here..."
              className="w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-sm resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={dismiss} className="flex-1 rounded-xl">Skip</Button>
              <Button onClick={handleFollowupSubmit} disabled={loading} className="flex-1 rounded-xl">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Start Day ✨'}
              </Button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold mb-2">Beautiful start to the day</h3>
            <p className="text-muted-foreground text-sm">Your check-in has been saved.</p>
          </>
        )}
      </div>
    </div>
  );
}