import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export default function LocationPicker({ lat, lng, locationName, onChange, onClose }) {
  const [pos, setPos] = useState(lat && lng ? [lat, lng] : null);
  const [locName, setLocName] = useState(locationName || '');
  const center = pos || [20, 0];

  const handlePick = (lat, lng) => setPos([lat, lng]);

  const handleSave = () => {
    onChange({ lat: pos?.[0] || null, lng: pos?.[1] || null, location_name: locName });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/50" onClick={onClose}>
      <div className="w-full bg-card rounded-t-3xl p-4 space-y-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Pick a location</h3>
          <button onClick={onClose} className="p-1.5 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="rounded-2xl overflow-hidden border border-border h-64">
          <MapContainer center={center} zoom={pos ? 10 : 2} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickHandler onPick={handlePick} />
            {pos && <Marker position={pos} />}
          </MapContainer>
        </div>
        <input
          value={locName}
          onChange={e => setLocName(e.target.value)}
          placeholder="Location name (e.g. Paris, France)"
          className="w-full rounded-xl bg-secondary border-none px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="flex gap-2">
          {pos && <button onClick={() => setPos(null)} className="text-xs text-muted-foreground hover:text-foreground">Clear pin</button>}
          <Button onClick={handleSave} className="flex-1 rounded-xl h-10 text-sm">Save location</Button>
        </div>
      </div>
    </div>
  );
}