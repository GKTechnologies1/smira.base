import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { getVoiceLang } from './VoiceMicButton';

// Animated waveform bars (CSS animation via inline styles)
const NUM_BARS = 40;

function AnimatedWaveform({ active }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {Array.from({ length: NUM_BARS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 rounded-full transition-all",
            active ? "bg-primary" : "bg-muted-foreground/30"
          )}
          style={{
            height: active ? `${12 + Math.abs(Math.sin(i * 0.5 + Date.now() / 300)) * 40}px` : '8px',
            animation: active ? `waveBar ${0.6 + (i % 5) * 0.1}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${(i * 0.04).toFixed(2)}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          from { height: 8px; }
          to { height: ${active ? 52 : 8}px; }
        }
      `}</style>
    </div>
  );
}

function useTimer(running) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (running) {
      setElapsed(0);
      ref.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running]);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export default function VoiceJournalMode({ onSave, onDiscard }) {
  const [phase, setPhase] = useState('ready'); // ready | recording | processing | done
  const [transcript, setTranscript] = useState('');
  const [entry, setEntry] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const timer = useTimer(phase === 'recording');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const streamRef = useRef(null);

  const startRecording = async () => {
    transcriptRef.current = '';
    chunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
      : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
    const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.start();
    mediaRecorderRef.current = mr;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.lang = getVoiceLang();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) transcriptRef.current += event.results[i][0].transcript + ' ';
        }
      };
      recognition.onerror = () => {};
      recognition.start();
      recognitionRef.current = recognition;
    }

    setPhase('recording');
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = async () => {
      setPhase('processing');
      streamRef.current?.getTracks().forEach(t => t.stop());

      const mimeType = chunksRef.current[0]?.type || 'audio/webm';
      const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const file = new File([blob], `journal_voice.${ext}`, { type: mimeType });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAudioUrl(file_url);

      let tx = transcriptRef.current.trim();
      if (!tx) {
        const r = await base44.integrations.Core.InvokeLLM({
          prompt: 'Transcribe exactly what is spoken. Return only the transcript.',
          file_urls: [file_url],
          model: 'gemini_3_flash',
        });
        tx = typeof r === 'string' ? r.trim() : '';
      }
      setTranscript(tx);

      // Generate structured journal entry from transcript
      const generated = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Smira — a warm, personal life companion. The user has just spoken their thoughts aloud. 
Here is exactly what they said:
"${tx}"

Based on their spoken words, write a structured, heartfelt journal entry for them. 
- Write in the first person, as if it came from the user.
- Add depth and structure but stay true to what they actually said.
- Choose the right mood and entry type.
- Keep it honest and natural — no extra fluff.
Return JSON with: title (string, 5-8 words), content (string, the reflection), mood (one of: joyful, grateful, calm, neutral, stressed, sad, anxious, reflective, motivated, tired), type (one of: daily_reflection, event_reflection, lesson_learned, gratitude, free_write).`,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            mood: { type: 'string' },
            type: { type: 'string' },
          }
        }
      });

      setEntry({ ...generated, voice_url: file_url, voice_transcript: tx });
      setPhase('done');
    };
    mr.stop();
  };

  const handleSave = () => {
    if (entry) onSave(entry);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-md flex flex-col items-center justify-center p-6">
      <button onClick={onDiscard} className="absolute top-5 right-5 text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md text-center space-y-8">
        {/* Phase: ready */}
        {phase === 'ready' && (
          <>
            <div>
              <h2 className="text-2xl font-bold mb-2">Speak your day</h2>
              <p className="text-muted-foreground text-sm">Tap the button and talk freely — Smira will shape it into a reflection for you.</p>
            </div>
            <AnimatedWaveform active={false} />
            <Button onClick={startRecording} size="lg" className="rounded-2xl px-10 gap-2">
              <Mic className="w-5 h-5" /> Start Talking
            </Button>
          </>
        )}

        {/* Phase: recording */}
        {phase === 'recording' && (
          <>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Listening…</p>
              <p className="text-4xl font-mono font-light text-primary">{timer}</p>
            </div>
            <AnimatedWaveform active={true} />
            <Button onClick={stopRecording} variant="destructive" size="lg" className="rounded-2xl px-10 gap-2">
              <Square className="w-4 h-4" fill="currentColor" /> Done
            </Button>
          </>
        )}

        {/* Phase: processing */}
        {phase === 'processing' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <div>
              <p className="font-semibold mb-1">Smira is reflecting…</p>
              <p className="text-sm text-muted-foreground">Turning your words into a journal entry</p>
            </div>
          </>
        )}

        {/* Phase: done */}
        {phase === 'done' && entry && (
          <div className="w-full text-left space-y-4">
            <div className="text-center">
              <Check className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-semibold">Here's your reflection</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3 max-h-64 overflow-y-auto">
              <p className="font-semibold">{entry.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{entry.content}</p>
              {transcript && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer">Your words</summary>
                  <p className="text-xs text-muted-foreground mt-1 italic pl-2 border-l-2 border-border">{transcript}</p>
                </details>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onDiscard} className="flex-1 rounded-xl">Discard</Button>
              <Button onClick={handleSave} className="flex-1 rounded-xl">Save Entry</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}