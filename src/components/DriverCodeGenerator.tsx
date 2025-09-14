import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Truck, Copy, CheckCircle, Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DriverCodeGenerator = () => {
  const [deviceCode, setDeviceCode] = useState<string>('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate unique device code based on device info
  useEffect(() => {
    const generateDeviceCode = () => {
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      
      // Create a unique hash-like code
      const deviceInfo = `${platform}-${userAgent.slice(-20)}-${timestamp}`;
      const hash = btoa(deviceInfo).replace(/[^A-Z0-9]/gi, '').substring(0, 8);
      
      return `DRV-${hash}-${random.toUpperCase()}`;
    };

    setDeviceCode(generateDeviceCode());
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(deviceCode);
      setCopied(true);
      toast({
        title: "Codice copiato!",
        description: "Il codice è stato copiato negli appunti",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Errore",
        description: "Impossibile copiare il codice",
        variant: "destructive",
      });
    }
  };

  const shareCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Codice Dispositivo Veicolo',
          text: `Il mio codice dispositivo è: ${deviceCode}`,
        });
      } catch (err) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Truck className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Fleet Tracker</h1>
          <p className="text-muted-foreground">App Conducente</p>
        </div>

        {/* Network Status */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex items-center gap-3 p-4">
            {isOnline ? (
              <>
                <Wifi className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-700">Connesso</span>
              </>
            ) : (
              <>
                <WifiOff className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-red-700">Disconnesso</span>
              </>
            )}
          </CardContent>
        </Card>

        {/* Device Code Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Codice Dispositivo</CardTitle>
            <CardDescription>
              Comunica questo codice al gestore della flotta per registrare il tuo veicolo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Code Display */}
            <div className="bg-muted/50 rounded-lg p-6 text-center border-2 border-dashed border-muted-foreground/20">
              <div className="text-2xl font-mono font-bold text-primary tracking-wider">
                {deviceCode}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={shareCode} 
                className="w-full"
                size="lg"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copiato!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Condividi Codice
                  </>
                )}
              </Button>
            </div>

            <Separator />

            {/* Instructions */}
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Istruzioni:</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Copia o condividi il codice qui sopra</li>
                  <li>Comunicalo al gestore della tua flotta</li>
                  <li>Attendi che il veicolo venga registrato nel sistema</li>
                  <li>L'app inizierà automaticamente il monitoraggio GPS</li>
                </ol>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Versione Driver
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  No Login Richiesto
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GPS Status Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="text-center text-sm text-muted-foreground">
              <p className="font-medium">Monitoraggio GPS</p>
              <p>Attivo automaticamente dopo la registrazione</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverCodeGenerator;