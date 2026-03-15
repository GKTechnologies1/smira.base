import { useEffect, useRef } from 'react';

const PREFERRED_NAMES = ['samantha', 'karen', 'moira', 'neural', 'enhanced', 'natural'];

export function getBestVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  for (const keyword of PREFERRED_NAMES) {
    const match = voices.find(v => v.name.toLowerCase().includes(keyword) && v.lang.startsWith('en'));
    if (match) return match;
  }
  // Fall back to any female-sounding or first English voice
  return voices.find(v => v.lang.startsWith('en')) || voices[0] || null;
}

export function speakText(text, onEnd) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  utter.pitch = 1.05;

  const setVoice = () => {
    const voice = getBestVoice();
    if (voice) utter.voice = voice;
    utter.onend = onEnd || null;
    window.speechSynthesis.speak(utter);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = setVoice;
  } else {
    setVoice();
  }
  return utter;
}

export function stopSpeech() {
  window.speechSynthesis?.cancel();
}