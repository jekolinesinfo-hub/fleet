import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOrganizations } from '@/hooks/useOrganizations';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Building2, Plus, Trash2, Edit, UserPlus } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  full_name: string | null;
  organization_name: string | null;
  updated_at: string;
  user_roles?: {
    role: 'admin' | 'fleet_manager' | 'driver';
  } | null;
}

const AdminPanel = () => {
  const { organizations, createOrganization, updateOrganization, deleteOrganization, addUserToOrganization, fetchOrganizationMembers } = useOrganizations();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [organizationMembers, setOrganizationMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [newOrgName, setNewOrgName] = useState('');
  const [editingOrg, setEditingOrg] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedOrganization) {
      fetchMembers();
    }
  }, [selectedOrganization]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch profiles first
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        toast.error('Errore nel caricamento degli utenti');
        return;
      }

      // Fetch roles for each user
      const usersWithRoles: User[] = [];
      
      for (const profile of profiles || []) {
        const { data: role } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', profile.id)
          .single();

        usersWithRoles.push({
          id: profile.id,
          email: profile.email,
          created_at: profile.created_at,
          full_name: profile.full_name,
          organization_name: profile.organization_name,
          updated_at: profile.updated_at,
          user_roles: role ? { role: role.role } : null
        });
      }

      setUsers(usersWithRoles);
    } catch (error) {
      toast.error('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!selectedOrganization) return;
    
    const members = await fetchOrganizationMembers(selectedOrganization);
    setOrganizationMembers(members);
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    await createOrganization(newOrgName);
    setNewOrgName('');
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrg) return;

    await updateOrganization(editingOrg.id, { name: editingOrg.name });
    setEditingOrg(null);
  };

  const handleDeleteOrganization = async (orgId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa organizzazione?')) {
      await deleteOrganization(orgId);
    }
  };

  const handleAddUserToOrganization = async (userId: string) => {
    if (!selectedOrganization) {
      toast.error('Seleziona un\'organizzazione');
      return;
    }

    await addUserToOrganization(userId, selectedOrganization);
    await fetchMembers();
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'fleet_manager' | 'driver') => {
    try {
      // First check if user has a role
      const { data: existingRole, error: fetchError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        toast.error('Errore nel recupero del ruolo utente');
        return;
      }

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);

        if (error) {
          toast.error('Errore nell\'aggiornamento del ruolo');
          return;
        }
      } else {
        // Create new role
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: newRole }]);

        if (error) {
          toast.error('Errore nella creazione del ruolo');
          return;
        }
      }

      toast.success('Ruolo aggiornato con successo');
      await fetchUsers();
    } catch (error) {
      toast.error('Errore nell\'aggiornamento del ruolo');
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'fleet_manager': return 'default';
      case 'driver': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pannello Amministratore</h1>
          <p className="text-muted-foreground">Gestisci utenti e organizzazioni</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Utenti</TabsTrigger>
          <TabsTrigger value="organizations">Organizzazioni</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestione Utenti
              </CardTitle>
              <CardDescription>
                Visualizza e gestisci tutti gli utenti del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Data Registrazione</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.full_name || 'Nome non specificato'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.user_roles?.role || 'guest')}>
                          {user.user_roles?.role || 'guest'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.user_roles?.role || 'guest'}
                            onValueChange={(newRole: 'admin' | 'fleet_manager' | 'driver') => 
                              updateUserRole(user.id, newRole)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="fleet_manager">Fleet Manager</SelectItem>
                              <SelectItem value="driver">Driver</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <UserPlus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Aggiungi a Organizzazione</DialogTitle>
                                <DialogDescription>
                                  Seleziona un'organizzazione per aggiungere questo utente
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select
                                  value={selectedOrganization}
                                  onValueChange={setSelectedOrganization}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona organizzazione" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {organizations.map((org) => (
                                      <SelectItem key={org.id} value={org.id}>
                                        {org.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button 
                                  onClick={() => handleAddUserToOrganization(user.id)}
                                  className="w-full"
                                >
                                  Aggiungi
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gestione Organizzazioni
              </CardTitle>
              <CardDescription>
                Crea e gestisci le organizzazioni del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleCreateOrganization} className="flex gap-2">
                <Input
                  placeholder="Nome organizzazione"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Crea
                </Button>
              </form>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data Creazione</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        {new Date(org.created_at).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingOrg({ ...org })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Modifica Organizzazione</DialogTitle>
                              </DialogHeader>
                              {editingOrg && (
                                <form onSubmit={handleUpdateOrganization} className="space-y-4">
                                  <div>
                                    <Label htmlFor="org-name">Nome</Label>
                                    <Input
                                      id="org-name"
                                      value={editingOrg.name}
                                      onChange={(e) => setEditingOrg({
                                        ...editingOrg,
                                        name: e.target.value
                                      })}
                                    />
                                  </div>
                                  <Button type="submit" className="w-full">
                                    Salva Modifiche
                                  </Button>
                                </form>
                              )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOrganization(org.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;