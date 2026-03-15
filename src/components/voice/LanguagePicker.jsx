import React, { useState } from 'react';
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getVoiceLang, setVoiceLang } from './VoiceMicButton';

const LANGUAGES = [
  { value: 'en-US', label: '🇺🇸 English' },
  { value: 'ar-SA', label: '🇸🇦 Arabic' },
  { value: 'es-ES', label: '🇪🇸 Spanish' },
  { value: 'fr-FR', label: '🇫🇷 French' },
  { value: 'hi-IN', label: '🇮🇳 Hindi' },
  { value: 'de-DE', label: '🇩🇪 German' },
  { value: 'pt-BR', label: '🇧🇷 Portuguese' },
  { value: 'zh-CN', label: '🇨🇳 Mandarin' },
  { value: 'ja-JP', label: '🇯🇵 Japanese' },
  { value: 'ta-IN', label: '🇮🇳 Tamil' },
];

export default function LanguagePicker({ compact = false }) {
  const [lang, setLang] = useState(getVoiceLang);

  const handleChange = (val) => {
    setLang(val);
    setVoiceLang(val);
  };

  if (compact) {
    return (
      <Select value={lang} onValueChange={handleChange}>
        <SelectTrigger className="h-8 w-36 rounded-lg text-xs border-border">
          <Globe className="w-3 h-3 mr-1 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value} className="text-xs">{l.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select value={lang} onValueChange={handleChange}>
        <SelectTrigger className="w-44 rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}