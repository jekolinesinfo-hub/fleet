import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRealTimeGPS } from "@/hooks/useRealTimeGPS";

interface FleetMapProps {
  selectedDriverId?: string | null;
}

const FleetMap: React.FC<FleetMapProps> = ({ selectedDriverId }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<{ [key: string]: L.Marker }>({});
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Hook per dati GPS real-time
  const { gpsData, devices, isLoading, getActiveDrivers, getLatestPositionForDriver } = useRealTimeGPS();

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

  // Effetto per aggiornare marker quando cambiano i dati GPS
  useEffect(() => {
    if (isMapReady) {
      addVehicleMarkers();
    }
  }, [isMapReady, gpsData, devices]);

  useEffect(() => {
    if (isMapReady && selectedDriverId && map.current) {
      const driverPosition = getLatestPositionForDriver(selectedDriverId);
      if (driverPosition) {
        map.current.setView([driverPosition.latitude, driverPosition.longitude], 14);
      }
    }
  }, [selectedDriverId, isMapReady, getLatestPositionForDriver]);

  // Funzione per determinare lo status del driver
  const getDriverStatus = (position: any, device: any) => {
    if (!device || !device.is_active) return 'offline';
    
    // Verifica se ci sono condizioni di alert (velocità eccessiva, batteria bassa, etc.)
    const hasAlert = (position.speed && position.speed > 30) || // > 108 km/h
                    (position.battery_level && position.battery_level < 20);
    
    if (hasAlert) return 'alert';
    if (position.is_moving) return 'driving';
    return 'resting';
  };

  // Funzione per ottenere il colore dello status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'driving':
        return 'hsl(142, 76%, 36%)'; // Verde
      case 'resting':
        return 'hsl(48, 96%, 53%)';  // Giallo
      case 'offline':
        return 'hsl(0, 0%, 60%)';    // Grigio
      case 'alert':
        return 'hsl(0, 84%, 60%)';   // Rosso
      default:
        return 'hsl(0, 0%, 60%)';
    }
  };

  const addVehicleMarkers = () => {
    if (!map.current || isLoading) return;

    // Rimuovi marker esistenti
    Object.values(markers.current).forEach(marker => {
      map.current?.removeLayer(marker);
    });
    markers.current = {};

    const activeDrivers = getActiveDrivers();
    console.log('📍 Aggiornamento marker per', activeDrivers.length, 'driver');

    activeDrivers.forEach(({ driverId, position, device }) => {
      const status = getDriverStatus(position, device);
      const color = getStatusColor(status);
      
      // Crea icona personalizzata per ogni driver
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
          background: ${color};
          ${status === 'alert' ? 'animation: pulse 2s infinite;' : ''}
        ">
          ${status === 'driving' ? '🚛' : status === 'resting' ? '⏸️' : status === 'offline' ? '📱' : '⚠️'}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const speedKmh = position.speed ? Math.round(position.speed * 3.6) : 0;
      const lastUpdate = new Date(position.timestamp).toLocaleString('it-IT');

      const popupContent = `
        <div class="p-2">
          <div class="font-semibold">Driver ${driverId}</div>
          <div class="text-xs text-gray-600">Status: ${status}</div>
          <div class="text-xs text-gray-600">Velocità: ${speedKmh} km/h</div>
          <div class="text-xs text-gray-600">Precisione: ${position.accuracy?.toFixed(1)}m</div>
          <div class="text-xs text-gray-600">Aggiornato: ${lastUpdate}</div>
          <div class="text-xs text-gray-600 mt-1">
            📍 ${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}
          </div>
        </div>
      `;

      const marker = L.marker([position.latitude, position.longitude], { icon: customIcon })
        .addTo(map.current!)
        .bindPopup(popupContent);

      markers.current[driverId] = marker;
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
          {isLoading ? 'Caricamento...' : `${getActiveDrivers().length} veicoli monitorati`}
        </div>
      </div>
    </div>
  );
};

export default FleetMap;