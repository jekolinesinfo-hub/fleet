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
import { useTranslation } from "@/contexts/I18nContext";
import { useFleetConfig } from "@/contexts/FleetConfigContext";
import LanguageSelector from "@/components/LanguageSelector";
import FleetTypeSelector from "@/components/FleetTypeSelector";

const DriverDashboard = () => {
  const [driverId, setDriverId] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceId] = useState(() => 'device_' + Math.random().toString(36).substr(2, 9));
  
  const { t } = useTranslation();
  const { config, fleetType } = useFleetConfig();

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
      alert(t('enterDriverId'));
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
    if (!stats.isOnShift) return { text: t('shiftEnded'), color: 'secondary' };
    if (needsBreak()) return { text: t('breakRequired'), color: 'destructive' };
    if (stats.remainingDrivingTime <= 60) return { text: t('shiftEndingSoon'), color: 'destructive' };
    if (stats.remainingDrivingTime <= 120) return { text: t('timeWarning'), color: 'secondary' };
    return { text: t('onDuty'), color: 'default' };
  };

  const getBreakAlertMessage = () => {
    if (fleetType === 'trucks') {
      return t('truckBreakAlert');
    }
    return t('breakAlert');
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
        <div className="max-w-md mx-auto">
          {/* Language selector at the top */}
          <div className="mb-6 flex justify-end">
            <LanguageSelector />
          </div>
          
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Truck className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">{t('driverDashboard')}</h1>
            <p className="text-muted-foreground mb-8">{t('startShift')}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('startShift')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FleetTypeSelector />
              
              <div>
                <Label htmlFor="driverId">{t('driverId')}</Label>
                <Input
                  id="driverId"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  placeholder={t('enterDriverId')}
                />
              </div>
              <Button 
                onClick={handleStartShift} 
                className="w-full"
                disabled={!driverId.trim()}
              >
                {t('startShiftBtn')}
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
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center space-x-3">
              <Truck className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">{t('driverDashboard')}</h1>
            </div>
            <LanguageSelector />
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-muted-foreground">{t('driverId')}: {driverId}</span>
            <Badge variant={status.color as any}>{status.text}</Badge>
          </div>
        </div>

        {/* Alert per pausa obbligatoria */}
        {needsBreak() && (
          <Alert>
            <Coffee className="h-4 w-4" />
            <AlertDescription>
              {getBreakAlertMessage()}
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiche principali */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('distanceToday')}</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.distanceToday} {t('kmUnit')}</div>
              <p className="text-xs text-muted-foreground">{t('effectiveDriving')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('drivingTime')}</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDrivingTime(stats.drivingTimeToday)}</div>
              <p className="text-xs text-muted-foreground">{t('effectiveDriving')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('remainingTime')}</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatDrivingTime(stats.remainingDrivingTime)}
              </div>
              <p className="text-xs text-muted-foreground">{t('dailyLimit')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('currentSpeed')}</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentPosition ? getSpeedKmh(currentPosition.speed) : 0} {t('kmhUnit')}
              </div>
              <p className="text-xs text-muted-foreground">
                {isTracking ? t('active') : t('inactive')}
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
                <span>{t('gpsStatus')}</span>
                <Badge variant={isTracking ? "default" : "secondary"}>
                  {isTracking ? t('active') : t('inactive')}
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
                    <span className="text-muted-foreground">{t('latitude')}:</span>
                    <span className="font-mono">{currentPosition.latitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('longitude')}:</span>
                    <span className="font-mono">{currentPosition.longitude.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('accuracy')}:</span>
                    <span className="font-mono">{currentPosition.accuracy?.toFixed(1)}{t('metersUnit')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('lastUpdate')}:</span>
                    <span className="text-xs">{new Date(currentPosition.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {isTracking ? t('acquiringPosition') : t('gpsInactive')}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>{t('safety')}</span>
                </div>
                <Badge variant={stats.speedViolationsToday > 0 ? "destructive" : "default"}>
                  {stats.speedViolationsToday} {t('violations')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('violationsToday')}:</span>
                  <span className="font-medium">{stats.speedViolationsToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('status')}:</span>
                  <Badge variant={stats.speedViolationsToday === 0 ? "default" : "destructive"}>
                    {stats.speedViolationsToday === 0 ? t('safeDriver') : t('warning')}
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
                <span>{t('violationsListTitle')}</span>
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
                          {new Date(violation.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {violation.recorded_speed_kmh} {t('kmhUnit')} in zona {violation.speed_limit_kmh} {t('kmhUnit')} 
                        (+{violation.excess_speed_kmh} {t('kmhUnit')})
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
              {t('keepAppOpen')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;