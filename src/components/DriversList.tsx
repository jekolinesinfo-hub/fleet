import { Clock, MapPin, Truck, AlertTriangle, Phone, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock data conducenti
const mockDrivers = [
  {
    id: "D001",
    name: "Marco Rossi",
    vehicleId: "V001",
    vehicleType: "Camion",
    status: "driving",
    location: "A1 - Milano-Napoli, km 247",
    drivingTime: "4h 32m",
    restTime: "45m rimanenti",
    violations: 0,
    phone: "+39 333 1234567",
    lastUpdate: "2 min fa"
  },
  {
    id: "D002",
    name: "Luca Bianchi",
    vehicleId: "V002", 
    vehicleType: "Furgone",
    status: "resting",
    location: "Area di Servizio Flaminia Est",
    drivingTime: "3h 15m",
    restTime: "2h 15m",
    violations: 0,
    phone: "+39 347 8901234",
    lastUpdate: "5 min fa"
  },
  {
    id: "D003",
    name: "Anna Verde",
    vehicleId: "V003",
    vehicleType: "Taxi",
    status: "alert",
    location: "Centro Storico - Roma",
    drivingTime: "6h 45m",
    restTime: "SCADUTO",
    violations: 2,
    phone: "+39 329 5678901",
    lastUpdate: "1 min fa"
  },
  {
    id: "D004", 
    name: "Giuseppe Neri",
    vehicleId: "V004",
    vehicleType: "Camion",
    status: "driving",
    location: "SS7 - Foggia-Bari, km 89",
    drivingTime: "2h 18m",
    restTime: "6h 42m rimanenti", 
    violations: 0,
    phone: "+39 338 2345678",
    lastUpdate: "3 min fa"
  },
  {
    id: "D005",
    name: "Sofia Blu",
    vehicleId: "V005",
    vehicleType: "Furgone",
    status: "offline",
    location: "Deposito - Torino",
    drivingTime: "0h 0m",
    restTime: "8h 00m",
    violations: 0,
    phone: "+39 340 9876543",
    lastUpdate: "45 min fa"
  }
];

interface DriversListProps {
  onDriverSelect: (driverId: string) => void;
  onDriverTrack: (driverId: string) => void;
}

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'driving':
      return {
        color: 'status-online',
        label: 'In Viaggio',
        icon: <Truck className="h-3 w-3" />
      };
    case 'resting':
      return {
        color: 'bg-warning text-warning-foreground',
        label: 'In Sosta',
        icon: <Clock className="h-3 w-3" />
      };
    case 'alert':
      return {
        color: 'status-alert',
        label: 'Alert',
        icon: <AlertTriangle className="h-3 w-3" />
      };
    case 'offline':
      return {
        color: 'status-offline',
        label: 'Offline',
        icon: <MapPin className="h-3 w-3" />
      };
    default:
      return {
        color: 'bg-muted text-muted-foreground',
        label: 'Sconosciuto',
        icon: <MapPin className="h-3 w-3" />
      };
  }
};

const DriversList = ({ onDriverSelect, onDriverTrack }: DriversListProps) => {
  return (
    <div className="space-y-2 p-4 max-h-[400px] overflow-y-auto">
      {mockDrivers.map((driver) => {
        const statusInfo = getStatusInfo(driver.status);
        
        return (
          <Card 
            key={driver.id} 
            className="p-4 transition-all duration-200 hover:shadow-card hover:border-primary/50"
          >
            <div className="flex items-center justify-between">
              {/* Info Conducente */}
              <div 
                className="flex items-center space-x-3 flex-1 cursor-pointer" 
                onClick={() => onDriverSelect(driver.id)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="gradient-primary text-white font-semibold">
                    {driver.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-sm truncate">{driver.name}</h4>
                    <Badge className={`text-xs px-2 py-0.5 ${statusInfo.color}`}>
                      {statusInfo.icon}
                      <span className="ml-1">{statusInfo.label}</span>
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <Truck className="h-3 w-3" />
                      <span>{driver.vehicleType} - {driver.vehicleId}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{driver.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Azioni e Indicatori */}
              <div className="flex flex-col items-end space-y-2">
                {/* Pulsante Track GPS */}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDriverTrack(driver.id);
                  }}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  Traccia GPS
                </Button>
                
                {/* Indicatori di Stato */}
                <div className="text-right space-y-1">
                <div className="text-xs">
                  <span className="text-muted-foreground">Guida: </span>
                  <span className={`font-medium ${
                    driver.status === 'alert' ? 'text-alert' : 'text-foreground'
                  }`}>
                    {driver.drivingTime}
                  </span>
                </div>
                
                {driver.violations > 0 && (
                  <div className="flex items-center space-x-1 text-alert">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs font-medium">{driver.violations} violazioni</span>
                  </div>
                )}
                
                  <div className="text-xs text-muted-foreground">
                    {driver.lastUpdate}
                  </div>
                </div>
              </div>
            </div>

            {/* Barra di Stato Tempi */}
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Tempo di riposo</span>
                <span className={`font-medium ${
                  driver.restTime.includes('SCADUTO') || driver.restTime.includes('rimanenti') 
                    ? driver.restTime.includes('SCADUTO') ? 'text-alert' : 'text-success'
                    : 'text-muted-foreground'
                }`}>
                  {driver.restTime}
                </span>
              </div>
              
              {driver.status === 'alert' && (
                <div className="bg-alert/10 border border-alert/20 rounded-md p-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-alert" />
                    <span className="text-xs text-alert font-medium">
                      Tempo di riposo obbligatorio superato
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default DriversList;