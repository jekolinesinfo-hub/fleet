import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GPSTrackingData {
  id: string;
  driver_id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  battery_level?: number;
  is_moving: boolean;
  created_at: string;
}

interface DriverDevice {
  id: string;
  driver_id: string;
  device_id: string;
  device_name?: string;
  is_active: boolean;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export const useRealTimeGPS = () => {
  const [gpsData, setGpsData] = useState<GPSTrackingData[]>([]);
  const [devices, setDevices] = useState<DriverDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carica dati iniziali
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Carica ultime posizioni per ogni driver
        const { data: latestPositions, error: posError } = await supabase
          .from('gps_tracking')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (posError) {
          console.error('❌ Errore caricamento GPS:', posError);
        } else {
          setGpsData(latestPositions || []);
        }

        // Carica dispositivi attivi
        const { data: activeDevices, error: devError } = await supabase
          .from('driver_devices')
          .select('*')
          .eq('is_active', true)
          .order('last_seen', { ascending: false });

        if (devError) {
          console.error('❌ Errore caricamento dispositivi:', devError);
        } else {
          setDevices(activeDevices || []);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('❌ Errore caricamento dati:', error);
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Subscription per aggiornamenti real-time GPS
  useEffect(() => {
    console.log('🔄 Avvio subscription GPS real-time');
    
    const gpsChannel = supabase
      .channel('gps-tracking-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gps_tracking'
        },
        (payload) => {
          console.log('📍 Nuova posizione GPS ricevuta:', payload.new);
          const newPosition = payload.new as GPSTrackingData;
          
          setGpsData((prev) => {
            // Mantieni solo le ultime 100 posizioni per performance
            const updated = [newPosition, ...prev].slice(0, 100);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Chiusura subscription GPS');
      supabase.removeChannel(gpsChannel);
    };
  }, []);

  // Subscription per dispositivi
  useEffect(() => {
    console.log('🔄 Avvio subscription dispositivi');
    
    const devicesChannel = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_devices'
        },
        (payload) => {
          console.log('📱 Aggiornamento dispositivo:', payload);
          
          if (payload.eventType === 'INSERT') {
            setDevices((prev) => [payload.new as DriverDevice, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setDevices((prev) => 
              prev.map(device => 
                device.id === payload.new.id ? payload.new as DriverDevice : device
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setDevices((prev) => 
              prev.filter(device => device.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Chiusura subscription dispositivi');
      supabase.removeChannel(devicesChannel);
    };
  }, []);

  // Funzione per ottenere l'ultima posizione di un driver
  const getLatestPositionForDriver = (driverId: string): GPSTrackingData | null => {
    const driverPositions = gpsData
      .filter(pos => pos.driver_id === driverId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return driverPositions[0] || null;
  };

  // Funzione per ottenere lo stato del dispositivo
  const getDeviceStatus = (driverId: string): DriverDevice | null => {
    return devices.find(device => device.driver_id === driverId) || null;
  };

  // Funzione per ottenere tutti i driver con posizione
  const getActiveDrivers = () => {
    const driversWithPosition = new Map<string, {
      driverId: string;
      position: GPSTrackingData;
      device: DriverDevice | null;
    }>();

    gpsData.forEach(position => {
      if (!driversWithPosition.has(position.driver_id)) {
        driversWithPosition.set(position.driver_id, {
          driverId: position.driver_id,
          position,
          device: getDeviceStatus(position.driver_id)
        });
      }
    });

    return Array.from(driversWithPosition.values());
  };

  return {
    gpsData,
    devices,
    isLoading,
    getLatestPositionForDriver,
    getDeviceStatus,
    getActiveDrivers
  };
};