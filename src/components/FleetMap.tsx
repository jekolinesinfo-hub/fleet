import { MapPin, Truck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock data per i veicoli sulla mappa
const mockVehicles = [
  { 
    id: "V001", 
    driver: "Marco Rossi", 
    type: "Camion", 
    status: "driving", 
    position: { x: 25, y: 30 },
    lastUpdate: "2 min fa"
  },
  { 
    id: "V002", 
    driver: "Luca Bianchi", 
    type: "Furgone", 
    status: "resting", 
    position: { x: 60, y: 45 },
    lastUpdate: "5 min fa"
  },
  { 
    id: "V003", 
    driver: "Anna Verde", 
    type: "Taxi", 
    status: "alert", 
    position: { x: 40, y: 60 },
    lastUpdate: "1 min fa"
  },
  { 
    id: "V004", 
    driver: "Giuseppe Neri", 
    type: "Camion", 
    status: "driving", 
    position: { x: 75, y: 25 },
    lastUpdate: "3 min fa"
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'driving':
      return 'text-success bg-success/10 border-success/20';
    case 'resting':
      return 'text-warning bg-warning/10 border-warning/20';
    case 'alert':
      return 'text-alert bg-alert/10 border-alert/20 animate-pulse';
    default:
      return 'text-muted-foreground bg-muted/10 border-border';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'driving':
      return <Truck className="h-4 w-4" />;
    case 'resting':
      return <MapPin className="h-4 w-4" />;
    case 'alert':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <MapPin className="h-4 w-4" />;
  }
};

const FleetMap = () => {
  return (
    <div className="relative w-full h-[400px] bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden">
      {/* Mappa Simulata con Grid */}
      <div className="absolute inset-0">
        {/* Grid lines per simulare strade */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--primary))" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        {/* Strade principali */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-primary/30 transform -translate-y-1/2"></div>
        <div className="absolute left-1/2 top-0 h-full w-1 bg-primary/30 transform -translate-x-1/2"></div>
      </div>

      {/* Veicoli sulla mappa */}
      {mockVehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          style={{
            left: `${vehicle.position.x}%`,
            top: `${vehicle.position.y}%`,
          }}
        >
          {/* Marker del veicolo */}
          <div className={`
            p-2 rounded-full border-2 transition-all duration-300 group-hover:scale-110
            ${getStatusColor(vehicle.status)}
            ${vehicle.status === 'alert' ? 'shadow-lg shadow-alert/25' : 'shadow-md'}
          `}>
            {getStatusIcon(vehicle.status)}
          </div>

          {/* Tooltip informazioni */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-card border rounded-lg shadow-elevated p-3 min-w-[200px]">
              <div className="text-sm font-semibold text-foreground">{vehicle.driver}</div>
              <div className="text-xs text-muted-foreground">ID: {vehicle.id}</div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline" className="text-xs">
                  {vehicle.type}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {vehicle.lastUpdate}
                </span>
              </div>
              {vehicle.status === 'alert' && (
                <div className="text-xs text-alert mt-1 font-medium">
                  ⚠️ Violazione normative
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-card">
        <div className="text-xs font-semibold mb-2">Legenda</div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-xs">In viaggio</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span className="text-xs">In sosta</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-alert animate-pulse"></div>
            <span className="text-xs">Alert attivo</span>
          </div>
        </div>
      </div>

      {/* Contatore Real-time */}
      <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-card">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span className="text-xs font-medium">Live Tracking</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {mockVehicles.length} veicoli monitorati
        </div>
      </div>
    </div>
  );
};

export default FleetMap;