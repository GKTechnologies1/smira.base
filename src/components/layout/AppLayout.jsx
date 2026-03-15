import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { TalkProvider } from '../talk/TalkContext';
import TalkOverlay from '../talk/TalkOverlay';
import FloatingTalkButton from '../talk/FloatingTalkButton';

export default function AppLayout() {
  return (
    <TalkProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="lg:ml-64 min-h-screen">
          <Outlet />
        </main>
        <FloatingTalkButton />
        <TalkOverlay />
      </div>
    </TalkProvider>
  );
}