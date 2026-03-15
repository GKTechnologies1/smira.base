import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VoiceMicButton from '../voice/VoiceMicButton';

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState('');
  const typewriterRef = useRef(null);

  const typewrite = (text) => {
    setMessage('');
    let i = 0;
    clearInterval(typewriterRef.current);
    typewriterRef.current = setInterval(() => {
      i++;
      setMessage(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typewriterRef.current);
        // Auto-send after typewriter
        setTimeout(() => {
          onSend(text.trim());
          setMessage('');
        }, 600);
      }
    }, 40);
  };

  useEffect(() => () => clearInterval(typewriterRef.current), []);

  const handleVoiceResult = (transcript) => {
    if (transcript) typewrite(transcript);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    onSend(message.trim());
    setMessage('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 bg-card border-t border-border">
      <div className="flex-1 relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder="Talk to Smira..."
          className="w-full resize-none rounded-2xl border border-border bg-secondary px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground min-h-[48px] max-h-32"
          rows={1}
          disabled={disabled}
        />
      </div>
      <VoiceMicButton onResult={handleVoiceResult} disabled={disabled} />
      <Button
        type="submit"
        disabled={!message.trim() || disabled}
        className="rounded-2xl h-12 w-12 p-0 flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}