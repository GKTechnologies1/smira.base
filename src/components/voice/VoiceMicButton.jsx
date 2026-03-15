import React, { useState, useRef } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

export const LANG_KEY = 'smira_voice_lang';
export const getVoiceLang = () => localStorage.getItem(LANG_KEY) || 'en-US';
export const setVoiceLang = (lang) => localStorage.setItem(LANG_KEY, lang);

/**
 * VoiceMicButton
 * onResult(transcript: string, audioUrl: string) — called when done
 * size: 'sm' | 'md' | 'lg'
 */
export default function VoiceMicButton({ onResult, disabled, size = 'md' }) {
  const [status, setStatus] = useState('idle'); // idle | recording | processing
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
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

    // Web Speech API for live transcript
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const recognition = new SR();
      recognition.lang = getVoiceLang();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcriptRef.current += event.results[i][0].transcript + ' ';
          }
        }
      };
      recognition.onerror = () => {};
      recognition.start();
      recognitionRef.current = recognition;
    }

    setStatus('recording');
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;

    const mr = mediaRecorderRef.current;
    if (!mr) return;

    mr.onstop = async () => {
      setStatus('processing');
      streamRef.current?.getTracks().forEach(t => t.stop());

      const mimeType = chunksRef.current[0]?.type || 'audio/webm';
      const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const file = new File([blob], `voice.${ext}`, { type: mimeType });

      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      let transcript = transcriptRef.current.trim();

      if (!transcript) {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: 'Transcribe the spoken audio exactly as said. Return only the transcription, nothing else.',
          file_urls: [file_url],
          model: 'gemini_3_flash',
        });
        transcript = typeof result === 'string' ? result.trim() : '';
      }

      onResult(transcript, file_url);
      setStatus('idle');
    };

    mr.stop();
  };

  const handleClick = () => {
    if (status === 'idle') startRecording();
    else if (status === 'recording') stopRecording();
  };

  const sizeClass = size === 'lg' ? 'w-14 h-14' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';

  return (
    <div className="relative flex items-center justify-center flex-shrink-0">
      {status === 'recording' && (
        <>
          <span className="absolute inset-0 rounded-full bg-red-400/40 animate-ping" />
          <span className="absolute inset-[-6px] rounded-full bg-red-400/20 animate-ping" style={{ animationDelay: '0.3s' }} />
        </>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || status === 'processing'}
        title={status === 'recording' ? 'Tap to stop' : 'Tap to speak'}
        className={cn(
          "relative z-10 rounded-full flex items-center justify-center transition-all duration-200",
          sizeClass,
          status === 'recording' ? "bg-red-500 text-white shadow-lg shadow-red-300/50" :
          status === 'processing' ? "bg-secondary text-muted-foreground cursor-not-allowed" :
          "bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary"
        )}
      >
        {status === 'processing' ? (
          <Loader2 className={cn(iconSize, "animate-spin")} />
        ) : status === 'recording' ? (
          <Square className={iconSize} fill="currentColor" />
        ) : (
          <Mic className={iconSize} />
        )}
      </button>
    </div>
  );
}