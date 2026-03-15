import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MessageCircle, BookOpen, CheckSquare, Wallet, 
  Heart, Clock, Mail, Menu, X, Sparkles, Target, BarChart2, Map, Users, Shield, Flame, Mic
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const navItems = [
  { path: '/Home', label: 'Home', icon: Sparkles },
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
];

export default function Sidebar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card shadow-lg border border-border"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 flex flex-col transition-transform duration-300",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <Link to="/Home" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Smira</h1>
              <p className="text-xs text-muted-foreground">Life Companion</p>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-2"
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}