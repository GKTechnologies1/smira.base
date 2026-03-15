import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    const el = containerRef.current;
    if (el && el.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullY(Math.min(delta * 0.45, THRESHOLD + 20));
    }
  };

  const handleTouchEnd = async () => {
    if (pullY >= THRESHOLD) {
      setRefreshing(true);
      setPullY(THRESHOLD);
      await onRefresh?.();
      setRefreshing(false);
    }
    setPullY(0);
    startY.current = null;
  };

  const progress = Math.min(pullY / THRESHOLD, 1);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ overscrollBehavior: 'none' }}
    >
      <AnimatePresence>
        {(pullY > 4 || refreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: progress, y: pullY * 0.3 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex justify-center pt-2 pb-1 pointer-events-none"
          >
            <motion.div
              animate={refreshing ? { rotate: 360 } : { rotate: progress * 180 }}
              transition={refreshing ? { repeat: Infinity, duration: 0.7, ease: 'linear' } : {}}
            >
              <RefreshCw className="w-5 h-5 text-primary" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div style={{ y: pullY > 0 ? pullY * 0.3 : 0 }} transition={{ type: 'spring', stiffness: 300 }}>
        {children}
      </motion.div>
    </div>
  );
}