import React from 'react';
import GreetingCard from '../components/home/GreetingCard';
import QuickActions from '../components/home/QuickActions';
import StatsOverview from '../components/home/StatsOverview';
import RecentActivity from '../components/home/RecentActivity';

export default function Home() {
  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto space-y-8">
      <GreetingCard />
      <StatsOverview />
      <QuickActions />
      <RecentActivity />
    </div>
  );
}