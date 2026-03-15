import React, { useEffect, useRef, useState } from 'react';

export default function AnimatedBalance({ value, className }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    if (start === end) return;
    const duration = 600;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(step);
      else prev.current = end;
    };

    requestAnimationFrame(step);
  }, [value]);

  return (
    <span className={className}>
      ${display.toFixed(2)}
    </span>
  );
}