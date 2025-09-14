import React, { createContext, useContext, useState, useEffect } from 'react';

export type FleetType = 'trucks' | 'taxis' | 'vans';

interface FleetConfig {
  type: FleetType;
  dailyDrivingLimit: number; // in minutes
  weeklyDrivingLimit: number; // in minutes
  biweeklyDrivingLimit: number; // in minutes
  breakRequiredAfter: number; // in minutes
  minimumBreakDuration: number; // in minutes
  dailyRestRequired: number; // in hours
  weeklyRestRequired: number; // in hours
}

interface FleetConfigContextType {
  fleetType: FleetType;
  setFleetType: (type: FleetType) => void;
  config: FleetConfig;
  availableFleetTypes: { code: FleetType; name: string; icon: string }[];
}

const FleetConfigContext = createContext<FleetConfigContextType | undefined>(undefined);

const STORAGE_KEY = 'fleet_app_fleet_type';

// EU Regulations for different fleet types
const fleetConfigs: Record<FleetType, FleetConfig> = {
  trucks: {
    type: 'trucks',
    dailyDrivingLimit: 9 * 60, // 9 hours (extendable to 10h twice per week)
    weeklyDrivingLimit: 56 * 60, // 56 hours per week
    biweeklyDrivingLimit: 90 * 60, // 90 hours in 2 consecutive weeks
    breakRequiredAfter: 4.5 * 60, // Break after 4.5 hours
    minimumBreakDuration: 45, // 45 minutes (can be split 15+30)
    dailyRestRequired: 11, // 11 hours daily rest
    weeklyRestRequired: 45, // 45 hours weekly rest
  },
  taxis: {
    type: 'taxis',
    dailyDrivingLimit: 10 * 60, // 10 hours max per day (local regulations)
    weeklyDrivingLimit: 48 * 60, // 48 hours per week
    biweeklyDrivingLimit: 96 * 60, // 96 hours in 2 weeks
    breakRequiredAfter: 6 * 60, // Break after 6 hours
    minimumBreakDuration: 30, // 30 minutes break
    dailyRestRequired: 10, // 10 hours daily rest
    weeklyRestRequired: 24, // 24 hours weekly rest
  },
  vans: {
    type: 'vans',
    dailyDrivingLimit: 9 * 60, // 9 hours per day
    weeklyDrivingLimit: 48 * 60, // 48 hours per week (working time directive)
    biweeklyDrivingLimit: 96 * 60, // 96 hours in 2 weeks
    breakRequiredAfter: 4.5 * 60, // Break after 4.5 hours
    minimumBreakDuration: 30, // 30 minutes break
    dailyRestRequired: 9, // 9 hours daily rest
    weeklyRestRequired: 24, // 24 hours weekly rest
  }
};

export const availableFleetTypes = [
  { code: 'trucks' as FleetType, name: 'trucks', icon: '🚛' },
  { code: 'taxis' as FleetType, name: 'taxis', icon: '🚕' },
  { code: 'vans' as FleetType, name: 'vans', icon: '🚐' },
];

export const FleetConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const [fleetType, setFleetTypeState] = useState<FleetType>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as FleetType) || 'trucks';
  });

  const setFleetType = (type: FleetType) => {
    setFleetTypeState(type);
    localStorage.setItem(STORAGE_KEY, type);
  };

  const config = fleetConfigs[fleetType];

  return (
    <FleetConfigContext.Provider value={{ 
      fleetType, 
      setFleetType, 
      config,
      availableFleetTypes
    }}>
      {children}
    </FleetConfigContext.Provider>
  );
};

export const useFleetConfig = () => {
  const context = useContext(FleetConfigContext);
  if (context === undefined) {
    throw new Error('useFleetConfig must be used within a FleetConfigProvider');
  }
  return context;
};