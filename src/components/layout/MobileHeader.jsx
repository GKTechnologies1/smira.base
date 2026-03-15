import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_TITLES = {
  '/Home': null, // shown via GreetingCard
  '/Chat': 'Talk to Smira',
  '/Journal': 'Journal',
  '/Tasks': 'Tasks',
  '/Finance': 'Finance',
  '/Memories': 'Memories',
  '/Goals': 'Goals',
  '/Analytics': 'Analytics',
  '/Timeline': 'Timeline',
  '/FutureMessages': 'Future Messages',
  '/MemoryMap': 'Memory Map',
  '/Collaboration': 'Shared Calendar',
  '/LegacyVault': 'Legacy Vault',
  '/Habits': 'Daily Habits',
  '/VoiceMemory': 'Voice Memory',
  '/People': 'People',
};

const BOTTOM_NAV_PATHS = ['/', '/Home', '/Chat', '/Journal', '/Finance'];

export default function MobileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = PAGE_TITLES[location.pathname];
  const isChildRoute = !BOTTOM_NAV_PATHS.includes(location.pathname);

  if (!title) return null;

  return (
    <div
      className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center px-4 bg-background/90 backdrop-blur-md border-b border-border"
      style={{ height: 52, paddingTop: 'env(safe-area-inset-top)' }}
    >
      {isChildRoute && (
        <button
          onClick={() => navigate(-1)}
          className="mr-3 p-1 rounded-full text-muted-foreground hover:text-foreground select-none"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="font-lora text-base font-medium">{title}</h1>
    </div>
  );
}