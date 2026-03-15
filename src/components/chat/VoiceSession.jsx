import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Globe, Send, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'ar', label: 'Arabic' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'de-DE', label: 'German' },
  { code: 'pt-BR', label: 'Portuguese' },
  { code: 'zh-CN', label: 'Mandarin' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'ru-RU', label: 'Russian' },
];

const PAUSE_MS = 2500;

export default function VoiceSession({ onSend, disabled, muteVoice }) {
  const [isRecording, setIsRecording] = useState(false);
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('smira_voice_lang') || navigator.language || 'en-US';
  });

  const recognitionRef = useRef(null);
  const pauseTimerRef = useRef(null);
  const isSendingRef = useRef(false);

  const resetTranscript = () => {
    setFinalText('');
    setInterimText('');
    setEditMode(false);
    setEditValue('');
  };

  const triggerSend = useCallback((text) => {
    const trimmed = text?.trim();
    if (!trimmed || isSendingRef.current) return;
    isSendingRef.current = true;
    setIsRecording(false);
    stopRecognition();
    onSend(trimmed, true); // second arg = isVoice
    resetTranscript();
    setTimeout(() => { isSendingRef.current = false; }, 1000);
  }, [onSend]);

  const stopRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    clearTimeout(pauseTimerRef.current);
  };

  const startRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    isSendingRef.current = false;
    resetTranscript();

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (e) => {
      if (editMode) return;
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (final) {
        setFinalText(prev => prev + final);
        setInterimText('');
      } else {
        setInterimText(interim);
      }
      // Reset pause timer on any speech
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        setFinalText(prev => {
          const combined = (prev + ' ' + interim).trim();
          if (combined) triggerSend(combined);
          return prev;
        });
      }, PAUSE_MS);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      // restart if still recording (continuous mode stops on silence sometimes)
      if (isRecording && !isSendingRef.current) {
        try { recognition.start(); } catch (_) {}
      }
    };

    recognition.start();
    setIsRecording(true);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecognition();
      setIsRecording(false);
    } else {
      startRecognition();
    }
  };

  const selectLang = (code) => {
    setLang(code);
    localStorage.setItem('smira_voice_lang', code);
    setShowLangPicker(false);
    if (isRecording) {
      stopRecognition();
      setTimeout(startRecognition, 100);
    }
  };

  const enterEditMode = () => {
    clearTimeout(pauseTimerRef.current);
    setEditMode(true);
    setEditValue((finalText + ' ' + interimText).trim());
    stopRecognition();
    setIsRecording(false);
    setInterimText('');
  };

  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, []);

  const displayText = (finalText + (interimText ? ' ' + interimText : '')).trim();

  return (
    <div className="flex flex-col gap-3">
      {/* Live transcript card */}
      <AnimatePresence>
        {(isRecording || displayText || editMode) && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative bg-card rounded-[20px] border border-border shadow-sm overflow-hidden"
          >
            {/* Language picker button */}
            <button
              onClick={() => setShowLangPicker(v => !v)}
              className="absolute top-3 right-3 p-1.5 rounded-xl hover:bg-secondary transition-colors z-10"
            >
              <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {/* Language picker dropdown */}
            <AnimatePresence>
              {showLangPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-10 right-3 z-20 bg-card border border-border rounded-2xl shadow-xl overflow-hidden w-44"
                >
                  {LANGUAGES.map(l => (
                    <button
                      key={l.code}
                      onClick={() => selectLang(l.code)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-secondary",
                        lang === l.code ? "text-teal font-medium" : "text-foreground"
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="px-4 pt-4 pb-3 min-h-[56px] cursor-text" onClick={!editMode ? enterEditMode : undefined}>
              {editMode ? (
                <textarea
                  autoFocus
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  className="w-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none text-foreground"
                  rows={3}
                />
              ) : (
                <p className="text-sm leading-relaxed pr-6">
                  <span className="text-foreground">{finalText}</span>
                  {finalText && interimText ? ' ' : ''}
                  <span className="text-foreground/50">{interimText}</span>
                  {isRecording && (
                    <span className="inline-block w-0.5 h-4 bg-teal ml-0.5 align-middle animate-pulse" />
                  )}
                </p>
              )}
            </div>

            {/* Equalizer */}
            {isRecording && !editMode && (
              <div className="flex items-end gap-0.5 px-4 pb-3 h-7">
                {[0.6, 1, 0.75, 0.45, 0.9, 0.55, 0.8].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-teal"
                    animate={{ scaleY: [h, h * 0.4 + 0.1, h] }}
                    transition={{ duration: 0.6 + i * 0.07, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
                    style={{ height: 16, transformOrigin: 'bottom' }}
                  />
                ))}
              </div>
            )}

            {/* Edit mode send */}
            {editMode && (
              <div className="flex justify-end px-4 pb-3">
                <button
                  onClick={() => triggerSend(editValue)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-midnight text-white text-xs font-medium hover:bg-midnight/80 transition-colors"
                >
                  <Send className="w-3 h-3" /> Send
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic button */}
      <button
        onClick={toggleRecording}
        disabled={disabled}
        className={cn(
          "h-12 w-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0",
          isRecording
            ? "bg-teal text-white shadow-lg shadow-teal/30"
            : "bg-secondary text-muted-foreground hover:bg-secondary/70"
        )}
      >
        {isRecording ? <Mic className="w-5 h-5" /> : <MicOff className="w-4 h-4" />}
      </button>
    </div>
  );
}