import React, { useState, useRef } from 'react';
import { Play, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// Deterministic decorative bar heights
const BARS = Array.from({ length: 28 }, (_, i) =>
  Math.max(4, Math.min(28, 8 + Math.abs(Math.sin(i * 0.8)) * 18 + Math.abs(Math.sin(i * 1.9)) * 10))
);

export default function WaveformPlayer({ audioUrl, transcript }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef(null);

  if (!audioUrl) return null;

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div className="bg-secondary/60 border border-border rounded-xl px-3 py-2.5 mt-2 space-y-1.5">
      <div className="flex items-center gap-2.5">
        <button
          onClick={toggle}
          className="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors flex-shrink-0"
        >
          {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
        </button>

        {/* Waveform bars */}
        <div className="flex items-center gap-[2px] flex-1 h-7 overflow-hidden">
          {BARS.map((h, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-full transition-colors duration-150",
                i / BARS.length < progress ? "bg-primary" : "bg-muted-foreground/25"
              )}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      {transcript && (
        <>
          <button
            onClick={() => setShowTranscript(v => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Your words
          </button>
          {showTranscript && (
            <p className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-border italic">
              {transcript}
            </p>
          )}
        </>
      )}

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => {
          if (audioRef.current?.duration) {
            setProgress(audioRef.current.currentTime / audioRef.current.duration);
          }
        }}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        className="hidden"
      />
    </div>
  );
}