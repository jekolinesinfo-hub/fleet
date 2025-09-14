import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Truck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const map = useRef<L.Map | null>(null);
  const markers = useRef<{ [key: string]: L.Marker }>({});
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Fix per le icone di Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
    
    map.current = L.map(mapContainer.current).setView([41.9028, 12.4964], 6);

    // Aggiungi tile layer OpenStreetMap (gratuito e mondiale)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);
    
    setIsMapReady(true);
    addVehicleMarkers();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isMapReady && selectedDriverId && map.current) {
      const vehicle = mockVehicles.find(v => v.id === selectedDriverId);
      if (vehicle) {
        map.current.setView(vehicle.coordinates as [number, number], 14);
      }
    }
  }, [selectedDriverId, isMapReady]);

  const addVehicleMarkers = () => {
    if (!map.current) return;

    mockVehicles.forEach((vehicle) => {
      // Crea icona personalizzata per ogni veicolo
      const iconHtml = `
        <div style="
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
          ${vehicle.status === 'driving' ? 'background: hsl(142, 76%, 36%);' : ''}
          ${vehicle.status === 'resting' ? 'background: hsl(48, 96%, 53%);' : ''}
          ${vehicle.status === 'alert' ? 'background: hsl(0, 84%, 60%); animation: pulse 2s infinite;' : ''}
        ">
          ${vehicle.status === 'driving' ? '🚛' : vehicle.status === 'resting' ? '⏸️' : '⚠️'}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const popupContent = `
        <div class="p-2">
          <div class="font-semibold">${vehicle.driver}</div>
          <div class="text-xs text-gray-600">ID: ${vehicle.id}</div>
          <div class="text-xs text-gray-600">Tipo: ${vehicle.type}</div>
          <div class="text-xs text-gray-600">Aggiornato: ${vehicle.lastUpdate}</div>
          ${vehicle.status === 'alert' ? '<div class="text-xs text-red-600 font-medium mt-1">⚠️ Violazione normative</div>' : ''}
        </div>
      `;

      const marker = L.marker(vehicle.coordinates as [number, number], { icon: customIcon })
        .addTo(map.current!)
        .bindPopup(popupContent);

      markers.current[vehicle.id] = marker;
    });
  };


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