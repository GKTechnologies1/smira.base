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
      <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto space-y-8">
        <GreetingCard />
        <SmartReminder tasks={tasks} journals={journals} />
        <StatsOverview />
        <OnThisDay />
        <CalendarView />
        <AIInsightsDashboard />
        <QuickActions />
        <RecentActivity />
      </div>
    </>
  );
}