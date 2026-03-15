import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Loader2, CheckCircle2, Sparkles, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_MAP = {
  life_lesson: 'Life Lesson', family_story: 'Family Story', milestone: 'Milestone',
  travel: 'Travel', achievement: 'Achievement', relationship: 'Relationship',
  wisdom: 'Wisdom', funny_moment: 'Funny Moment', tradition: 'Tradition', other: 'Other'
};

export default function VoiceMemory() {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const queryClient = useQueryClient();

  const saveMemory = useMutation({
    mutationFn: (data) => base44.entities.Memory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setSaved(true);
    },
  });

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    chunksRef.current = [];
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = handleStop;
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  };

  const handleStop = async () => {
    setProcessing(true);
    setResult(null);
    setSaved(false);
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const file = new File([blob], 'voice_memory.webm', { type: 'audio/webm' });

    // Upload audio
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Transcribe + analyze with LLM
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Smira. The user has recorded a voice memory. Please listen carefully and:
1. Transcribe what they said.
2. Create a short, meaningful title (5-8 words).
3. Write a clean, summary version of the memory (1-3 sentences, natural language).
4. Choose the best category from: life_lesson, family_story, milestone, travel, achievement, relationship, wisdom, funny_moment, tradition, other.
5. Extract any people's names mentioned.
6. Decide if this belongs in the Legacy Vault (is it particularly precious/sentimental?).

Return JSON with: transcript (string), title (string), summary (string), category (string), people_involved (array of strings), is_in_vault (boolean).`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          transcript: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string' },
          category: { type: 'string' },
          people_involved: { type: 'array', items: { type: 'string' } },
          is_in_vault: { type: 'boolean' }
        }
      }
    });

    setResult({ ...analysis, media_urls: [file_url] });
    setProcessing(false);
  };

  const handleSave = () => {
    saveMemory.mutate({
      title: result.title,
      content: result.summary,
      category: result.category || 'other',
      people_involved: result.people_involved || [],
      is_in_vault: result.is_in_vault || false,
      media_urls: result.media_urls,
    });
  };

  const reset = () => { setResult(null); setSaved(false); setRecording(false); setProcessing(false); };

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Voice Memory</h1>
        <p className="text-sm text-muted-foreground mt-1">Speak your memories — Smira will transcribe and preserve them</p>
      </div>

      {/* Recording area */}
      <div className="bg-card border border-border rounded-3xl p-8 text-center mb-6">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300",
          recording ? "bg-red-100 animate-pulse shadow-lg shadow-red-200" : "bg-primary/10"
        )}>
          {recording ? (
            <MicOff className="w-10 h-10 text-red-500" />
          ) : (
            <Mic className="w-10 h-10 text-primary" />
          )}
        </div>

        {processing ? (
          <div className="space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Smira is listening and transcribing...</p>
          </div>
        ) : recording ? (
          <div className="space-y-3">
            <p className="font-semibold text-red-500">Recording...</p>
            <p className="text-sm text-muted-foreground">Speak your memory. Press stop when done.</p>
            <Button onClick={stopRecording} variant="destructive" className="rounded-xl px-8">Stop Recording</Button>
          </div>
        ) : saved ? (
          <div className="space-y-3">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
            <p className="font-semibold">Memory saved!</p>
            <Button onClick={reset} variant="outline" className="rounded-xl">Record Another</Button>
          </div>
        ) : result ? null : (
          <div className="space-y-3">
            <p className="font-semibold">Ready to listen</p>
            <p className="text-sm text-muted-foreground">Press the button and speak your memory naturally</p>
            <Button onClick={startRecording} className="rounded-xl px-8"><Mic className="w-4 h-4 mr-2" /> Start Recording</Button>
          </div>
        )}
      </div>

      {/* Result preview */}
      {result && !saved && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="font-semibold text-sm">Smira's Analysis</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Title</p>
            <p className="font-medium">{result.title}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Summary</p>
            <p className="text-sm">{result.summary}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Transcript</p>
            <p className="text-sm text-muted-foreground italic">"{result.transcript}"</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-lg">{CATEGORY_MAP[result.category] || result.category}</Badge>
            {result.people_involved?.map(p => <Badge key={p} variant="secondary" className="rounded-lg">{p}</Badge>)}
            {result.is_in_vault && (
              <Badge className="rounded-lg gap-1 bg-primary/10 text-primary border-primary/20">
                <Shield className="w-3 h-3" /> Legacy Vault
              </Badge>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={reset} className="rounded-xl flex-1">Discard</Button>
            <Button onClick={handleSave} disabled={saveMemory.isPending} className="rounded-xl flex-1">
              {saveMemory.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : 'Save Memory'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}