import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

export default function VoiceRecorder({ onTranscript, disabled }) {
  const [status, setStatus] = useState('idle'); // idle | recording | transcribing
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      setStatus('transcribing');

      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const file = new File([blob], 'voice.webm', { type: 'audio/webm' });

      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: 'Transcribe the spoken audio in this file. Return only the transcription text, nothing else.',
        file_urls: [file_url],
        model: 'gemini_3_flash',
      });

      onTranscript(typeof result === 'string' ? result.trim() : '');
      setStatus('idle');
    };

    mediaRecorder.start();
    setStatus('recording');
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleClick = () => {
    if (status === 'idle') startRecording();
    else if (status === 'recording') stopRecording();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || status === 'transcribing'}
      title={status === 'recording' ? 'Stop recording' : 'Record voice message'}
      className={cn(
        "rounded-2xl h-12 w-12 flex items-center justify-center flex-shrink-0 transition-all",
        status === 'recording'
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : status === 'transcribing'
          ? "bg-secondary text-muted-foreground cursor-not-allowed"
          : "bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary"
      )}
    >
      {status === 'transcribing' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : status === 'recording' ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
}