import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import FleetMap from "./FleetMap";
import DriversList from "./DriversList";
import DriverDetails from "./DriverDetails";
import DriverRegistration from "./DriverRegistration";
import AlertCenter from "./AlertCenter";
import { useAuth } from "@/hooks/useAuth";
import { Activity, Users, AlertTriangle, MapPin, UserPlus, ArrowLeft, Settings, LogOut, Shield } from "lucide-react";
import { Link } from "react-router-dom";

// Mock data
const mockStats = {
  totalVehicles: 47,
  activeDrivers: 32,
  activeAlerts: 3,
  totalDistance: "2,847 km"
};

const FleetDashboard = () => {
  const { signOut, profile, isAdmin } = useAuth();
  const [activeView, setActiveView] = useState<'dashboard' | 'driver' | 'registration'>('dashboard');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [trackedDriverId, setTrackedDriverId] = useState<string | null>(null);

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
                  Torna alla Dashboard
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-foreground">Fleet Management</h1>
                <p className="text-sm text-muted-foreground">
                  {activeView === 'dashboard' && 'Dashboard di controllo flotta'}
                  {activeView === 'driver' && 'Dettagli driver'}
                  {activeView === 'registration' && 'Registrazione driver'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {profile && (
                <span className="text-sm text-muted-foreground">
                  Benvenuto, {profile.full_name || profile.email}
                </span>
              )}
              
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              
              <Button
                onClick={() => setActiveView('registration')}
                variant="outline"
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Registra Driver
              </Button>
              
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Esci
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
                  <CardTitle className="text-sm font-medium">Veicoli Totali</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.totalVehicles}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conducenti Attivi</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.activeDrivers}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alert Attivi</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.activeAlerts}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Distanza Totale</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.totalDistance}</div>
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
                    Mappa in Tempo Reale
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
                  <CardTitle>Conducenti Attivi</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <DriversList 
                    onDriverSelect={handleDriverSelect}
                    onDriverTrack={handleDriverTrack}
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