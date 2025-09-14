import { ArrowLeft, Phone, MapPin, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFleetData } from "@/hooks/useFleetData";

interface DriverDetailsProps {
  driverId: string;
  onBack: () => void;
}

const DriverDetails = ({ driverId, onBack }: DriverDetailsProps) => {
  const { drivers, vehicles, getLatestPositionForDriver } = useFleetData();
  const driver = drivers.find((d) => d.id === driverId);
  const position = getLatestPositionForDriver(driverId);
  const vehicle = vehicles.find((v) => v.driver_id === driverId);

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

  const status = position ? (position.is_moving ? 'In viaggio' : 'In sosta') : 'Offline';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla Dashboard
        </Button>

        <div className="flex items-center space-x-2">
          <Badge className={position ? (position.is_moving ? 'status-online' : 'bg-warning text-warning-foreground') : 'status-offline'}>
            {status}
          </Badge>
          <Button variant="outline" size="sm" disabled>
            <Phone className="h-4 w-4 mr-2" />
            Contatto
          </Button>
        </div>
      </div>

      {/* Informazioni Conducente */}
      <Card className="p-6 shadow-elevated">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {(driver.name || driver.email).split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{driver.name}</h2>
            <p className="text-muted-foreground">ID: {driver.id}</p>
            {vehicle && (
              <p className="text-sm flex items-center mt-1">
                <Truck className="h-4 w-4 mr-2" />
                {vehicle.type} - {vehicle.device_id}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" />
          <span>
            {position ? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}` : 'Posizione non disponibile'}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default DriverDetails;
