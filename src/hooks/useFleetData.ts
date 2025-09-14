import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useOrganizations } from './useOrganizations';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization_id: string;
  device_id?: string;
  created_at: string;
  updated_at: string;
}

interface Vehicle {
  id: string;
  name: string;
  type: string;
  driver_id?: string;
  organization_id: string;
  device_id?: string;
  is_active: boolean;
}

interface GPSPosition {
  id: string;
  driver_id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  altitude?: number;
  timestamp: string;
  is_moving: boolean;
  battery_level?: number;
  organization_id: string;
}

export const useFleetData = () => {
  const { user, userRole, isAdmin } = useAuth();
  const { userOrganizations } = useOrganizations();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [gpsPositions, setGpsPositions] = useState<GPSPosition[]>([]);
  const [loading, setLoading] = useState(true);

  // Get organization IDs that the current user has access to
  const getAccessibleOrganizationIds = () => {
    if (isAdmin) {
      // Admins can see all organizations
      return null; // null means no filter
    }
    
    // Non-admins can only see their own organizations
    return userOrganizations.map(uo => uo.organization_id);
  };

  const fetchDrivers = async () => {
    try {
      const organizationIds = getAccessibleOrganizationIds();
      
      // First get all profiles with basic info
      let profileQuery = supabase
        .from('profiles')
        .select('id, email, full_name, created_at, updated_at');

      const { data: profiles, error: profilesError } = await profileQuery;

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Then get user roles and organizations separately
      const driversData: Driver[] = [];
      
      for (const profile of profiles || []) {
        // Get user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .single();

        // Skip if not a driver
        if (!roleData || roleData.role !== 'driver') continue;

        // Get user organizations
        const { data: orgData } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', profile.id);

        const organizationId = orgData?.[0]?.organization_id;
        
        // Filter by organization access if not admin
        if (organizationIds && organizationIds.length > 0) {
          if (!organizationId || !organizationIds.includes(organizationId)) {
            continue;
          }
        }

        driversData.push({
          id: profile.id,
          name: profile.full_name || profile.email,
          email: profile.email,
          organization_id: organizationId,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        });
      }

      setDrivers(driversData);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchGpsPositions = async () => {
    try {
      const organizationIds = getAccessibleOrganizationIds();
      
      let query = supabase
        .from('gps_tracking')
        .select('*')
        .order('timestamp', { ascending: false });

      // Apply organization filter for non-admins
      if (organizationIds && organizationIds.length > 0) {
        query = query.in('organization_id', organizationIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching GPS positions:', error);
        return;
      }

      setGpsPositions(data || []);
    } catch (error) {
      console.error('Error fetching GPS positions:', error);
    }
  };

  const fetchVehicles = async () => {
    try {
      const organizationIds = getAccessibleOrganizationIds();
      
      let query = supabase
        .from('driver_devices')
        .select('*')
        .eq('is_active', true);

      // Apply organization filter for non-admins
      if (organizationIds && organizationIds.length > 0) {
        query = query.in('organization_id', organizationIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching vehicles:', error);
        return;
      }

      // Transform device data to Vehicle format
      const transformedVehicles: Vehicle[] = (data || []).map(device => ({
        id: device.id,
        name: device.device_name || device.device_id,
        type: 'Vehicle', // Default type, can be enhanced later
        driver_id: device.driver_id,
        organization_id: device.organization_id,
        device_id: device.device_id,
        is_active: device.is_active
      }));

      setVehicles(transformedVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  // Get latest position for a specific driver
  const getLatestPositionForDriver = (driverId: string): GPSPosition | null => {
    const driverPositions = gpsPositions
      .filter(pos => pos.driver_id === driverId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return driverPositions[0] || null;
  };

  // Get active drivers (those with recent GPS data)
  const getActiveDrivers = () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    return drivers.filter(driver => {
      const latestPosition = getLatestPositionForDriver(driver.id);
      return latestPosition && new Date(latestPosition.timestamp) > oneHourAgo;
    }).map(driver => {
      const latestPosition = getLatestPositionForDriver(driver.id)!;
      const vehicle = vehicles.find(v => v.driver_id === driver.id);
      
      return {
        driver,
        position: latestPosition,
        vehicle
      };
    });
  };

  // Check if current user can access specific driver data
  const canAccessDriverData = (driverId: string): boolean => {
    if (isAdmin) return true;
    
    // Check if the driver belongs to one of user's organizations
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return false;
    
    const organizationIds = getAccessibleOrganizationIds();
    return organizationIds ? organizationIds.includes(driver.organization_id) : false;
  };

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDrivers(),
      fetchVehicles(),
      fetchGpsPositions()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (user && userOrganizations.length >= 0) {
      fetchAllData();
    }
  }, [user, userOrganizations, isAdmin]);

  // Set up real-time subscriptions for GPS data
  useEffect(() => {
    if (!user) return;

    const organizationIds = getAccessibleOrganizationIds();
    
    // Subscribe to GPS tracking updates
    let gpsSubscription = supabase
      .channel('gps_tracking_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gps_tracking',
          ...(organizationIds && { filter: `organization_id=in.(${organizationIds.join(',')})` })
        },
        (payload) => {
          console.log('GPS data updated:', payload);
          fetchGpsPositions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gpsSubscription);
    };
  }, [user, userOrganizations, isAdmin]);

  return {
    drivers,
    vehicles,
    gpsPositions,
    loading,
    getLatestPositionForDriver,
    getActiveDrivers,
    canAccessDriverData,
    refetch: fetchAllData
  };
};