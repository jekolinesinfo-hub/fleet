import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MapPin, Smartphone, Battery, Navigation, Clock, Truck } from "lucide-react";
import { useGPSTracking } from "@/hooks/useGPSTracking";

const DriverTracker: React.FC = () => {
  const [driverId, setDriverId] = useState('');
  const [deviceId] = useState(() => 'device_' + Math.random().toString(36).substr(2, 9));
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [driverName, setDriverName] = useState('');

  const { isTracking, currentPosition, error, startTracking, stopTracking } = useGPSTracking({
    driverId,
    deviceId,
    trackingEnabled
  });

  const handleToggleTracking = () => {
    if (!driverId.trim()) {
      alert('Inserisci il tuo ID driver prima di iniziare il tracking');
      return;
    }
    setTrackingEnabled(!trackingEnabled);
  };

  const formatCoordinate = (coord: number, type: 'lat' | 'lng') => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
  };

  const getSpeedKmh = (speedMs?: number) => {
    if (!speedMs) return 0;
    return Math.round(speedMs * 3.6);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Truck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Driver App</h1>
          <p className="text-muted-foreground">Tracking GPS per autisti</p>
        </div>

        {/* Setup Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Configurazione</span>
            </CardTitle>
            <CardDescription>
              Inserisci i tuoi dati per iniziare il tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="driverName">Nome Driver</Label>
              <Input
                id="driverName"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Es: Mario Rossi"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="driverId">ID Driver</Label>
              <Input
                id="driverId"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                placeholder="Es: V001, V002..."
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">Tracking GPS</span>
              </div>
              <Switch
                checked={trackingEnabled}
                onCheckedChange={handleToggleTracking}
                disabled={!driverId.trim()}
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Navigation className="h-5 w-5" />
                <span>Stato GPS</span>
              </div>
              <Badge variant={isTracking ? "default" : "secondary"}>
                {isTracking ? "ATTIVO" : "INATTIVO"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg mb-4">
                <p className="text-sm font-medium">Errore: {error}</p>
              </div>
            )}

            {currentPosition ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Latitudine</p>
                    <p className="font-mono">{formatCoordinate(currentPosition.latitude, 'lat')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Longitudine</p>
                    <p className="font-mono">{formatCoordinate(currentPosition.longitude, 'lng')}</p>
                  </div>
                  
                  {currentPosition.speed !== undefined && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Velocità</p>
                        <p className="font-mono">{getSpeedKmh(currentPosition.speed)} km/h</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Precisione</p>
                        <p className="font-mono">{currentPosition.accuracy?.toFixed(1)}m</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Ultimo aggiornamento</span>
                  </div>
                  <span className="text-sm font-mono">
                    {new Date(currentPosition.timestamp).toLocaleTimeString('it-IT')}
                  </span>
                </div>
              </div>
            ) : isTracking ? (
              <div className="text-center py-4">
                <div className="animate-pulse">
                  <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Acquisizione posizione GPS...</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Attiva il tracking per iniziare il monitoraggio GPS
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Battery className="h-5 w-5" />
              <span>Info Dispositivo</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Device ID:</span>
                <span className="font-mono">{deviceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Driver ID:</span>
                <span className="font-mono">{driverId || 'Non configurato'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stato:</span>
                <Badge variant={isTracking ? "default" : "outline"}>
                  {isTracking ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {isTracking && (
            <Button 
              variant="destructive" 
              className="w-full" 
              onClick={() => setTrackingEnabled(false)}
            >
              Ferma Tracking
            </Button>
          )}
          
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Mantieni l'app aperta per il tracking continuo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverTracker;