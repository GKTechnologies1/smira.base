import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GreetingCard from '../components/home/GreetingCard';
import QuickActions from '../components/home/QuickActions';
import StatsOverview from '../components/home/StatsOverview';
import RecentActivity from '../components/home/RecentActivity';
import OnThisDay from '../components/home/OnThisDay';
import DailyCheckIn from '../components/home/DailyCheckIn';
import CalendarView from '../components/home/CalendarView';
import SmartReminder from '../components/notifications/SmartReminder';
import AIInsightsDashboard from '../components/home/AIInsightsDashboard';
import LanguagePicker from '../components/voice/LanguagePicker';

const sections = [
  'greeting', 'reminder', 'stats', 'onthisday', 'calendar', 'insights', 'actions', 'activity'
];

export default function Home() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
    staleTime: 60000,
  });
  const { data: journals = [] } = useQuery({
    queryKey: ['journals-all'],
    queryFn: () => base44.entities.JournalEntry.list('-created_date', 200),
    staleTime: 60000,
  });

  return (
    <>
      <DailyCheckIn />
      <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto space-y-6">
        <div className="flex justify-end fade-up fade-up-1">
          <LanguagePicker compact />
        </div>
        <div className="fade-up fade-up-1"><GreetingCard /></div>
        <div className="fade-up fade-up-2"><SmartReminder tasks={tasks} journals={journals} /></div>
        <div className="fade-up fade-up-3"><StatsOverview /></div>
        <div className="fade-up fade-up-4"><OnThisDay /></div>
        <div className="fade-up fade-up-5"><CalendarView /></div>
        <div className="fade-up fade-up-6"><AIInsightsDashboard /></div>
        <div className="fade-up fade-up-7"><QuickActions /></div>
        <div className="fade-up fade-up-8"><RecentActivity /></div>
      </div>
    </>
  );
}