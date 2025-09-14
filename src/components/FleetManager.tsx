import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFleetData } from "@/hooks/useFleetData";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

const FleetManager = () => {
  const { vehicles, drivers, refetch } = useFleetData();
  const { userOrganizations } = useOrganizations();

  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [driverId, setDriverId] = useState<string | "none">("none");
  const [orgId, setOrgId] = useState<string | "auto">(userOrganizations[0]?.organization_id || "auto");
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!deviceId.trim()) {
      toast.error("Inserisci un ID dispositivo");
      return;
    }

    const finalOrgId = orgId === "auto" ? userOrganizations[0]?.organization_id : orgId;
    if (!finalOrgId) {
      toast.error("Nessuna organizzazione disponibile");
      return;
    }

    setIsSaving(true);
    const safeDriverId = driverId !== "none" ? driverId : `UNASSIGNED`;
    const { error } = await supabase.from("driver_devices").insert({
      device_id: deviceId.trim(),
      device_name: deviceName.trim() || null,
      driver_id: safeDriverId,
      organization_id: finalOrgId,
      is_active: true,
    } as any);

    if (error) {
      toast.error(`Errore aggiunta veicolo: ${error.message}`);
    } else {
      toast.success("Veicolo aggiunto alla flotta");
      setDeviceId("");
      setDeviceName("");
      setDriverId("none");
      await refetch();
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("driver_devices").delete().eq("id", id);
    if (error) {
      toast.error(`Errore eliminazione: ${error.message}`);
    } else {
      toast.success("Veicolo eliminato");
      await refetch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestione Flotta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input placeholder="ID dispositivo" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />
          <Input placeholder="Nome veicolo (opzionale)" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
          <Select value={driverId} onValueChange={(v) => setDriverId(v as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Assegna conducente (opzionale)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nessun conducente</SelectItem>
              {drivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {userOrganizations.length > 1 && (
            <Select value={orgId} onValueChange={(v) => setOrgId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Organizzazione" />
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
          )}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleAdd} disabled={isSaving}>
            <Plus className="h-4 w-4 mr-2" /> Aggiungi
          </Button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {vehicles.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nessun veicolo nella flotta.</div>
          ) : (
            vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <div className="font-medium">{v.name}</div>
                  <div className="text-xs text-muted-foreground">ID: {v.device_id}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDelete(v.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetManager;
