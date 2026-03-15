import React from 'react';
import { Mic } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTalk } from './TalkContext';
import { useLocation } from 'react-router-dom';

const PAGE_CONTEXTS = {
  '/Finance': 'Finance',
  '/Journal': 'Journal',
  '/Goals': 'Goals',
  '/Tasks': 'Tasks',
  '/Memories': 'Memories',
  '/Home': 'Home',
  '/LegacyVault': 'LegacyVault',
};

// Don't show on Chat page (it has its own button)
const HIDDEN_ON = ['/Chat'];

export default function FloatingTalkButton() {
  const { openTalk } = useTalk();
  const location = useLocation();

  if (HIDDEN_ON.includes(location.pathname)) return null;

  const ctx = PAGE_CONTEXTS[location.pathname] || null;

  return (
    <motion.button
      onClick={() => openTalk(ctx)}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
      style={{ background: '#1D9E75', boxShadow: '0 4px 24px #1D9E7540' }}
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.06 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <Mic className="w-6 h-6 text-white" />
    </motion.button>
  );
}