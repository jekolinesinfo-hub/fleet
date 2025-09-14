import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Truck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Mock data per i veicoli sulla mappa con coordinate reali
const mockVehicles = [
  { 
    id: "V001", 
    driver: "Marco Rossi", 
    type: "Camion", 
    status: "driving", 
    coordinates: [12.4964, 41.9028], // Roma
    lastUpdate: "2 min fa"
  },
  { 
    id: "V002", 
    driver: "Luca Bianchi", 
    type: "Furgone", 
    status: "resting", 
    coordinates: [9.1900, 45.4642], // Milano
    lastUpdate: "5 min fa"
  },
  { 
    id: "V003", 
    driver: "Anna Verde", 
    type: "Taxi", 
    status: "alert", 
    coordinates: [11.2558, 43.7696], // Firenze
    lastUpdate: "1 min fa"
  },
  { 
    id: "V004", 
    driver: "Giuseppe Neri", 
    type: "Camion", 
    status: "driving", 
    coordinates: [14.2681, 40.8518], // Napoli
    lastUpdate: "3 min fa"
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'driving':
      return 'text-success bg-success/10 border-success/20';
    case 'resting':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'alert':
      return 'text-alert bg-alert/10 border-alert/20 animate-pulse';
    default:
      return 'text-muted-foreground bg-muted/10 border-border';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'driving':
      return <Truck className="h-4 w-4" />;
    case 'resting':
      return <MapPin className="h-4 w-4" />;
    case 'alert':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <MapPin className="h-4 w-4" />;
  }
};

interface FleetMapProps {
  selectedDriverId?: string | null;
}

const FleetMap: React.FC<FleetMapProps> = ({ selectedDriverId }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapboxToken, setMapboxToken] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [12.4964, 41.9028], // Centro Italia
      zoom: 6
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    map.current.on('load', () => {
      setIsMapReady(true);
      addVehicleMarkers();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  useEffect(() => {
    if (isMapReady && selectedDriverId) {
      const vehicle = mockVehicles.find(v => v.id === selectedDriverId);
      if (vehicle && map.current) {
        map.current.flyTo({
          center: vehicle.coordinates as [number, number],
          zoom: 14,
          duration: 2000
        });
      }
    }
  }, [selectedDriverId, isMapReady]);

  const addVehicleMarkers = () => {
    mockVehicles.forEach((vehicle) => {
      const el = document.createElement('div');
      el.className = `marker-${vehicle.status}`;
      el.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        ${vehicle.status === 'driving' ? 'background: hsl(var(--success));' : ''}
        ${vehicle.status === 'resting' ? 'background: hsl(var(--warning));' : ''}
        ${vehicle.status === 'alert' ? 'background: hsl(var(--alert)); animation: pulse 2s infinite;' : ''}
      `;
      
      const icon = vehicle.status === 'driving' ? '🚛' : 
                   vehicle.status === 'resting' ? '⏸️' : '⚠️';
      el.innerHTML = icon;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <div class="font-semibold">${vehicle.driver}</div>
          <div class="text-xs text-gray-600">ID: ${vehicle.id}</div>
          <div class="text-xs text-gray-600">Tipo: ${vehicle.type}</div>
          <div class="text-xs text-gray-600">Aggiornato: ${vehicle.lastUpdate}</div>
          ${vehicle.status === 'alert' ? '<div class="text-xs text-red-600 font-medium mt-1">⚠️ Violazione normative</div>' : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(vehicle.coordinates as [number, number])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current[vehicle.id] = marker;
    });
  };

  if (!mapboxToken) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] bg-muted rounded-lg p-6">
        <div className="text-center mb-4">
          <h3 className="font-semibold mb-2">Configura Mapbox Token</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Per utilizzare la mappa reale, inserisci il tuo Mapbox Public Token.
            <br />
            Puoi trovarlo su <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
          </p>
          <div className="flex gap-2 max-w-md">
            <Input
              placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJ..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="flex-1"
            />
            <Button onClick={() => setIsMapReady(false)}>
              Connetti
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-card z-10">
        <div className="text-xs font-semibold mb-2">Legenda</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-xs">In viaggio</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span className="text-xs">In sosta</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-alert animate-pulse"></div>
            <span className="text-xs">Alert attivo</span>
          </div>
        </div>
      </div>

      {/* Contatore Real-time */}
      <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-card z-10">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-xs font-medium">Live GPS Tracking</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {mockVehicles.length} veicoli monitorati
        </div>
      </div>
    </div>
  );
};

export default FleetMap;