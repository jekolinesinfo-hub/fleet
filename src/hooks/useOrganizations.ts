import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface UserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  created_at: string;
  organization?: Organization;
}

interface OrganizationMember {
  id: string;
  user_id: string;
  organization_id: string;
  created_at: string;
  profiles?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  user_roles?: {
    role: 'admin' | 'fleet_manager' | 'driver';
  } | null;
}

export const useOrganizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userOrganizations, setUserOrganizations] = useState<UserOrganization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations();
    fetchUserOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching organizations:', error);
        return;
      }

      setOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          *,
          organization:organizations(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user organizations:', error);
        return;
      }

      setUserOrganizations(data || []);
    } catch (error) {
      console.error('Error fetching user organizations:', error);
    }
  };

  const createOrganization = async (name: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('organizations')
        .insert([{ 
          name,
          owner_id: userData.user?.id 
        }])
        .select()
        .single();

      if (error) {
        toast.error(`Errore nella creazione dell'organizzazione: ${error.message}`);
        return { error };
      }

      // Add creator to organization
      const { error: memberError } = await supabase
        .from('user_organizations')
        .insert([{
          organization_id: data.id,
          user_id: userData.user?.id
        }]);

      if (memberError) {
        console.error('Error adding creator to organization:', memberError);
      }

      await fetchOrganizations();
      await fetchUserOrganizations();
      toast.success('Organizzazione creata con successo!');
      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante la creazione dell\'organizzazione';
      toast.error(errorMessage);
      return { error: new Error(errorMessage) };
    }
  };

  const updateOrganization = async (id: string, updates: Partial<Organization>) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast.error(`Errore nell'aggiornamento dell'organizzazione: ${error.message}`);
        return { error };
      }

      await fetchOrganizations();
      toast.success('Organizzazione aggiornata con successo!');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante l\'aggiornamento dell\'organizzazione';
      toast.error(errorMessage);
      return { error: new Error(errorMessage) };
    }
  };

  const deleteOrganization = async (id: string) => {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error(`Errore nella cancellazione dell'organizzazione: ${error.message}`);
        return { error };
      }

      await fetchOrganizations();
      await fetchUserOrganizations();
      toast.success('Organizzazione cancellata con successo!');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante la cancellazione dell\'organizzazione';
      toast.error(errorMessage);
      return { error: new Error(errorMessage) };
    }
  };

  const addUserToOrganization = async (userId: string, organizationId: string) => {
    try {
      const { error } = await supabase
        .from('user_organizations')
        .insert([{
          user_id: userId,
          organization_id: organizationId
        }]);

      if (error) {
        toast.error(`Errore nell'aggiunta dell'utente all'organizzazione: ${error.message}`);
        return { error };
      }

      await fetchUserOrganizations();
      toast.success('Utente aggiunto all\'organizzazione con successo!');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante l\'aggiunta dell\'utente all\'organizzazione';
      toast.error(errorMessage);
      return { error: new Error(errorMessage) };
    }
  };

  const removeUserFromOrganization = async (userId: string, organizationId: string) => {
    try {
      const { error } = await supabase
        .from('user_organizations')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (error) {
        toast.error(`Errore nella rimozione dell'utente dall'organizzazione: ${error.message}`);
        return { error };
      }

      await fetchUserOrganizations();
      toast.success('Utente rimosso dall\'organizzazione con successo!');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore durante la rimozione dell\'utente dall\'organizzazione';
      toast.error(errorMessage);
      return { error: new Error(errorMessage) };
    }
  };

  const fetchOrganizationMembers = async (organizationId: string): Promise<OrganizationMember[]> => {
    try {
      // Fetch user organizations first
      const { data: userOrgs, error: userOrgError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('organization_id', organizationId);

      if (userOrgError) {
        console.error('Error fetching user organizations:', userOrgError);
        return [];
      }

      // Fetch profiles and roles for each user
      const members: OrganizationMember[] = [];
      
      for (const userOrg of userOrgs || []) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userOrg.user_id)
          .single();

        // Fetch role
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userOrg.user_id)
          .single();

        members.push({
          id: userOrg.id,
          user_id: userOrg.user_id,
          organization_id: userOrg.organization_id,
          created_at: userOrg.created_at,
          profiles: profile ? {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name
          } : null,
          user_roles: role ? { role: role.role } : null
        });
      }

      return members;
    } catch (error) {
      console.error('Error fetching organization members:', error);
      return [];
    }
  };

  return {
    organizations,
    userOrganizations,
    loading,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    addUserToOrganization,
    removeUserFromOrganization,
    fetchOrganizationMembers,
    refetch: () => {
      fetchOrganizations();
      fetchUserOrganizations();
    }
  };
};