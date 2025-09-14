import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFleetConfig } from '@/contexts/FleetConfigContext';

interface DriverStats {
  distanceToday: number; // in km
  drivingTimeToday: number; // in minutes
  remainingDrivingTime: number; // in minutes
  speedViolationsToday: number;
  currentShiftStart: string | null;
  isOnShift: boolean;
}

interface SpeedViolation {
  id: string;
  timestamp: string;
  recorded_speed_kmh: number;
  speed_limit_kmh: number;
  excess_speed_kmh: number;
  severity: string;
  is_acknowledged: boolean;
  violation_lat: number;
  violation_lng: number;
}

export const useDriverStats = (driverId: string) => {
  const { config } = useFleetConfig();
  const [stats, setStats] = useState<DriverStats>({
    distanceToday: 0,
    drivingTimeToday: 0,
    remainingDrivingTime: config.dailyDrivingLimit,
    speedViolationsToday: 0,
    currentShiftStart: null,
    isOnShift: false
  });
  
  const [violations, setViolations] = useState<SpeedViolation[]>([]);
  const [loading, setLoading] = useState(true);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raggio Terra in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchDriverStats = async () => {
    if (!driverId) return;
    
    try {
      setLoading(true);
      
      // Data di oggi
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Fetch GPS positions for today
      const { data: positions, error: posError } = await supabase
        .from('gps_tracking')
        .select('*')
        .eq('driver_id', driverId)
        .gte('timestamp', todayISO)
        .order('timestamp', { ascending: true });

      if (posError) throw posError;

      // Fetch speed violations for today
      const { data: violationsData, error: violError } = await supabase
        .from('speed_violations')
        .select('*')
        .eq('driver_id', driverId)
        .gte('timestamp', todayISO)
        .order('timestamp', { ascending: false });

      if (violError) throw violError;

      // Calculate distance and driving time
      let totalDistance = 0;
      let drivingMinutes = 0;
      let shiftStart: string | null = null;
      let isCurrentlyOnShift = false;

      if (positions && positions.length > 0) {
        shiftStart = positions[0].timestamp;
        
        // Check if still tracking today
        const lastPosition = positions[positions.length - 1];
        const lastUpdateTime = new Date(lastPosition.timestamp);
        const now = new Date();
        const timeSinceLastUpdate = (now.getTime() - lastUpdateTime.getTime()) / 1000 / 60; // minutes
        
        isCurrentlyOnShift = timeSinceLastUpdate < 30; // Consider on shift if last update < 30 minutes ago

        // Calculate total distance
        for (let i = 1; i < positions.length; i++) {
          const prev = positions[i - 1];
          const curr = positions[i];
          
          const distance = calculateDistance(
            prev.latitude,
            prev.longitude,
            curr.latitude,
            curr.longitude
          );
          
          // Only count realistic distances (max 2km between points to filter GPS errors)
          if (distance < 2) {
            totalDistance += distance;
          }
        }

        // Calculate driving time (time when moving)
        let movingTimeMs = 0;
        for (let i = 1; i < positions.length; i++) {
          const prev = positions[i - 1];
          const curr = positions[i];
          
          // Consider moving if speed > 5 km/h
          const speedKmh = (curr.speed || 0) * 3.6;
          if (speedKmh > 5) {
            const timeDiff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
            movingTimeMs += timeDiff;
          }
        }
        
        drivingMinutes = movingTimeMs / 1000 / 60;
      }

      const remainingTime = Math.max(0, config.dailyDrivingLimit - drivingMinutes);

      setStats({
        distanceToday: Math.round(totalDistance * 100) / 100, // Round to 2 decimals
        drivingTimeToday: Math.round(drivingMinutes),
        remainingDrivingTime: Math.round(remainingTime),
        speedViolationsToday: violationsData?.length || 0,
        currentShiftStart: shiftStart,
        isOnShift: isCurrentlyOnShift
      });

      setViolations(violationsData || []);
      
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverStats();
    
    // Refresh stats every 2 minutes
    const interval = setInterval(fetchDriverStats, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [driverId, config]);

  const needsBreak = () => {
    return stats.drivingTimeToday >= config.breakRequiredAfter && 
           stats.remainingDrivingTime > 0;
  };

  const formatDrivingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return {
    stats,
    violations,
    loading,
    needsBreak,
    formatDrivingTime,
    refreshStats: fetchDriverStats
  };
};