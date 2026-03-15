import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function GreetingCard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary p-8 text-primary-foreground">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 opacity-80" />
          <span className="text-sm font-medium opacity-80">Smira</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          {greeting}, {firstName}
        </h2>
        <p className="text-sm opacity-80 max-w-md">
          How are you feeling today? I'm here to help you plan, reflect, and remember what matters most.
        </p>
      </div>
    </div>
  );
}