import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function GreetingCard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const words = `${greeting}, ${firstName}`.split(' ');

  return (
    <div className="relative overflow-hidden rounded-[28px] p-8 text-white"
      style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #0a2f26 100%)' }}>
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #00C9A7, transparent)', transform: 'translate(30%, -30%)' }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #FFB085, transparent)', transform: 'translate(-30%, 30%)' }} />

      <div className="relative z-10">
        <p className="text-xs font-medium text-teal/80 mb-3 tracking-widest uppercase">
          <span className="smira-name">Smira</span>
        </p>
        <h2 className="text-3xl md:text-4xl font-lora font-medium mb-3 word-animate">
          {words.map((word, i) => (
            <span key={i} style={{ animationDelay: `${i * 80}ms` }}>
              {word}{i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </h2>
        <p className="text-sm text-white/60 max-w-md leading-relaxed">
          How are you feeling today? I'm here to help you reflect, plan, and remember what matters most.
        </p>
      </div>
    </div>
  );
}