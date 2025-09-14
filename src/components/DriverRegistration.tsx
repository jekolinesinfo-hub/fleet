import { useState } from "react";
import { ArrowLeft, Copy, RefreshCw, UserPlus, Truck, Phone, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useOrganizations } from "@/hooks/useOrganizations";

interface DriverRegistrationProps {
  onBack: () => void;
}

const generateId = () => {
  return 'DRV-' + Math.random().toString(36).substr(2, 8).toUpperCase();
};

const DriverRegistration = ({ onBack }: DriverRegistrationProps) => {
  const { toast } = useToast();
  const { userOrganizations, organizations } = useOrganizations();
  const [generatedId, setGeneratedId] = useState(generateId());
  const [searchId, setSearchId] = useState('');
  const [newDriverData, setNewDriverData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: '',
    licenseNumber: '',
    company: ''
  });
  const [password, setPassword] = useState('');
  const [orgId, setOrgId] = useState<string | 'auto'>(userOrganizations[0]?.organization_id || 'auto');
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerateNewId = () => {
    setGeneratedId(generateId());
    toast({
      title: "Nuovo ID generato",
      description: "Un nuovo codice ID è stato creato per il conducente.",
    });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(generatedId);
    toast({
      title: "ID copiato",
      description: "Il codice ID è stato copiato negli appunti.",
    });
  };

  const handleSearch = async () => {
    if (searchId.length < 3) {
      toast({
        title: "ID troppo corto",
        description: "Inserisci almeno 3 caratteri per cercare.",
        variant: "destructive"
      });
      return;
    }

    // Search in real driver_devices table
    const { data: devices, error } = await supabase
      .from('driver_devices')
      .select('*')
      .ilike('device_id', `%${searchId}%`)
      .limit(5);

    if (error) {
      toast({ title: "Errore", description: "Impossibile effettuare la ricerca", variant: "destructive" });
      return;
    }

    if (devices && devices.length > 0) {
      const device = devices[0];
      // Try to get driver profile if driver_id exists
      let driverName = device.driver_id;
      if (device.driver_id && device.driver_id !== 'UNASSIGNED') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', device.driver_id)
          .single();
        
        driverName = profile?.full_name || profile?.email || device.driver_id;
      }

      toast({
        title: "Dispositivo trovato", 
        description: `${device.device_name || device.device_id} - Conducente: ${driverName}`,
      });
    } else {
      toast({
        title: "Nessun risultato",
        description: "Nessun dispositivo trovato con questo ID.",
        variant: "destructive"
      });
    }
  };

  const handleRegisterDriver = async () => {
    if (!newDriverData.name || !newDriverData.email || password.length < 8) {
      toast({
        title: "Campi obbligatori",
        description: "Nome, email e password (min 8 caratteri) sono obbligatori.",
        variant: "destructive"
      });
      return;
    }

    const targetOrg = orgId === 'auto' ? userOrganizations[0]?.organization_id : orgId;
    if (!targetOrg) {
      toast({ title: "Organizzazione mancante", description: "Impossibile determinare l'organizzazione.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const { error, data } = await supabase.functions.invoke('create-user', {
      body: {
        email: newDriverData.email.trim(),
        password,
        full_name: newDriverData.name.trim(),
        role: 'driver',
        organization_id: targetOrg,
      },
    });

    if (error) {
      toast({ title: 'Errore', description: error.message || 'Registrazione fallita', variant: 'destructive' });
    } else {
      toast({ title: 'Conducente registrato', description: `${newDriverData.name} può ora accedere con le credenziali inserite.` });
      // Reset form
      setNewDriverData({ name: '', phone: '', email: '', vehicleType: '', licenseNumber: '', company: '' });
      setPassword('');
    }
    setIsSaving(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla Dashboard
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Gestione Conducenti</h2>
          <p className="text-muted-foreground">Registra nuovi conducenti o cerca quelli esistenti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cerca Dispositivo */}
        <Card className="p-6 shadow-elevated">
          <div className="flex items-center space-x-2 mb-4">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Cerca Dispositivo Esistente</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="search-id">Cerca per ID Dispositivo</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="search-id"
                  placeholder="Inserisci ID dispositivo"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch}>
                  Cerca
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cerca un dispositivo già registrato nella tua flotta
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Come funziona</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Il conducente installa l'app mobile</li>
                <li>• Inserisce il codice ID dispositivo nell'app</li>
                <li>• L'app si collega automaticamente a questa dashboard</li>
                <li>• Il monitoraggio inizia immediatamente</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Registra Nuovo Conducente */}
        <Card className="p-6 shadow-elevated">
          <div className="flex items-center space-x-2 mb-4">
            <UserPlus className="h-5 w-5 text-success" />
            <h3 className="font-semibold">Registra Nuovo Conducente</h3>
          </div>
          
          <div className="space-y-4">
            {/* ID Generato */}
            <div>
              <Label>Codice ID Generato</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input 
                  value={generatedId} 
                  readOnly 
                  className="flex-1 font-mono bg-muted/50"
                />
                <Button size="icon" variant="outline" onClick={handleCopyId}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={handleGenerateNewId}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Questo codice sarà utilizzato dal conducente nell'app mobile
              </p>
            </div>

            {/* Form Registrazione */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="driver-name">Nome Completo *</Label>
                <Input
                  id="driver-name"
                  placeholder="es: Mario Rossi"
                  value={newDriverData.name}
                  onChange={(e) => setNewDriverData(prev => ({...prev, name: e.target.value}))}
                />
              </div>

              <div>
                <Label htmlFor="driver-phone">Telefono *</Label>
                <Input
                  id="driver-phone"
                  placeholder="+39 333 1234567"
                  value={newDriverData.phone}
                  onChange={(e) => setNewDriverData(prev => ({...prev, phone: e.target.value}))}
                />
              </div>

              <div>
                <Label htmlFor="driver-email">Email *</Label>
                <Input
                  id="driver-email"
                  type="email"
                  placeholder="mario.rossi@email.com"
                  value={newDriverData.email}
                  onChange={(e) => setNewDriverData(prev => ({...prev, email: e.target.value}))}
                />
              </div>

              <div>
                <Label htmlFor="driver-password">Password *</Label>
                <Input
                  id="driver-password"
                  type="password"
                  placeholder="Minimo 8 caratteri"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
              </div>

              <div>
                <Label htmlFor="vehicle-type">Tipo Veicolo *</Label>
                <Select onValueChange={(value) => setNewDriverData(prev => ({...prev, vehicleType: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo veicolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="camion">Camion</SelectItem>
                    <SelectItem value="furgone">Furgone</SelectItem>
                    <SelectItem value="taxi">Taxi</SelectItem>
                    <SelectItem value="autobus">Autobus</SelectItem>
                    <SelectItem value="motociclo">Motociclo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {userOrganizations.length > 1 && (
                <div>
                  <Label>Organizzazione</Label>
                  <Select value={orgId} onValueChange={(v) => setOrgId(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona organizzazione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Predefinita</SelectItem>
                      {userOrganizations.map((uo) => (
                        <SelectItem key={uo.organization_id} value={uo.organization_id}>
                          {uo.organization?.name || uo.organization_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            </div>

            <Button 
              onClick={handleRegisterDriver}
              className="w-full"
              disabled={isSaving}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isSaving ? 'Registrazione...' : 'Registra Conducente'}
            </Button>
          </div>
        </Card>
      </div>

            {/* Istruzioni App Mobile */}
            <Card className="p-6 shadow-elevated">
              <div className="flex items-center space-x-2 mb-4">
                <Truck className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Istruzioni per l'App Mobile</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                    1
                  </div>
                  <h4 className="font-medium mb-2">Download App</h4>
                  <p className="text-sm text-muted-foreground">
                    Il conducente scarica l'app mobile Fleet Tracker
                  </p>
                </div>
                
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                    2
                  </div>
                  <h4 className="font-medium mb-2">Accesso</h4>
                  <p className="text-sm text-muted-foreground">
                    Il conducente accede con le credenziali appena create
                  </p>
                </div>
                
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <div className="w-12 h-12 gradient-success rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                    3
                  </div>
                  <h4 className="font-medium mb-2">Monitoraggio Attivo</h4>
                  <p className="text-sm text-muted-foreground">
                    L'app inizia il tracking GPS automatico
                  </p>
                </div>
              </div>
            </Card>
    </div>
  );
};

export default DriverRegistration;