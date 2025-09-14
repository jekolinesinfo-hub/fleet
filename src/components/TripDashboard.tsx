import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Truck, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  Route, 
  Navigation,
  Coffee,
  CheckCircle,
  Play,
  Square,
  Timer,
  Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGPSTracking } from "@/hooks/useGPSTracking";
import { Capacitor } from "@capacitor/core";

interface Driver {
  id: string;
  driver_id: string;
  full_name?: string;
  status: string;
  vehicle_plate?: string;
  vehicle_type: string;
}

interface Trip {
  id: string;
  trip_code: string;
  start_location?: string;
  start_time: string;
  distance_km: number;
  status: string;
}

interface DriverAlert {
  id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
}

const TripDashboard = () => {
  const [driverId, setDriverId] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [alerts, setAlerts] = useState<DriverAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [deviceId] = useState(() => 'device_' + Math.random().toString(36).substr(2, 9));
  
  const { toast } = useToast();
  const isNative = Capacitor.isNativePlatform();
  
  const { 
    isTracking, 
    currentPosition, 
    error: gpsError 
  } = useGPSTracking({
    driverId,
    deviceId,
    trackingEnabled: isInitialized && !!driver
  });

  // Registra o trova il driver
  const registerDriver = async (driverIdInput: string) => {
    try {
      setLoading(true);
      
      // Cerca se il driver esiste già
      const { data: existingDriver } = await supabase
        .from('drivers')
        .select('*')
        .eq('driver_id', driverIdInput)
        .single();

      if (existingDriver) {
        // Aggiorna status a on_duty
        const { error: updateError } = await supabase
          .from('drivers')
          .update({ 
            status: 'on_duty',
            device_id: deviceId,
            updated_at: new Date().toISOString()
          })
          .eq('driver_id', driverIdInput);

        if (updateError) throw updateError;
        
        setDriver({
          ...existingDriver,
          status: 'on_duty'
        });
      } else {
        // Crea nuovo driver
        const { data: newDriver, error: insertError } = await supabase
          .from('drivers')
          .insert({
            driver_id: driverIdInput,
            device_id: deviceId,
            status: 'on_duty',
            vehicle_type: 'truck'
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setDriver(newDriver);
      }

      // Cerca viaggio attivo o creane uno nuovo
      await initializeTrip(driverIdInput);
      
      setIsInitialized(true);
      toast({
        title: "Driver registrato!",
        description: "Benvenuto nella dashboard viaggi"
      });

    } catch (error: any) {
      console.error('Errore registrazione driver:', error);
      toast({
        title: "Errore",
        description: error.message || "Impossibile registrare il driver",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Inizializza o trova viaggio attivo
  const initializeTrip = async (driverIdInput: string) => {
    try {
      // Cerca viaggio attivo
      const { data: activeTrip } = await supabase
        .from('trips')
        .select('*')
        .eq('driver_id', driverIdInput)
        .eq('status', 'active')
        .single();

      if (activeTrip) {
        setCurrentTrip(activeTrip);
      } else {
        // Crea nuovo viaggio
        const tripCode = `TRIP-${Date.now()}`;
        const { data: newTrip, error } = await supabase
          .from('trips')
          .insert({
            driver_id: driverIdInput,
            trip_code: tripCode,
            start_location: 'Posizione GPS',
            status: 'active'
          })
          .select()
          .single();

        if (error) throw error;
        setCurrentTrip(newTrip);
      }
    } catch (error) {
      console.error('Errore inizializzazione viaggio:', error);
    }
  };

  // Carica alert per il driver
  const loadAlerts = async (driverIdInput: string) => {
    try {
      const { data, error } = await supabase
        .from('driver_alerts')
        .select('*')
        .eq('driver_id', driverIdInput)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Errore caricamento alert:', error);
    }
  };

  // Marca alert come letto
  const markAlertAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('driver_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
      
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Errore aggiornamento alert:', error);
    }
  };

  // Completa viaggio
  const completeTrip = async () => {
    if (!currentTrip || !driver) return;

    try {
      const { error } = await supabase
        .from('trips')
        .update({ 
          status: 'completed',
          end_time: new Date().toISOString()
        })
        .eq('id', currentTrip.id);

      if (error) throw error;

      // Aggiorna status driver a offline
      await supabase
        .from('drivers')
        .update({ status: 'offline' })
        .eq('driver_id', driver.driver_id);

      toast({
        title: "Viaggio completato!",
        description: "Grazie per il servizio"
      });

      // Reset stato
      setIsInitialized(false);
      setDriver(null);
      setCurrentTrip(null);
      setDriverId('');
    } catch (error: any) {
      toast({
        title: "Errore",
        description: "Impossibile completare il viaggio",
        variant: "destructive"
      });
    }
  };

  // Carica alert quando driver è inizializzato
  useEffect(() => {
    if (driver) {
      loadAlerts(driver.driver_id);
      // Ricarica alert ogni 30 secondi
      const interval = setInterval(() => {
        loadAlerts(driver.driver_id);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [driver]);

  const handleStartShift = () => {
    if (!driverId.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci il tuo ID driver",
        variant: "destructive"
      });
      return;
    }
    registerDriver(driverId.trim());
  };

  const getAlertIcon = (alertType: string) => {
    switch (alertType) {
      case 'break_required': return <Coffee className="h-4 w-4" />;
      case 'stop_request': return <Square className="h-4 w-4" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Truck className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Driver Dashboard</h1>
            <p className="text-muted-foreground mb-2">Gestione Viaggi</p>
            {isNative && (
              <Badge variant="secondary" className="text-xs">
                App Mobile
              </Badge>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inizia Turno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="driverId">ID Driver</Label>
                <Input
                  id="driverId"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  placeholder="Inserisci il tuo ID"
                  disabled={loading}
                />
              </div>
              <Button 
                onClick={handleStartShift} 
                className="w-full"
                disabled={!driverId.trim() || loading}
              >
                {loading ? (
                  <>
                    <Timer className="mr-2 h-4 w-4 animate-spin" />
                    Registrazione...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Inizia Turno
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center py-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <Truck className="h-8 w-8 text-primary" />
              <div className="text-left">
                <h1 className="text-2xl font-bold">Dashboard Driver</h1>
                <p className="text-sm text-muted-foreground">
                  {driver?.driver_id} • {driver?.vehicle_type}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge variant="default">In Servizio</Badge>
              {isNative && (
                <Badge variant="secondary" className="text-xs">Mobile</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Alert attivi */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Alert 
                key={alert.id} 
                variant={getAlertVariant(alert.severity) as any}
                className="cursor-pointer"
                onClick={() => markAlertAsRead(alert.id)}
              >
                {getAlertIcon(alert.alert_type)}
                <div className="flex-1">
                  <AlertDescription>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{alert.title}</div>
                        <div>{alert.message}</div>
                      </div>
                      <div className="text-xs opacity-70">
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </AlertDescription>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Informazioni Viaggio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Codice Viaggio</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{currentTrip?.trip_code || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">
                Iniziato: {currentTrip ? new Date(currentTrip.start_time).toLocaleTimeString() : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distanza</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{currentTrip?.distance_km || 0} km</div>
              <p className="text-xs text-muted-foreground">Oggi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status GPS</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge variant={isTracking ? "default" : "secondary"}>
                  {isTracking ? "Attivo" : "Inattivo"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {currentPosition ? `${currentPosition.latitude.toFixed(4)}, ${currentPosition.longitude.toFixed(4)}` : 'Nessuna posizione'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Errore GPS */}
        {gpsError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{gpsError}</AlertDescription>
          </Alert>
        )}

        {/* Controlli */}
        <Card>
          <CardHeader>
            <CardTitle>Controlli Viaggio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-3">
              <Button 
                onClick={completeTrip}
                variant="destructive"
                className="flex-1"
              >
                <Square className="mr-2 h-4 w-4" />
                Completa Viaggio
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Mantieni l'app aperta per il tracking GPS automatico
          </p>
        </div>
      </div>
    </div>
  );
};

export default TripDashboard;