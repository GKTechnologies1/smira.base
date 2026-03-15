import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, X, CheckSquare, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const ACTIVITY_KEY = 'smira_activity_log';
const DISMISSED_KEY = 'smira_reminder_dismissed';

function logActivity() {
  const now = new Date();
  const hour = now.getHours();
  const log = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
  log.push({ hour, ts: now.toISOString() });
  // keep last 30 entries
  if (log.length > 30) log.shift();
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(log));
}

function getOptimalHour() {
  const log = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '[]');
  if (log.length < 3) return null;
  const freq = {};
  log.forEach(({ hour }) => { freq[hour] = (freq[hour] || 0) + 1; });
  return parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
}

function isOptimalTime() {
  const optimal = getOptimalHour();
  if (optimal === null) return true; // not enough data, always show
  const now = new Date().getHours();
  return Math.abs(now - optimal) <= 1;
}

export default function SmartReminder({ tasks = [], journals = [] }) {
  const [reminder, setReminder] = useState(null);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    logActivity();

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => setNotifGranted(p === 'granted'));
    } else {
      setNotifGranted(Notification.permission === 'granted');
    }

    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt && new Date().toDateString() === new Date(dismissedAt).toDateString()) return;

    // Determine reminder type
    const overdueTasks = tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.due_date) return false;
      return differenceInDays(new Date(), parseISO(t.due_date)) > 0;
    });

    const todayCheckin = journals.some(j =>
      j.tags?.includes('daily-checkin') &&
      new Date(j.created_date).toDateString() === new Date().toDateString()
    );

    if (!todayCheckin && isOptimalTime()) {
      setReminder({ type: 'checkin' });
    } else if (overdueTasks.length > 0 && isOptimalTime()) {
      setReminder({ type: 'overdue', count: overdueTasks.length });
    }
  }, [tasks.length, journals.length]);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
    setReminder(null);
  };

  // Also fire a browser notification if permission granted and it's optimal time
  useEffect(() => {
    if (!notifGranted || !reminder) return;
    const lastNotif = localStorage.getItem('smira_last_notif');
    if (lastNotif && new Date().toDateString() === new Date(lastNotif).toDateString()) return;
    const msg = reminder.type === 'checkin'
      ? "How are you feeling today? Don't forget your daily check-in ✨"
      : `You have ${reminder.count} overdue task${reminder.count > 1 ? 's' : ''} waiting for you 📋`;
    new Notification('Smira', { body: msg, icon: '/favicon.ico' });
    localStorage.setItem('smira_last_notif', new Date().toISOString());
  }, [notifGranted, reminder]);

  if (!reminder) return null;

  return (
    <div className={cn(
      "flex items-start gap-3 rounded-2xl border p-4 mb-2",
      reminder.type === 'checkin'
        ? "bg-primary/5 border-primary/20"
        : "bg-accent/10 border-accent/30"
    )}>
      <div className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
        reminder.type === 'checkin' ? "bg-primary/10" : "bg-accent/20"
      )}>
        {reminder.type === 'checkin'
          ? <BookOpen className="w-4 h-4 text-primary" />
          : <CheckSquare className="w-4 h-4 text-accent-foreground" />}
      </div>
      <div className="flex-1">
        {reminder.type === 'checkin' ? (
          <>
            <p className="text-sm font-medium">Time for your daily check-in ✨</p>
            <p className="text-xs text-muted-foreground mt-0.5">Smira is ready to listen. How's your day going?</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">{reminder.count} overdue task{reminder.count > 1 ? 's' : ''} need attention</p>
            <p className="text-xs text-muted-foreground mt-0.5">Take a few minutes to catch up on your list.</p>
          </>
        )}
        <Link
          to={reminder.type === 'checkin' ? '/Journal' : '/Tasks'}
          className="text-xs font-semibold text-primary hover:underline mt-1.5 block"
          onClick={dismiss}
        >
          {reminder.type === 'checkin' ? 'Start check-in →' : 'View tasks →'}
        </Link>
      </div>
      <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}