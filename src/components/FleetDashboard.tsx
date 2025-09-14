import { useState } from "react";
import { Truck, Users, AlertTriangle, MapPin, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import FleetMap from "./FleetMap";
import DriversList from "./DriversList";
import DriverDetails from "./DriverDetails";
import DriverRegistration from "./DriverRegistration";
import AlertCenter from "./AlertCenter";

// Mock data
const mockStats = {
  totalVehicles: 47,
  activeDrivers: 32,
  activeAlerts: 3,
  totalDistance: "2,847 km"
};

const FleetDashboard = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'driver' | 'registration'>('dashboard');
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
    setActiveView('driver');
  };

  const handleBackToDashboard = () => {
    setActiveView('dashboard');
    setSelectedDriverId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="gradient-primary p-2 rounded-lg">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Fleet Manager</h1>
              <p className="text-sm text-muted-foreground">Dashboard di Controllo Flotta</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <AlertCenter />
            <Button 
              variant="outline" 
              onClick={() => setActiveView('registration')}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Registra Conducente</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r shadow-card">
          <div className="p-4 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-3">
              <Card className="p-3 gradient-primary text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Veicoli Totali</p>
                    <p className="text-2xl font-bold">{mockStats.totalVehicles}</p>
                  </div>
                  <Truck className="h-8 w-8 opacity-80" />
                </div>
              </Card>
              
              <Card className="p-3 gradient-success text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Conducenti Attivi</p>
                    <p className="text-2xl font-bold">{mockStats.activeDrivers}</p>
                  </div>
                  <Users className="h-8 w-8 opacity-80" />
                </div>
              </Card>
              
              <Card className="p-3 gradient-alert text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Alert Attivi</p>
                    <p className="text-2xl font-bold">{mockStats.activeAlerts}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 opacity-80" />
                </div>
              </Card>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {activeView === 'dashboard' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
                {/* Map */}
                <Card className="shadow-elevated">
                  <div className="p-4 border-b">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Mappa in Tempo Reale</h3>
                      <Badge variant="outline" className="status-online">
                        Live
                      </Badge>
                    </div>
                  </div>
                  <div className="p-0">
                    <FleetMap selectedDriverId={selectedDriverId} />
                  </div>
                </Card>

                {/* Drivers List */}
                <Card className="shadow-elevated">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">Conducenti Attivi</h3>
                  </div>
                  <DriversList onDriverSelect={handleDriverSelect} />
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
    </div>
  );
};

export default FleetDashboard;