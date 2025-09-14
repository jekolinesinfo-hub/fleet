import React, { useState } from 'react';
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
  Gauge,
  Coffee,
  Shield,
  Timer,
  Navigation
} from "lucide-react";
import { useDriverStats } from "@/hooks/useDriverStats";
import { useGPSTracking } from "@/hooks/useGPSTracking";

const DriverDashboard = () => {
  const [driverId, setDriverId] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceId] = useState(() => 'device_' + Math.random().toString(36).substr(2, 9));

  const { stats, violations, loading, needsBreak, formatDrivingTime } = useDriverStats(driverId);
  
  const { 
    isTracking, 
    currentPosition, 
    error: gpsError 
  } = useGPSTracking({
    driverId,
    deviceId,
    trackingEnabled: isInitialized && !!driverId
  });

  const handleStartShift = () => {
    if (!driverId.trim()) {
      alert('Inserisci il tuo ID driver');
      return;
    }
    setIsInitialized(true);
  };

  const getSpeedKmh = (speedMs?: number) => {
    if (!speedMs) return 0;
    return Math.round(speedMs * 3.6);
  };

  const getViolationColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'major': return 'destructive';
      case 'minor': return 'secondary';
      default: return 'outline';
    }
  };

  const getDrivingStatus = () => {
    if (!stats.isOnShift) return { text: 'Turno Terminato', color: 'secondary' };
    if (needsBreak()) return { text: 'Pausa Richiesta', color: 'destructive' };
    if (stats.remainingDrivingTime <= 60) return { text: 'Fine Turno Vicina', color: 'destructive' };
    if (stats.remainingDrivingTime <= 120) return { text: 'Attenzione Orario', color: 'secondary' };
    return { text: 'In Servizio', color: 'default' };
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
            <p className="text-muted-foreground mb-8">Sistema di controllo per autisti</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inizia il tuo turno</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="driverId">ID Driver</Label>
                <Input
                  id="driverId"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  placeholder="Inserisci il tuo ID driver"
                />
              </div>
              <Button 
                onClick={handleStartShift} 
                className="w-full"
                disabled={!driverId.trim()}
              >
                Avvia Turno
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const status = getDrivingStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Dashboard Autista</h1>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-muted-foreground">Driver ID: {driverId}</span>
            <Badge variant={status.color as any}>{status.text}</Badge>
          </div>
        </div>

        {/* Alert per pausa obbligatoria */}
        {needsBreak() && (
          <Alert>
            <Coffee className="h-4 w-4" />
            <AlertDescription>
              Hai guidato per oltre 4.5 ore. È obbligatoria una pausa di almeno 45 minuti.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiche principali */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distanza Oggi</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.distanceToday} km</div>
              <p className="text-xs text-muted-foreground">Percorsi nel turno</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Guida</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDrivingTime(stats.drivingTimeToday)}</div>
              <p className="text-xs text-muted-foreground">Di guida effettiva</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Rimanente</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatDrivingTime(stats.remainingDrivingTime)}
              </div>
              <p className="text-xs text-muted-foreground">Limite giornaliero</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Velocità Attuale</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentPosition ? getSpeedKmh(currentPosition.speed) : 0} km/h
              </div>
              <p className="text-xs text-muted-foreground">
                {isTracking ? 'GPS attivo' : 'GPS inattivo'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status GPS e Posizione */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Navigation className="h-5 w-5" />
                <span>Status GPS</span>
                <Badge variant={isTracking ? "default" : "secondary"}>
                  {isTracking ? "ATTIVO" : "INATTIVO"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gpsError && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{gpsError}</AlertDescription>
                </Alert>
              )}
              
              {currentPosition ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Latitudine:</span>
                    <span className="font-mono">{currentPosition.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Longitudine:</span>
                    <span className="font-mono">{currentPosition.longitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precisione:</span>
                    <span className="font-mono">{currentPosition.accuracy?.toFixed(1)}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ultimo aggiornamento:</span>
                    <span className="text-xs">{new Date(currentPosition.timestamp).toLocaleTimeString('it-IT')}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isTracking ? 'Acquisizione posizione in corso...' : 'GPS non attivo'}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Sicurezza</span>
                </div>
                <Badge variant={stats.speedViolationsToday > 0 ? "destructive" : "default"}>
                  {stats.speedViolationsToday} Infrazioni
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Infrazioni oggi:</span>
                  <span className="font-medium">{stats.speedViolationsToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={stats.speedViolationsToday === 0 ? "default" : "destructive"}>
                    {stats.speedViolationsToday === 0 ? 'Guida Sicura' : 'Attenzione'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista Infrazioni */}
        {violations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Infrazioni Oggi</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {violations.slice(0, 5).map((violation) => (
                  <div 
                    key={violation.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={getViolationColor(violation.severity) as any}>
                          {violation.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">
                          {new Date(violation.timestamp).toLocaleTimeString('it-IT')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {violation.recorded_speed_kmh} km/h in zona {violation.speed_limit_kmh} km/h 
                        (+{violation.excess_speed_kmh} km/h)
                      </p>
                    </div>
                  </div>
                ))}
                
                {violations.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... e altre {violations.length - 5} infrazioni
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer fisso */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs text-muted-foreground">
              ⚠️ Mantieni sempre l'app aperta durante il turno • Sistema monitorato h24
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;