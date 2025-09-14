import { ArrowLeft, Phone, MapPin, Clock, AlertTriangle, Truck, Calendar, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFleetData } from "@/hooks/useFleetData";
import { useAuth } from "@/hooks/useAuth";

// Mock data dettagliata per un conducente
const mockDriverDetails = {
  "D001": {
    id: "D001",
    name: "Marco Rossi",
    phone: "+39 333 1234567",
    vehicleId: "V001",
    vehicleType: "Camion Iveco Daily",
    status: "driving",
    location: "A1 - Milano-Napoli, km 247",
    currentTrip: {
      origin: "Milano - Deposito Centrale",
      destination: "Napoli - Porto",
      progress: 65,
      startTime: "08:30",
      estimatedArrival: "16:45"
    },
    workingHours: {
      today: "4h 32m",
      weekly: "38h 15m",
      maxDaily: "9h 00m",
      maxWeekly: "56h 00m"
    },
    restPeriods: {
      current: "45m rimanenti", 
      nextMandatory: "4h 28m",
      weeklyRest: "Completato 2 giorni fa"
    },
    violations: [],
    todayStats: {
      distance: "387 km",
      avgSpeed: "78 km/h",
      fuelConsumption: "24.5 L/100km",
      co2Emissions: "65.2 kg"
    },
    weeklyStats: {
      trips: 12,
      totalDistance: "2,847 km",
      onTimeDeliveries: "95%",
      violations: 0
    }
  },
  "D003": {
    id: "D003",
    name: "Anna Verde",
    phone: "+39 329 5678901",
    vehicleId: "V003",
    vehicleType: "Taxi Toyota Prius",
    status: "alert",
    location: "Centro Storico - Roma",
    currentTrip: {
      origin: "Stazione Termini",
      destination: "Aeroporto Fiumicino",
      progress: 0,
      startTime: "Non iniziato",
      estimatedArrival: "In attesa"
    },
    workingHours: {
      today: "6h 45m",
      weekly: "42h 30m", 
      maxDaily: "9h 00m",
      maxWeekly: "56h 00m"
    },
    restPeriods: {
      current: "SCADUTO da 1h 15m",
      nextMandatory: "IMMEDIATO",
      weeklyRest: "Scaduto"
    },
    violations: [
      {
        type: "Tempo di riposo",
        description: "Superato limite giornaliero di guida continua",
        time: "14:30",
        severity: "high"
      },
      {
        type: "Velocità",
        description: "Superato limite di 10 km/h in area urbana",
        time: "13:45", 
        severity: "medium"
      }
    ],
    todayStats: {
      distance: "234 km",
      avgSpeed: "32 km/h",
      fuelConsumption: "5.8 L/100km", 
      co2Emissions: "13.6 kg"
    },
    weeklyStats: {
      trips: 67,
      totalDistance: "1,456 km", 
      onTimeDeliveries: "88%",
      violations: 5
    }
  }
};

interface DriverDetailsProps {
  driverId: string;
  onBack: () => void;
}

const DriverDetails = ({ driverId, onBack }: DriverDetailsProps) => {
  const driver = mockDriverDetails[driverId as keyof typeof mockDriverDetails];
  
  if (!driver) {
    return (
      <div className="p-6">
        <Button onClick={onBack} variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla Dashboard
        </Button>
        <p>Conducente non trovato</p>
      </div>
    );
  }

  const isAlert = driver.status === 'alert';
  const drivingProgress = (parseFloat(driver.workingHours.today.replace('h', '').replace('m', '')) / 9) * 100;
  const weeklyProgress = (parseFloat(driver.workingHours.weekly.replace('h', '').replace('m', '')) / 56) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla Dashboard
        </Button>
        
        <div className="flex items-center space-x-2">
          <Badge className={isAlert ? 'status-alert' : 'status-online'}>
            {isAlert ? 'Alert Attivo' : 'Operativo'}
          </Badge>
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Chiama
          </Button>
        </div>
      </div>

      {/* Informazioni Conducente */}
      <Card className="p-6 shadow-elevated">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {driver.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{driver.name}</h2>
            <p className="text-muted-foreground">ID: {driver.id}</p>
            <p className="text-sm flex items-center mt-1">
              <Truck className="h-4 w-4 mr-2" />
              {driver.vehicleType} - {driver.vehicleId}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{driver.location}</span>
        </div>
      </Card>

      {/* Alert Attivi */}
      {isAlert && driver.violations.length > 0 && (
        <Card className="p-6 border-alert shadow-elevated">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-alert" />
            <h3 className="font-semibold text-alert">Violazioni Attive</h3>
          </div>
          
          <div className="space-y-3">
            {driver.violations.map((violation, index) => (
              <div key={index} className="bg-alert/5 border border-alert/20 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-alert">{violation.type}</span>
                  <Badge variant={violation.severity === 'high' ? 'destructive' : 'secondary'}>
                    {violation.severity === 'high' ? 'Critico' : 'Medio'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{violation.description}</p>
                <p className="text-xs text-muted-foreground">Rilevato alle {violation.time}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grid Principale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Viaggio Corrente */}
        <Card className="p-6 shadow-elevated">
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Viaggio Corrente</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Da:</span>
                <span className="font-medium">{driver.currentTrip.origin}</span>
              </div>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-muted-foreground">A:</span>
                <span className="font-medium">{driver.currentTrip.destination}</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso</span>
                <span>{driver.currentTrip.progress}%</span>
              </div>
              <Progress value={driver.currentTrip.progress} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Partenza:</span>
                <p className="font-medium">{driver.currentTrip.startTime}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Arrivo Stimato:</span>
                <p className="font-medium">{driver.currentTrip.estimatedArrival}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tempi di Lavoro */}
        <Card className="p-6 shadow-elevated">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Tempi di Lavoro</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Oggi</span>
                <span className={isAlert ? 'text-alert font-semibold' : ''}>
                  {driver.workingHours.today} / {driver.workingHours.maxDaily}
                </span>
              </div>
              <Progress 
                value={drivingProgress} 
                className={`h-2 ${drivingProgress > 85 ? '[&>div]:bg-alert' : '[&>div]:bg-success'}`}
              />
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Settimana</span>
                <span>{driver.workingHours.weekly} / {driver.workingHours.maxWeekly}</span>
              </div>
              <Progress 
                value={weeklyProgress} 
                className={`h-2 ${weeklyProgress > 85 ? '[&>div]:bg-warning' : '[&>div]:bg-success'}`}
              />
            </div>
            
            <div className="pt-2 border-t">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Riposo corrente:</span>
                  <span className={driver.restPeriods.current.includes('SCADUTO') ? 'text-alert font-semibold' : 'text-success'}>
                    {driver.restPeriods.current}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prossimo riposo:</span>
                  <span>{driver.restPeriods.nextMandatory}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Statistiche Giornaliere */}
        <Card className="p-6 shadow-elevated">
          <div className="flex items-center space-x-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Statistiche Oggi</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{driver.todayStats.distance}</div>
              <div className="text-xs text-muted-foreground">Distanza</div>
            </div>
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{driver.todayStats.avgSpeed}</div>
              <div className="text-xs text-muted-foreground">Velocità Media</div>
            </div>
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <div className="text-lg font-bold text-success">{driver.todayStats.fuelConsumption}</div>
              <div className="text-xs text-muted-foreground">Consumo</div>
            </div>
            <div className="text-center p-3 bg-secondary/50 rounded-lg">
              <div className="text-lg font-bold text-warning">{driver.todayStats.co2Emissions}</div>
              <div className="text-xs text-muted-foreground">CO₂</div>
            </div>
          </div>
        </Card>

        {/* Statistiche Settimanali */}
        <Card className="p-6 shadow-elevated">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Statistiche Settimana</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Viaggi completati</span>
              <span className="text-2xl font-bold text-primary">{driver.weeklyStats.trips}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Distanza totale</span>
              <span className="font-semibold">{driver.weeklyStats.totalDistance}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Consegne puntuali</span>
              <Badge className="bg-success text-success-foreground">
                {driver.weeklyStats.onTimeDeliveries}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Violazioni</span>
              <Badge variant={driver.weeklyStats.violations > 0 ? 'destructive' : 'secondary'}>
                {driver.weeklyStats.violations}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DriverDetails;