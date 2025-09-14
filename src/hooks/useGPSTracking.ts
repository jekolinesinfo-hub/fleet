import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';

interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

interface UseGPSTrackingProps {
  driverId: string;
  deviceId: string;
  trackingEnabled: boolean;
}

export const useGPSTracking = ({ driverId, deviceId, trackingEnabled }: UseGPSTrackingProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<string | null>(null);

  const startTracking = useCallback(async () => {
    try {
      console.log('🚛 Avvio tracking GPS per driver:', driverId);
      
      // Richiedi permessi
      const permissions = await Geolocation.requestPermissions();
      if (permissions.location !== 'granted') {
        throw new Error('Permessi GPS negati');
      }

      // Registra il dispositivo
      await supabase.from('driver_devices').upsert({
        driver_id: driverId,
        device_id: deviceId,
        device_name: 'Mobile App',
        is_active: true,
        last_seen: new Date().toISOString()
      });

      // Ottieni posizione iniziale
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000
      });

      const gpsData: GPSPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        speed: position.coords.speed || undefined,
        heading: position.coords.heading || undefined,
        timestamp: new Date().toISOString()
      };

      setCurrentPosition(gpsData);

      // Salva posizione iniziale
      await savePosition(gpsData);

      // Avvia tracking continuo
      const id = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 5000
      }, (position, err) => {
        if (err) {
          console.error('❌ Errore GPS watch:', err);
          setError(err.message);
          return;
        }

        if (position) {
          const newGpsData: GPSPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            speed: position.coords.speed || undefined,
            heading: position.coords.heading || undefined,
            timestamp: new Date().toISOString()
          };

          setCurrentPosition(newGpsData);
          savePosition(newGpsData);
        }
      });

      setWatchId(id);
      setIsTracking(true);
      setError(null);
      console.log('✅ Tracking GPS attivato');

    } catch (error) {
      console.error('❌ Errore avvio tracking:', error);
      setError(error instanceof Error ? error.message : 'Errore sconosciuto');
    }
  }, [driverId, deviceId]);

  const stopTracking = useCallback(async () => {
    try {
      if (watchId) {
        await Geolocation.clearWatch({ id: watchId });
        setWatchId(null);
      }

      // Aggiorna stato dispositivo
      await supabase
        .from('driver_devices')
        .update({ 
          is_active: false,
          last_seen: new Date().toISOString()
        })
        .eq('device_id', deviceId);

      setIsTracking(false);
      console.log('⏹️ Tracking GPS fermato');
    } catch (error) {
      console.error('❌ Errore stop tracking:', error);
    }
  }, [watchId, deviceId]);

  const savePosition = async (position: GPSPosition) => {
    try {
      const { error } = await supabase.from('gps_tracking').insert({
        driver_id: driverId,
        device_id: deviceId,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        altitude: position.altitude,
        speed: position.speed,
        heading: position.heading,
        timestamp: position.timestamp,
        is_moving: (position.speed || 0) > 1 // Movimento se velocità > 1 m/s
      });

      if (error) {
        console.error('❌ Errore salvataggio GPS:', error);
      } else {
        console.log('📍 Posizione salvata:', position.latitude, position.longitude);
      }
    } catch (error) {
      console.error('❌ Errore save position:', error);
    }
  };

  useEffect(() => {
    if (trackingEnabled && !isTracking) {
      startTracking();
    } else if (!trackingEnabled && isTracking) {
      stopTracking();
    }
  }, [trackingEnabled, isTracking, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchId]);

  return {
    isTracking,
    currentPosition,
    error,
    startTracking,
    stopTracking
  };
};