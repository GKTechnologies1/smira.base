import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, VolumeX, Volume2 } from 'lucide-react';
import { useTalk } from './TalkContext';
import { base44 } from '@/api/base44Client';

const PAGE_GREETINGS = {
  Finance: "Great to hear from you. Want to log an expense, check your balance, or talk through your spending?",
  Journal: "I'm here. How are you feeling right now?",
  Goals: "Let's talk about your goals. Any progress to share, or something you want to work toward?",
  Tasks: "What's on your mind? I can help you capture a task or plan your day.",
  Memories: "This is a good place to be. Any memory you'd like to capture or revisit?",
  Home: "Hello! I'm here. What's on your mind today?",
  default: "Hello! I'm here and listening. What would you like to talk about?"
};

function getGreeting(pageContext) {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const ctx = PAGE_GREETINGS[pageContext] || PAGE_GREETINGS.default;
  return `${timeGreeting}. ${ctx}`;
}

export default function TalkOverlay() {
  const { isOpen, closeTalk, pageContext } = useTalk();
  const [phase, setPhase] = useState('idle'); // idle | listening | processing | speaking
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [smiraReply, setSmiraReply] = useState('');
  const [muted, setMuted] = useState(false);
  const [history, setHistory] = useState([]);
  const [savedItems, setSavedItems] = useState(null);
  const [amplitude, setAmplitude] = useState(1);
  const [conversation, setConversation] = useState(null);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const autoSendTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  // Init conversation when opened
  useEffect(() => {
    if (!isOpen) return;
    setPhase('idle');
    setTranscript('');
    setInterimTranscript('');
    setSmiraReply('');
    setHistory([]);
    setSavedItems(null);

    const initAndGreet = async () => {
      try {
        const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const convo = await base44.agents.createConversation({
          agent_name: 'smira',
          metadata: { name: `Voice · ${today}` },
        });
        setConversation(convo);

        // Greet immediately
        const greeting = getGreeting(pageContext);
        setSmiraReply(greeting);
        setPhase('speaking');
        speakText(greeting, () => setPhase('idle'));
      } catch {
        setPhase('idle');
      }
    };

    initAndGreet();

    return () => {
      stopListening();
      synthRef.current?.cancel();
      clearTimeout(autoSendTimerRef.current);
    };
  }, [isOpen]);

  const speakText = useCallback((text, onEnd) => {
    if (!synthRef.current || muted) { onEnd?.(); return; }
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1.05;
    utt.volume = 1;
    // Prefer a warm female voice
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => /samantha|karen|victoria|female|zira/i.test(v.name)) || voices[0];
    if (preferred) utt.voice = preferred;
    utt.onend = () => onEnd?.();
    synthRef.current.speak(utt);
  }, [muted]);

  const startAmplitudeTracking = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      const data = new Uint8Array(analyserRef.current.frequencyBinCount);
      const tick = () => {
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAmplitude(1 + (avg / 128) * 0.4);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch { /* ignore */ }
  };

  const stopAmplitudeTracking = () => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    setAmplitude(1);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    synthRef.current?.cancel();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (final) setTranscript(t => t + final);
      setInterimTranscript(interim);

      // Auto-send timer — reset on each result
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = setTimeout(() => {
        stopListeningAndSend();
      }, 2500);
    };

    rec.onerror = () => setPhase('idle');
    recognitionRef.current = rec;
    rec.start();
    setPhase('listening');
    startAmplitudeTracking();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    stopAmplitudeTracking();
    clearTimeout(autoSendTimerRef.current);
  };

  const stopListeningAndSend = useCallback(async () => {
    stopListening();
    const text = transcript + interimTranscript;
    if (!text.trim() || !conversation) { setPhase('idle'); return; }

    setTranscript(text.trim());
    setInterimTranscript('');
    setPhase('processing');

    const userMsg = { role: 'user', text: text.trim() };

    try {
      await base44.agents.addMessage(conversation, { role: 'user', content: text.trim() });

      // Poll for reply
      let reply = '';
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 800));
        const updated = await base44.agents.getConversation(conversation.id);
        const msgs = updated.messages || [];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant' && last.content) {
          reply = last.content;
          break;
        }
      }

      if (!reply) reply = "I didn't catch that, try again.";

      setSmiraReply(reply);
      setHistory(h => [...h, userMsg, { role: 'smira', text: reply }].slice(-8));
      setTranscript('');
      setPhase('speaking');
      speakText(reply, () => setPhase('idle'));
    } catch {
      setPhase('idle');
    }
  }, [transcript, interimTranscript, conversation, speakText]);

  const handleGoButton = () => {
    if (phase === 'listening') {
      stopListeningAndSend();
    } else if (phase === 'idle') {
      setTranscript('');
      setInterimTranscript('');
      startListening();
    }
  };

  const handleClose = () => {
    stopListening();
    synthRef.current?.cancel();
    clearTimeout(autoSendTimerRef.current);
    closeTalk();
  };

  // Breathing circle scale
  const isListening = phase === 'listening';
  const isSpeaking = phase === 'speaking';
  const circleColor = isSpeaking ? '#FFB085' : '#1D9E75';
  const circleScale = isListening ? amplitude : 1;

  const recentHistory = history.slice(-4);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Full-screen panel */}
          <motion.div
            className="fixed inset-0 z-[91] flex flex-col items-center"
            style={{ background: '#0D1B2A' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          >
            {/* Top bar */}
            <div className="w-full flex items-center justify-between px-6 pt-12 pb-4">
              <button
                onClick={() => setMuted(m => !m)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <div className="text-center">
                <h1 className="font-lora text-white text-[22px] font-medium tracking-wide">Smira</h1>
                <motion.div
                  className="w-1.5 h-1.5 rounded-full mx-auto mt-1"
                  style={{ background: '#1D9E75' }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Circle */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 w-full">
              <motion.div
                className="rounded-full"
                style={{
                  width: 160,
                  height: 160,
                  background: `radial-gradient(circle at 40% 35%, ${circleColor}33, ${circleColor}11)`,
                  border: `2px solid ${circleColor}44`,
                  boxShadow: `0 0 40px ${circleColor}22`,
                }}
                animate={{
                  scale: isListening
                    ? [circleScale, circleScale * 1.05, circleScale]
                    : isSpeaking
                    ? [1, 1.04, 1]
                    : [1, 1.08, 1],
                }}
                transition={{
                  duration: isListening ? 0.3 : isSpeaking ? 1.2 : 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-4xl opacity-60">✦</span>
                </div>
              </motion.div>

              {/* Transcript */}
              <div className="min-h-[60px] text-center w-full max-w-sm">
                {(transcript || interimTranscript) ? (
                  <p className="text-[17px] leading-relaxed" style={{ color: '#F8F4EE' }}>
                    <span className="opacity-100">{transcript}</span>
                    <span className="opacity-50">{interimTranscript}</span>
                  </p>
                ) : phase === 'processing' ? (
                  <motion.div
                    className="flex gap-1 justify-center"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: '#1D9E75' }}
                        animate={{ y: [0, -5, 0] }}
                        transition={{ delay: i * 0.15, duration: 0.6, repeat: Infinity }}
                      />
                    ))}
                  </motion.div>
                ) : null}
              </div>

              {/* Smira reply */}
              {smiraReply && phase !== 'listening' && (
                <AnimatePresence mode="wait">
                  <motion.p
                    key={smiraReply}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[15px] leading-relaxed text-center max-w-sm"
                    style={{ color: '#1D9E75' }}
                  >
                    {smiraReply}
                  </motion.p>
                </AnimatePresence>
              )}
            </div>

            {/* GO button */}
            <div className="flex flex-col items-center gap-6 pb-12 w-full">
              <motion.button
                onClick={handleGoButton}
                disabled={phase === 'processing' || phase === 'speaking'}
                className="w-[72px] h-[72px] rounded-full flex items-center justify-center disabled:opacity-40"
                style={{
                  background: isListening
                    ? 'linear-gradient(135deg, #1D9E75, #00C9A7)'
                    : '#1D9E75',
                  boxShadow: isListening
                    ? '0 0 0 8px #1D9E7530, 0 0 0 16px #1D9E7515'
                    : '0 4px 24px #1D9E7540',
                }}
                whileTap={{ scale: 0.92 }}
                animate={isListening ? { boxShadow: ['0 0 0 8px #1D9E7530, 0 0 0 16px #1D9E7515', '0 0 0 14px #1D9E7520, 0 0 0 24px #1D9E7508', '0 0 0 8px #1D9E7530, 0 0 0 16px #1D9E7515'] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {isListening
                  ? <MicOff className="w-7 h-7 text-white" />
                  : <Mic className="w-7 h-7 text-white" />
                }
              </motion.button>

              {/* Recent history */}
              {recentHistory.length > 0 && (
                <div className="w-full max-w-sm px-6 space-y-1 max-h-28 overflow-y-auto">
                  {recentHistory.map((item, i) => (
                    <p
                      key={i}
                      className="text-xs leading-relaxed"
                      style={{
                        color: item.role === 'smira' ? '#1D9E75' : '#F8F4EE',
                        opacity: 0.35 + (i / recentHistory.length) * 0.3,
                      }}
                    >
                      {item.role === 'smira' ? '✦ ' : '→ '}{item.text}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}