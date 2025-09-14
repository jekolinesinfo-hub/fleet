import { useState } from "react";
import { Bell, AlertTriangle, Clock, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Mock alerts
const mockAlerts = [
  {
    id: "A001",
    driverId: "D003",
    driverName: "Anna Verde",
    type: "Tempo di riposo",
    severity: "critical",
    message: "Superato limite giornaliero di guida continua. Riposo obbligatorio immediato.",
    time: "2 min fa",
    isActive: true,
    audioAlert: true
  },
  {
    id: "A002", 
    driverId: "D003",
    driverName: "Anna Verde",
    type: "Velocità",
    severity: "warning",
    message: "Superato limite di velocità di 10 km/h in zona urbana.",
    time: "15 min fa",
    isActive: true,
    audioAlert: false
  },
  {
    id: "A003",
    driverId: "D007",
    driverName: "Roberto Gialli", 
    type: "Manutenzione",
    severity: "info",
    message: "Tagliando veicolo in scadenza tra 500 km.",
    time: "1h fa",
    isActive: false,
    audioAlert: false
  }
];

const getSeverityInfo = (severity: string) => {
  switch (severity) {
    case 'critical':
      return {
        color: 'status-alert',
        bgColor: 'bg-alert/10',
        borderColor: 'border-alert/30',
        label: 'Critico'
      };
    case 'warning':
      return {
        color: 'bg-warning text-warning-foreground',
        bgColor: 'bg-warning/10',
        borderColor: 'border-warning/30', 
        label: 'Attenzione'
      };
    case 'info':
      return {
        color: 'bg-primary text-primary-foreground',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/30',
        label: 'Info'
      };
    default:
      return {
        color: 'bg-muted text-muted-foreground',
        bgColor: 'bg-muted/10',
        borderColor: 'border-muted/30',
        label: 'Sconosciuto'
      };
  }
};

const AlertCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mutedAlerts, setMutedAlerts] = useState<string[]>([]);
  
  const activeAlerts = mockAlerts.filter(alert => alert.isActive);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
  const audioAlerts = activeAlerts.filter(alert => alert.audioAlert && !mutedAlerts.includes(alert.id));

  const handleMuteAlert = (alertId: string) => {
    setMutedAlerts(prev => [...prev, alertId]);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    // In a real app, this would update the server
    console.log(`Alert ${alertId} acknowledged`);
  };

  return (
    <>
      {/* Audio Alert Simulation */}
      {audioAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <Card className="p-4 bg-alert text-alert-foreground animate-pulse-slow shadow-elevated border-alert">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5" />
              <span className="font-semibold">ALERT SONORO</span>
            </div>
            <p className="text-sm mt-1">{audioAlerts[0].message}</p>
            <Button 
              size="sm" 
              variant="secondary"
              className="mt-2"
              onClick={() => handleMuteAlert(audioAlerts[0].id)}
            >
              Silenzia
            </Button>
          </Card>
        </div>
      )}

      {/* Alert Button */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Bell className="h-4 w-4" />
            {activeAlerts.length > 0 && (
              <Badge 
                className={`absolute -top-2 -right-2 min-w-[20px] h-5 text-xs p-0 flex items-center justify-center ${
                  criticalAlerts.length > 0 ? 'status-alert' : 'bg-warning text-warning-foreground'
                }`}
              >
                {activeAlerts.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Centro Alert</h3>
              <Badge variant="outline">
                {activeAlerts.length} attivi
              </Badge>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {mockAlerts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nessun alert attivo
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {mockAlerts.map((alert) => {
                  const severityInfo = getSeverityInfo(alert.severity);
                  
                  return (
                    <Card 
                      key={alert.id} 
                      className={`p-3 ${severityInfo.bgColor} border ${severityInfo.borderColor} ${
                        !alert.isActive ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${severityInfo.color}`}>
                            {alert.severity === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {alert.severity === 'warning' && <Clock className="h-3 w-3 mr-1" />}
                            {severityInfo.label}
                          </Badge>
                          {alert.audioAlert && !mutedAlerts.includes(alert.id) && (
                            <Volume2 className="h-3 w-3 text-alert animate-pulse" />
                          )}
                        </div>
                        
                        <span className="text-xs text-muted-foreground">
                          {alert.time}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <div className="font-medium text-sm">{alert.driverName}</div>
                        <div className="text-xs text-muted-foreground">{alert.type}</div>
                      </div>
                      
                      <p className="text-sm mb-3">{alert.message}</p>
                      
                      {alert.isActive && (
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-xs"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            Conferma
                          </Button>
                          {alert.audioAlert && !mutedAlerts.includes(alert.id) && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-xs"
                              onClick={() => handleMuteAlert(alert.id)}
                            >
                              Silenzia
                            </Button>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          
          {activeAlerts.length > 0 && (
            <div className="p-4 border-t bg-muted/50">
              <Button size="sm" variant="outline" className="w-full">
                Visualizza tutti gli alert
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
};

export default AlertCenter;