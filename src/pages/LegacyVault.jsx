import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Unlock, Plus, Heart, Mail, Trash2, Eye, EyeOff, Star, ChevronDown, ChevronUp } from 'lucide-react';
import VoiceMicButton from '../components/voice/VoiceMicButton';
import WaveformPlayer from '../components/voice/WaveformPlayer';
import { format, parseISO, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const VAULT_PIN_KEY = 'smira_vault_pin';

function getStoredPin() { return localStorage.getItem(VAULT_PIN_KEY); }
function setStoredPin(pin) { localStorage.setItem(VAULT_PIN_KEY, pin); }

function MemoryCard({ m, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card rounded-[20px] transition-all group relative vault-glow" style={{ border: '1px solid hsl(var(--border) / 0.5)' }}>
      <button
        className="w-full text-left p-5"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-2 mb-2">
          <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm pr-8">{m.title}</h3>
            <AnimatePresence initial={false}>
              {!expanded && (
                <motion.p
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground line-clamp-2 mt-1"
                >
                  {m.content}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-6 flex-wrap">
          <Badge variant="outline" className="text-xs rounded-lg">{m.category?.replace('_', ' ')}</Badge>
          {m.date_of_memory && <span className="text-xs text-muted-foreground">{format(parseISO(m.date_of_memory), 'MMM d, yyyy')}</span>}
          {m.people_involved?.length > 0 && <span className="text-xs text-muted-foreground">with {m.people_involved.join(', ')}</span>}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 ml-6">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{m.content}</p>
              {m.location_name && (
                <p className="text-xs text-muted-foreground mt-3">📍 {m.location_name}</p>
              )}
              {m.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {m.tags.map(tag => (
                    <span key={tag} className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onDelete(m.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function MessageCard({ m, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card rounded-[20px] transition-all group relative vault-glow" style={{ border: '1px solid hsl(var(--border) / 0.5)' }}>
      <button
        className="w-full text-left p-5"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-2 mb-2">
          <Mail className="w-4 h-4 text-chart-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm pr-6">{m.title || `To ${m.recipient_name}`}</p>
            <p className="text-xs text-muted-foreground">For {m.recipient_name} · {m.recipient_relationship}</p>
            <AnimatePresence initial={false}>
              {!expanded && (
                <motion.p
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-muted-foreground line-clamp-2 mt-1"
                >
                  {m.content}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-shrink-0 text-muted-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
        <div className="ml-6 flex items-center gap-2 flex-wrap">
          {m.delivery_date && (
            <div className="flex items-center gap-1.5 bg-chart-3/10 text-chart-3 px-2.5 py-1 rounded-lg text-xs font-medium">
              <Lock className="w-3 h-3" />
              Opens {format(parseISO(m.delivery_date), 'MMM d, yyyy')}
            </div>
          )}
          <Badge variant="outline" className="text-xs rounded-lg">{m.emotional_tone}</Badge>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 ml-6">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap font-lora italic">{m.content}</p>
              {m.occasion && (
                <p className="text-xs text-muted-foreground mt-3">Occasion: {m.occasion.replace('_', ' ')}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-3 right-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onDelete(m.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function LegacyVault() {
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [settingPin, setSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('memory');
  const [showPin, setShowPin] = useState(false);
  const [activeTab, setActiveTab] = useState('memories');
  const queryClient = useQueryClient();

  const hasPin = !!getStoredPin();

  useEffect(() => {
    if (!hasPin) { setSettingPin(true); }
  }, []);

  const { data: memories = [] } = useQuery({
    queryKey: ['vault-memories'],
    queryFn: () => base44.entities.Memory.filter({ is_in_vault: true }),
    enabled: unlocked,
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['vault-messages'],
    queryFn: () => base44.entities.FutureMessage.list('-created_date', 50),
    enabled: unlocked,
  });

  const [memForm, setMemForm] = useState({ title: '', content: '', category: 'milestone', date_of_memory: '', is_in_vault: true, voice_transcript: '', voice_url: '' });
  const [msgForm, setMsgForm] = useState({ title: '', content: '', recipient_name: '', recipient_relationship: 'child', delivery_date: '', emotional_tone: 'loving', status: 'scheduled', voice_transcript: '', voice_url: '' });

  const saveMemMutation = useMutation({
    mutationFn: (d) => base44.entities.Memory.create({ ...d, is_in_vault: true }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vault-memories'] }); setShowForm(false); },
  });
  const saveMsgMutation = useMutation({
    mutationFn: (d) => base44.entities.FutureMessage.create(d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vault-messages'] }); setShowForm(false); },
  });
  const deleteMemMutation = useMutation({
    mutationFn: (id) => base44.entities.Memory.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vault-memories'] }),
  });
  const deleteMsgMutation = useMutation({
    mutationFn: (id) => base44.entities.FutureMessage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vault-messages'] }),
  });

  const handleSetPin = () => {
    if (pinInput.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
    if (pinInput !== confirmPin) { setPinError('PINs do not match'); return; }
    setStoredPin(pinInput);
    setSettingPin(false);
    setUnlocked(true);
    setPinInput('');
    setConfirmPin('');
    setPinError('');
  };

  const handleUnlock = () => {
    if (pinInput === getStoredPin()) {
      setUnlocked(true);
      setPinError('');
      setPinInput('');
    } else {
      setPinError('Incorrect PIN. Try again.');
    }
  };

  const scheduledMessages = messages.filter(m => m.delivery_date && isFuture(parseISO(m.delivery_date)));

  if (settingPin) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-lora font-medium mb-1">Protect your Vault</h2>
        <p className="text-sm text-muted-foreground mb-6">Choose a PIN. It stays on your device and is only known to you.</p>
        <div className="space-y-3">
          <div className="relative">
            <Input type={showPin ? 'text' : 'password'} placeholder="Choose a PIN (min 4 digits)" value={pinInput} onChange={e => setPinInput(e.target.value)} className="rounded-xl text-center text-lg tracking-widest pr-10" maxLength={8} />
            <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-2.5 text-muted-foreground"><EyeOff className="w-4 h-4" /></button>
          </div>
          <Input type="password" placeholder="Confirm PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} className="rounded-xl text-center text-lg tracking-widest" maxLength={8} />
          {pinError && <p className="text-xs text-destructive">{pinError}</p>}
          <Button onClick={handleSetPin} className="w-full rounded-xl">Create Vault</Button>
        </div>
      </div>
    </div>
  );

  if (!unlocked) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-lora font-medium mb-1">Legacy Vault</h2>
        <p className="text-sm text-muted-foreground mb-6">Enter your PIN to step inside your most precious memories.</p>
        <div className="space-y-3">
          <div className="relative">
            <Input type={showPin ? 'text' : 'password'} placeholder="Enter PIN" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUnlock()} className="rounded-xl text-center text-lg tracking-widest pr-10" maxLength={8} />
            <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-2.5 text-muted-foreground">
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {pinError && <p className="text-xs text-destructive">{pinError}</p>}
          <Button onClick={handleUnlock} className="w-full rounded-xl"><Unlock className="w-4 h-4 mr-2" />Unlock</Button>
          <button onClick={() => { setStoredPin(''); setSettingPin(true); }} className="text-xs text-muted-foreground hover:text-foreground">Reset PIN</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/20 to-chart-3/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-lora font-medium">Legacy Vault</h1>
            <p className="text-sm text-muted-foreground">Your most precious memories, protected</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUnlocked(false)} size="sm" className="rounded-xl">
            <Lock className="w-3 h-3 mr-1" /> Lock
          </Button>
          <Button onClick={() => setShowForm(true)} className="rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Add to Vault
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 text-center">
          <Heart className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xl font-bold text-primary">{memories.length}</p>
          <p className="text-xs text-muted-foreground">Vault Memories</p>
        </div>
        <div className="bg-gradient-to-br from-chart-3/10 to-transparent border border-chart-3/20 rounded-2xl p-4 text-center">
          <Mail className="w-5 h-5 text-chart-3 mx-auto mb-1" />
          <p className="text-xl font-bold text-chart-3">{scheduledMessages.length}</p>
          <p className="text-xs text-muted-foreground">Sealed Letters</p>
        </div>
        <div className="bg-gradient-to-br from-accent/20 to-transparent border border-accent/30 rounded-2xl p-4 text-center md:col-span-1 col-span-2">
          <Star className="w-5 h-5 text-accent-foreground mx-auto mb-1" />
          <p className="text-xl font-bold">{memories.length + scheduledMessages.length}</p>
          <p className="text-xs text-muted-foreground">Total Treasures</p>
        </div>
      </div>

      <div className="flex bg-secondary rounded-xl p-1 mb-6 w-fit">
        {[['memories', 'Memories', Heart], ['messages', 'Letters', Mail]].map(([k, label, TabIcon]) => {
          const TIcon = TabIcon;
          return (
            <button key={k} onClick={() => setActiveTab(k)} className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === k ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}>
              <TIcon className="w-4 h-4" /> {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'memories' && (
        memories.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
            <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Your vault is empty</p>
            <p className="text-sm text-muted-foreground">Add your most precious memories here — they'll be safely guarded.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {memories.map(m => (
              <MemoryCard key={m.id} m={m} onDelete={(id) => deleteMemMutation.mutate(id)} />
            ))}
          </div>
        )
      )}

      {activeTab === 'messages' && (
        scheduledMessages.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
            <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">No letters sealed yet</p>
            <p className="text-sm text-muted-foreground">Write something beautiful for someone you love, to be opened when the time is right.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {scheduledMessages.map(m => (
              <MessageCard key={m.id} m={m} onDelete={(id) => deleteMsgMutation.mutate(id)} />
            ))}
          </div>
        )
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-lora font-medium">
              <Shield className="w-5 h-5 text-primary" /> Add to Legacy Vault
            </DialogTitle>
          </DialogHeader>
          <div className="flex bg-secondary rounded-xl p-1 mb-4">
            <button onClick={() => setFormType('memory')} className={cn("flex-1 py-1.5 text-sm rounded-lg font-medium transition-all", formType === 'memory' ? "bg-card shadow" : "text-muted-foreground")}>Memory</button>
            <button onClick={() => setFormType('message')} className={cn("flex-1 py-1.5 text-sm rounded-lg font-medium transition-all", formType === 'message' ? "bg-card shadow" : "text-muted-foreground")}>Letter</button>
          </div>

          {formType === 'memory' ? (
            <div className="space-y-3">
              <Input placeholder="Memory title" value={memForm.title} onChange={e => setMemForm({ ...memForm, title: e.target.value })} className="rounded-xl bg-secondary border-none" />
              <div className="relative">
                <Textarea placeholder="Tell the story…" value={memForm.content} onChange={e => setMemForm({ ...memForm, content: e.target.value })} className="rounded-xl bg-secondary border-none min-h-[100px] resize-none pr-12" />
                <div className="absolute bottom-3 right-3">
                  <VoiceMicButton onResult={(tx, url) => setMemForm(f => ({ ...f, content: f.content ? f.content + '\n' + tx : tx, voice_transcript: tx, voice_url: url }))} size="sm" />
                </div>
              </div>
              {memForm.voice_url && <WaveformPlayer audioUrl={memForm.voice_url} transcript={memForm.voice_transcript} />}
              <div className="grid grid-cols-2 gap-3">
                <Select value={memForm.category} onValueChange={v => setMemForm({ ...memForm, category: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['milestone','family_story','achievement','travel','relationship','wisdom','life_lesson','tradition','funny_moment','other'].map(c => (
                      <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={memForm.date_of_memory} onChange={e => setMemForm({ ...memForm, date_of_memory: e.target.value })} className="rounded-xl" />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={() => saveMemMutation.mutate(memForm)} className="rounded-xl"><Shield className="w-3 h-3 mr-1" />Lock in Vault</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Letter title (optional)" value={msgForm.title} onChange={e => setMsgForm({ ...msgForm, title: e.target.value })} className="rounded-xl bg-secondary border-none" />
              <div className="relative">
                <Textarea placeholder="Write your letter…" value={msgForm.content} onChange={e => setMsgForm({ ...msgForm, content: e.target.value })} className="rounded-xl bg-secondary border-none min-h-[100px] resize-none pr-12" />
                <div className="absolute bottom-3 right-3">
                  <VoiceMicButton onResult={(tx, url) => setMsgForm(f => ({ ...f, content: f.content ? f.content + '\n' + tx : tx, voice_transcript: tx, voice_url: url }))} size="sm" />
                </div>
              </div>
              {msgForm.voice_url && <WaveformPlayer audioUrl={msgForm.voice_url} transcript={msgForm.voice_transcript} />}
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Recipient name" value={msgForm.recipient_name} onChange={e => setMsgForm({ ...msgForm, recipient_name: e.target.value })} className="rounded-xl bg-secondary border-none" />
                <Select value={msgForm.recipient_relationship} onValueChange={v => setMsgForm({ ...msgForm, recipient_relationship: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['self','child','spouse','parent','sibling','friend','grandchild','other'].map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Unlock Date</label>
                  <Input type="date" value={msgForm.delivery_date} onChange={e => setMsgForm({ ...msgForm, delivery_date: e.target.value })} className="rounded-xl" />
                </div>
                <Select value={msgForm.emotional_tone} onValueChange={v => setMsgForm({ ...msgForm, emotional_tone: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['loving','encouraging','reflective','celebratory','advisory','nostalgic'].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={() => saveMsgMutation.mutate(msgForm)} className="rounded-xl"><Lock className="w-3 h-3 mr-1" />Seal Letter</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}