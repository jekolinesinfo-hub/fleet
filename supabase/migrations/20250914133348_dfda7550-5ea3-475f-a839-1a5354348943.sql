-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'fleet_manager', 'driver');

-- Create user roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'fleet_manager',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create organizations table for multi-tenancy
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create user-organization relationships
CREATE TABLE public.user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- Add organization_id to existing tables for multi-tenancy
ALTER TABLE public.driver_devices ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.gps_tracking ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.speed_violations ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create function to get user's organization IDs
CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY_AGG(organization_id) FROM public.user_organizations WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations" ON public.organizations
  FOR SELECT USING (
    owner_id = auth.uid() OR 
    id = ANY(public.get_user_organization_ids())
  );

CREATE POLICY "Organization owners can manage their organization" ON public.organizations
  FOR ALL USING (owner_id = auth.uid());

-- RLS Policies for user_organizations
CREATE POLICY "Admins and organization owners can manage user-org relationships" ON public.user_organizations
  FOR ALL USING (
    public.get_current_user_role() = 'admin' OR
    organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
  );

CREATE POLICY "Users can view their organization relationships" ON public.user_organizations
  FOR SELECT USING (user_id = auth.uid());

-- Update existing table policies for multi-tenancy
DROP POLICY IF EXISTS "Anyone can manage devices" ON public.driver_devices;
CREATE POLICY "Users can manage devices in their organizations" ON public.driver_devices
  FOR ALL USING (
    organization_id = ANY(public.get_user_organization_ids()) OR
    public.get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Anyone can manage GPS data" ON public.gps_tracking;
CREATE POLICY "Users can manage GPS data in their organizations" ON public.gps_tracking
  FOR ALL USING (
    organization_id = ANY(public.get_user_organization_ids()) OR
    public.get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Anyone can manage speed violations" ON public.speed_violations;
CREATE POLICY "Users can manage speed violations in their organizations" ON public.speed_violations
  FOR ALL USING (
    organization_id = ANY(public.get_user_organization_ids()) OR
    public.get_current_user_role() = 'admin'
  );

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Give first user admin role, others get fleet_manager
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'fleet_manager');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for updating updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();