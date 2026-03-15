import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';
import { TalkProvider } from '../talk/TalkContext';
import TalkOverlay from '../talk/TalkOverlay';
import FloatingTalkButton from '../talk/FloatingTalkButton';

export default function AppLayout() {
  return (
    <TalkProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MobileHeader />
        <main
          className="lg:ml-64 min-h-screen pb-safe"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)',
          }}
        >
          <Outlet />
        </main>
        <BottomNav />
        <FloatingTalkButton />
        <TalkOverlay />
      </div>
    </TalkProvider>
  );
}