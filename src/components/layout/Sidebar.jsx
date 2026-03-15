import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MessageCircle, BookOpen, CheckSquare, Wallet, 
  Heart, Clock, Mail, Menu, X, Target, BarChart2, Map, Users, Shield, Flame, Mic, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/Home', label: 'Home', icon: Home },
  { path: '/Chat', label: 'Talk to Smira', icon: MessageCircle },
  { path: '/Journal', label: 'Journal', icon: BookOpen },
  { path: '/Tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/Finance', label: 'Finance', icon: Wallet },
  { path: '/Memories', label: 'Memories', icon: Heart },
  { path: '/Timeline', label: 'Timeline', icon: Clock },
  { path: '/FutureMessages', label: 'Future Messages', icon: Mail },
  { path: '/Goals', label: 'Goals', icon: Target },
  { path: '/Analytics', label: 'Analytics', icon: BarChart2 },
  { path: '/MemoryMap', label: 'Memory Map', icon: Map },
  { path: '/Collaboration', label: 'Shared Calendar', icon: Users },
  { path: '/LegacyVault', label: 'Legacy Vault', icon: Shield },
  { path: '/Habits', label: 'Daily Habits', icon: Flame },
  { path: '/VoiceMemory', label: 'Voice Memory', icon: Mic },
];

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeIndex = navItems.findIndex(i => i.path === location.pathname);
  const itemRefs = useRef([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });

  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    if (el) {
      setIndicatorStyle({ top: el.offsetTop, height: el.offsetHeight });
    }
  }, [activeIndex]);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-2xl bg-midnight text-white shadow-xl"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 frosted-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300",
        "bg-midnight text-sidebar-foreground",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between border-b border-sidebar-border">
          <Link to="/Home" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="w-10 h-10 rounded-2xl bg-teal/20 flex items-center justify-center">
              <span className="text-lg">✦</span>
            </div>
            <div>
              <h1 className="text-lg font-lora font-medium tracking-wide text-white">Smira</h1>
              <p className="text-xs text-sidebar-foreground/50">Life Companion</p>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-sidebar-foreground/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto relative">
          {/* Sliding indicator */}
          {activeIndex >= 0 && (
            <motion.div
              className="absolute left-3 right-3 rounded-2xl bg-sidebar-accent z-0"
              animate={indicatorStyle}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
          )}
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                ref={el => itemRefs.current[i] = el}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "relative z-10 flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "text-teal"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => base44.auth.logout()}
            className="w-full text-xs text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors text-center py-2 rounded-xl hover:bg-sidebar-accent"
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}