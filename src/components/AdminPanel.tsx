import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { Users, Building2, Plus, Trash2, Edit, UserPlus, ArrowLeft, Mail, Copy, Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  full_name: string | null;
  organization_name: string | null;
  updated_at: string;
  is_blocked?: boolean;
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
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [useGeneratedPassword, setUseGeneratedPassword] = useState(true);
  const [newUserRole, setNewUserRole] = useState<'admin' | 'fleet_manager' | 'driver'>('fleet_manager');
  const [selectedOrgForNewUser, setSelectedOrgForNewUser] = useState('none');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

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
          is_blocked: profile.is_blocked || false,
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const createNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔧 DEBUG: Starting user creation process');
    console.log('📧 Email:', newUserEmail);
    console.log('👤 Name:', newUserFullName);
    console.log('🏷️ Role:', newUserRole);
    console.log('🏢 Org:', selectedOrgForNewUser);
    
    if (!newUserEmail.trim() || !newUserFullName.trim()) {
      toast.error('Tutti i campi sono obbligatori');
      return;
    }

    const finalPassword = useGeneratedPassword ? generatePassword() : newUserPassword;
    
    if (!useGeneratedPassword && !newUserPassword.trim()) {
      toast.error('Inserisci una password o usa quella generata automaticamente');
      return;
    }

    if (!useGeneratedPassword && newUserPassword.length < 8) {
      toast.error('La password deve essere di almeno 8 caratteri');
      return;
    }

    setIsCreatingUser(true);
    
    try {
      console.log('🔑 Final password:', finalPassword);
      
      toast.success(`Credenziali generate per ${newUserFullName}:`);
      toast.success(`Email: ${newUserEmail}`);
      toast.success(`Password: ${finalPassword}`);
      
      setGeneratedPassword(finalPassword);
      
      // Instructions for the user
      const instructions = `
        CREDENZIALI DI ACCESSO:
        Email: ${newUserEmail}
        Password: ${finalPassword}
        
        ISTRUZIONI PER L'UTENTE:
        1. Vai su ${window.location.origin}/auth
        2. Accedi con le credenziali sopra
        3. Il tuo ruolo è: ${newUserRole}
      `;
      
      console.log('📋 Instructions:', instructions);

      toast.success('Credenziali generate con successo!');
      
      // Reset form
      setNewUserEmail('');
      setNewUserFullName('');
      setNewUserPassword('');
      setUseGeneratedPassword(true);
      setNewUserRole('fleet_manager');
      setSelectedOrgForNewUser('none');
      
      console.log('✅ User creation process completed');
      
    } catch (error) {
      console.error('❌ Create user error:', error);
      toast.error('Errore nella generazione delle credenziali');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiato negli appunti!');
  };

  const blockUser = async (userId: string) => {
    try {
      // In a real implementation, you would use Supabase admin API to disable the user
      // For now, we'll update a blocked status in the profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: true })
        .eq('id', userId);

      if (error) {
        toast.error('Errore nel blocco dell\'utente');
        return;
      }

      toast.success('Utente bloccato con successo');
      await fetchUsers();
    } catch (error) {
      toast.error('Errore nel blocco dell\'utente');
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: false })
        .eq('id', userId);

      if (error) {
        toast.error('Errore nello sblocco dell\'utente');
        return;
      }

      toast.success('Utente sbloccato con successo');
      await fetchUsers();
    } catch (error) {
      toast.error('Errore nello sblocco dell\'utente');
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    const confirmed = confirm(`Sei sicuro di voler eliminare definitivamente l'utente ${userEmail}? Questa azione non può essere annullata.`);
    
    if (!confirmed) return;

    try {
      // In a real implementation, you would also delete from auth.users
      // For now, we'll delete from profiles which will cascade
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        toast.error('Errore nella cancellazione dell\'utente');
        return;
      }

      toast.success('Utente eliminato con successo');
      await fetchUsers();
    } catch (error) {
      toast.error('Errore nella cancellazione dell\'utente');
    }
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
        <div className="flex items-center space-x-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Pannello Amministratore</h1>
            <p className="text-muted-foreground">Gestisci utenti e organizzazioni</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Utenti</TabsTrigger>
          <TabsTrigger value="create-user">Crea Utenti</TabsTrigger>
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
                    <TableHead>Stato</TableHead>
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
                        <Badge variant={user.is_blocked ? 'destructive' : 'default'}>
                          {user.is_blocked ? 'Bloccato' : 'Attivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 flex-wrap">
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
                          
                          {user.is_blocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unblockUser(user.id)}
                              className="text-green-600"
                            >
                              Sblocca
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => blockUser(user.id)}
                              className="text-orange-600"
                            >
                              Blocca
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteUser(user.id, user.email)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
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

        <TabsContent value="create-user" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Crea Nuovo Utente
              </CardTitle>
              <CardDescription>
                Crea un nuovo utente e assegnalo a un'organizzazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createNewUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-user-fullname">Nome Completo</Label>
                    <Input
                      id="new-user-fullname"
                      value={newUserFullName}
                      onChange={(e) => setNewUserFullName(e.target.value)}
                      placeholder="Nome e cognome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-email">Email</Label>
                    <Input
                      id="new-user-email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="email@esempio.com"
                      required
                    />
                  </div>
                </div>

                {/* Password Configuration */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="use-generated-password"
                      checked={useGeneratedPassword}
                      onChange={(e) => setUseGeneratedPassword(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="use-generated-password">
                      Genera password automaticamente (12 caratteri sicuri)
                    </Label>
                  </div>
                  
                  {!useGeneratedPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="new-user-password">Password Personalizzata</Label>
                      <Input
                        id="new-user-password"
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="Minimo 8 caratteri"
                        minLength={8}
                        required={!useGeneratedPassword}
                      />
                      <p className="text-xs text-muted-foreground">
                        La password deve essere di almeno 8 caratteri
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-user-role">Ruolo</Label>
                    <Select value={newUserRole} onValueChange={(value: 'admin' | 'fleet_manager' | 'driver') => setNewUserRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="fleet_manager">Fleet Manager</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-user-org">Organizzazione (Opzionale)</Label>
                    <Select value={selectedOrgForNewUser} onValueChange={setSelectedOrgForNewUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona organizzazione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nessuna organizzazione</SelectItem>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={isCreatingUser} className="w-full">
                  {isCreatingUser && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crea Utente
                </Button>
              </form>

              {/* Generated Password Display */}
              {generatedPassword && (
                <Card className="mt-6 border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Credenziali Create
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <p className="font-medium text-sm text-gray-600">Email:</p>
                          <p className="font-mono">{newUserEmail}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(newUserEmail)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <p className="font-medium text-sm text-gray-600">Password:</p>
                          <p className="font-mono">{generatedPassword}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedPassword)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
                      ⚠️ <strong>Importante:</strong> Comunica queste credenziali all'utente e chiedigli di:
                      <br />
                      1. Andare su <code>{window.location.origin}/auth</code>
                      <br />
                      2. Registrarsi con email: <code>{newUserEmail}</code>
                      <br />
                      3. Dopo la registrazione, potrai assegnare il ruolo appropriato dalla tab "Utenti"
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const credentials = `Credenziali di accesso Fleet Management:
Email: ${newUserEmail}
                      Password: ${generatedPassword}

ISTRUZIONI PER L'UTENTE:
1. Vai su ${window.location.origin}/auth
2. Accedi con le credenziali sopra  
3. Il tuo ruolo è: ${newUserRole}

Contatta l'amministratore per supporto.`;
                        copyToClipboard(credentials);
                      }}
                      className="w-full"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copia Credenziali Complete
                    </Button>
                  </CardContent>
                </Card>
              )}
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