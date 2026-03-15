import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VoiceRecorder from './VoiceRecorder';

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState('');

  const handleTranscript = (text) => {
    if (text) {
      onSend(text);
    }
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