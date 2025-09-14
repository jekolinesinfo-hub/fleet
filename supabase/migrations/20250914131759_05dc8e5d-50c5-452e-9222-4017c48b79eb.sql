-- Crea funzione per aggiornamento timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Crea tabella per i dispositivi dei driver
CREATE TABLE public.driver_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id TEXT NOT NULL,
  device_id TEXT UNIQUE NOT NULL,
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crea tabella per il tracking GPS
CREATE TABLE public.gps_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(8,2),
  altitude DECIMAL(8,2),
  speed DECIMAL(8,2),
  heading DECIMAL(5,2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  battery_level INTEGER,
  is_moving BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Abilita RLS
ALTER TABLE public.driver_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_tracking ENABLE ROW LEVEL SECURITY;

-- Politiche RLS per driver_devices
CREATE POLICY "Anyone can manage devices" 
ON public.driver_devices 
FOR ALL 
USING (true);

-- Politiche RLS per gps_tracking  
CREATE POLICY "Anyone can manage GPS data" 
ON public.gps_tracking 
FOR ALL 
USING (true);

-- Indici per performance
CREATE INDEX idx_gps_tracking_driver_timestamp ON public.gps_tracking(driver_id, timestamp DESC);
CREATE INDEX idx_gps_tracking_timestamp ON public.gps_tracking(timestamp DESC);
CREATE INDEX idx_driver_devices_driver_id ON public.driver_devices(driver_id);

-- Trigger per aggiornamento timestamp
CREATE TRIGGER update_driver_devices_updated_at
BEFORE UPDATE ON public.driver_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Abilita realtime per entrambe le tabelle
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_devices;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_tracking;

-- Imposta replica identity per realtime
ALTER TABLE public.driver_devices REPLICA IDENTITY FULL;
ALTER TABLE public.gps_tracking REPLICA IDENTITY FULL;