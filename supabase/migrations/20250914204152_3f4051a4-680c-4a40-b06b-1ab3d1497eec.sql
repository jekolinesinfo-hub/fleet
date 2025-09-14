-- Tabella per i driver registrati
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id text NOT NULL UNIQUE,
  full_name text,
  phone text,
  vehicle_plate text,
  vehicle_type text DEFAULT 'truck',
  organization_id uuid,
  device_id text,
  is_active boolean DEFAULT true,
  status text DEFAULT 'offline' CHECK (status IN ('offline', 'on_duty', 'break', 'driving')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabella per i viaggi
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id text NOT NULL,
  trip_code text UNIQUE,
  start_location text,
  end_location text,
  start_time timestamp with time zone DEFAULT now(),
  end_time timestamp with time zone,
  distance_km numeric DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes text,
  organization_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabella per gli alert/avvisi ai driver
CREATE TABLE IF NOT EXISTS public.driver_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id text NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('break_required', 'speed_violation', 'route_deviation', 'stop_request', 'emergency', 'info')),
  title text NOT NULL,
  message text NOT NULL,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_read boolean DEFAULT false,
  is_acknowledged boolean DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  organization_id uuid
);

-- Enable RLS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.driver_alerts ENABLE ROW LEVEL SECURITY;

-- Policies per drivers (accesso pubblico per auto-registrazione)
CREATE POLICY "Drivers can view and update their own data" ON public.drivers
  FOR ALL USING (true); -- Permissivo per permettere auto-registrazione

CREATE POLICY "Anyone can insert drivers" ON public.drivers
  FOR INSERT WITH CHECK (true);

-- Policies per trips
CREATE POLICY "Drivers can manage their trips" ON public.trips
  FOR ALL USING (true); -- Permissivo per ora

-- Policies per driver_alerts  
CREATE POLICY "Drivers can view their alerts" ON public.driver_alerts
  FOR SELECT USING (true);

CREATE POLICY "System can create alerts" ON public.driver_alerts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Drivers can update their alerts" ON public.driver_alerts
  FOR UPDATE USING (true);

-- Trigger per updated_at automatico
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips  
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();