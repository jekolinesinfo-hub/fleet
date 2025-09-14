import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FleetMap from "./FleetMap";
import DriversList from "./DriversList";
import DriverDetails from "./DriverDetails";
import DriverRegistration from "./DriverRegistration";
import FleetManager from "./FleetManager";
import LanguageSelector from "./LanguageSelector";
import { useAuth } from "@/hooks/useAuth";
import { useFleetData } from "@/hooks/useFleetData";
import { useTranslation } from "@/contexts/I18nContext";
import { Activity, Users, AlertTriangle, MapPin, UserPlus, ArrowLeft, Settings, LogOut, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const FleetDashboard = () => {
  const { signOut, profile, isAdmin, isFleetManager } = useAuth();
  const { drivers, vehicles, getActiveDrivers, loading } = useFleetData();
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'dashboard' | 'driver' | 'registration'>('dashboard');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [trackedDriverId, setTrackedDriverId] = useState<string | null>(null);

  const activeDriversData = getActiveDrivers();
  
  // Calculate real stats from user's fleet data
  const stats = {
    totalVehicles: vehicles.length,
    activeDrivers: activeDriversData.length,
    activeAlerts: activeDriversData.filter(({ position }) => 
      (position.speed && position.speed > 30) || // > 108 km/h
      (position.battery_level && position.battery_level < 20)
    ).length,
    totalDistance: "N/A" // Would need calculation from historical data
  };

  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
    setActiveView('driver');
  };

  const handleDriverTrack = (driverId: string) => {
    console.log('🎯 Tracking driver:', driverId);
    setTrackedDriverId(driverId);
    // Reset dopo qualche secondo per evitare loop continui
    setTimeout(() => setTrackedDriverId(null), 2000);
  };

  const handleBackToDashboard = () => {
    setActiveView('dashboard');
    setSelectedDriverId(null);
    setTrackedDriverId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {activeView !== 'dashboard' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveView('dashboard')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('backToDashboard')}
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t('fleetManagement')}</h1>
                <p className="text-sm text-muted-foreground">
                  {activeView === 'dashboard' && t('fleetControlDashboard')}
                  {activeView === 'driver' && t('driverDetails')}
                  {activeView === 'registration' && t('driverRegistration')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <LanguageSelector />
              
              {profile && (
                <span className="text-sm text-muted-foreground">
                  {t('welcome')}, {profile.full_name || profile.email}
                </span>
              )}
              
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    {t('admin')}
                  </Button>
                </Link>
              )}
              
              {isAdmin && (
                <Button
                  onClick={() => setActiveView('registration')}
                  variant="outline"
                  size="sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('registerDriver')}
                </Button>
              )}
              
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('exit')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('totalVehicles')}</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalVehicles}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('activeDrivers')}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeDrivers}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('activeAlerts')}</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeAlerts}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t('totalDistance')}</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDistance}</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Map */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {t('realTimeMap')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <FleetMap 
                    selectedDriverId={selectedDriverId} 
                    trackedDriverId={trackedDriverId}
                  />
                </CardContent>
              </Card>

              {/* Drivers List */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('activeDriversList')}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DriversList 
                    onDriverSelect={handleDriverSelect}
                    onDriverTrack={handleDriverTrack}
                    driversData={activeDriversData}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeView === 'driver' && selectedDriverId && (
          <DriverDetails 
            driverId={selectedDriverId} 
            onBack={handleBackToDashboard}
          />
        )}

        {activeView === 'registration' && (
          <DriverRegistration onBack={handleBackToDashboard} />
        )}
      </main>
    </div>
  );
};

export default FleetDashboard;