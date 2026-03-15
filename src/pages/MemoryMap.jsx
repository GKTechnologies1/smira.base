import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { format, parseISO } from 'date-fns';
import { Map, Heart, Sparkles, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const categoryColors = {
  milestone: '#3B82F6', travel: '#10B981', family_story: '#EC4899',
  achievement: '#F59E0B', relationship: '#8B5CF6', life_lesson: '#6B7280',
  wisdom: '#14B8A6', funny_moment: '#F97316', tradition: '#EF4444', other: '#9CA3AF',
};

export default function MemoryMap() {
  const [view, setView] = useState('map'); // map | timeline
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [followUpQ, setFollowUpQ] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [loadingFollowUp, setLoadingFollowUp] = useState(false);
  const queryClient = useQueryClient();

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: () => base44.entities.Memory.list('-date_of_memory', 200),
  });

  const mappedMemories = memories.filter(m => m.lat && m.lng);
  const timelineMemories = [...memories].filter(m => m.date_of_memory).sort((a, b) =>
    new Date(a.date_of_memory) - new Date(b.date_of_memory)
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Memory.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memories'] }),
  });

  const generateFollowUp = async (memory) => {
    setSelectedMemory(memory);
    setLoadingFollowUp(true);
    setFollowUpQ('');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are Smira, a warm AI companion. A user saved this memory: Title: "${memory.title}", Content: "${memory.content}", Category: "${memory.category}", People: "${(memory.people_involved || []).join(', ')}".
      Ask ONE warm, specific follow-up question to help them expand or deepen this memory story. Keep it short (1 sentence). Be personal and curious, not generic.`,
    });
    setFollowUpQ(typeof result === 'string' ? result.trim() : '');
    setLoadingFollowUp(false);
  };

  const saveFollowUp = async () => {
    if (!followUpAnswer.trim() || !selectedMemory) return;
    const updated = (selectedMemory.content || '') + '\n\n' + followUpAnswer.trim();
    await updateMutation.mutateAsync({ id: selectedMemory.id, data: { content: updated } });
    setFollowUpAnswer('');
    setFollowUpQ('');
    setSelectedMemory(null);
  };

  return (
    <div className="p-4 md:p-8 pt-16 lg:pt-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Memory Map</h1>
          <p className="text-sm text-muted-foreground mt-1">Your life story, visualized</p>
        </div>
        <div className="flex bg-secondary rounded-xl p-1">
          {['map', 'timeline'].map(v => (
            <button key={v} onClick={() => setView(v)} className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
              view === v ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            )}>{v}</button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
      ) : view === 'map' ? (
        <div className="space-y-4">
          {mappedMemories.length === 0 ? (
            <div className="bg-secondary rounded-2xl p-8 text-center">
              <Map className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold mb-1">No location data yet</p>
              <p className="text-sm text-muted-foreground">Add a location name, lat, and lng when saving memories to plot them here.</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden border border-border h-[480px]">
              <MapContainer center={[mappedMemories[0].lat, mappedMemories[0].lng]} zoom={3} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mappedMemories.map(m => (
                  <Marker key={m.id} position={[m.lat, m.lng]}>
                    <Popup>
                      <div className="max-w-[200px]">
                        <p className="font-semibold text-sm mb-1">{m.title}</p>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{m.content}</p>
                        {m.date_of_memory && <p className="text-xs text-gray-400">{format(parseISO(m.date_of_memory), 'MMM d, yyyy')}</p>}
                        <button onClick={() => generateFollowUp(m)} className="text-xs text-blue-600 font-medium mt-2 hover:underline flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Ask Smira for a follow-up
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}

          {/* Side list */}
          <div className="grid md:grid-cols-2 gap-3">
            {memories.slice(0, 6).map(m => (
              <div key={m.id} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: categoryColors[m.category] || '#9CA3AF' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{m.title}</p>
                  {m.location_name && <p className="text-xs text-muted-foreground">📍 {m.location_name}</p>}
                  {m.date_of_memory && <p className="text-xs text-muted-foreground">{format(parseISO(m.date_of_memory), 'MMM d, yyyy')}</p>}
                </div>
                <button onClick={() => generateFollowUp(m)} title="Ask follow-up" className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Timeline view */
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6 pl-16">
            {timelineMemories.map((m, i) => (
              <div key={m.id} className="relative">
                <div
                  className="absolute -left-10 w-4 h-4 rounded-full border-2 border-card"
                  style={{ background: categoryColors[m.category] || '#9CA3AF', top: '16px', left: '-40px' }}
                />
                <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(m.date_of_memory), 'MMMM d, yyyy')}</p>
                    </div>
                    <Badge variant="outline" className="text-xs rounded-lg ml-2 flex-shrink-0">{m.category?.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{m.content}</p>
                  {m.location_name && <p className="text-xs text-muted-foreground mb-2">📍 {m.location_name}</p>}
                  <button onClick={() => generateFollowUp(m)} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3" /> Smira wants to know more…
                  </button>
                </div>
              </div>
            ))}
            {timelineMemories.length === 0 && (
              <div className="text-center py-16">
                <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Add dates to memories to see them on the timeline</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Follow-up modal */}
      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card rounded-3xl border border-border p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-semibold">Smira wants to know more</p>
            </div>
            <p className="text-xs text-muted-foreground mb-1">About: <span className="font-medium text-foreground">{selectedMemory.title}</span></p>
            {loadingFollowUp ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Smira is thinking...</span>
              </div>
            ) : (
              <p className="text-sm font-medium my-3">{followUpQ}</p>
            )}
            <textarea
              value={followUpAnswer}
              onChange={(e) => setFollowUpAnswer(e.target.value)}
              placeholder="Your answer..."
              className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setSelectedMemory(null); setFollowUpAnswer(''); }} className="flex-1 rounded-xl">Skip</Button>
              <Button onClick={saveFollowUp} disabled={!followUpAnswer.trim()} className="flex-1 rounded-xl">Add to Memory</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}