import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useFleetConfig } from '@/contexts/FleetConfigContext';
import { useTranslation } from '@/contexts/I18nContext';
import { Truck } from 'lucide-react';

const FleetTypeSelector = () => {
  const { fleetType, setFleetType, availableFleetTypes } = useFleetConfig();
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Label className="flex items-center space-x-2">
        <Truck className="h-4 w-4" />
        <span>{t('fleetType')}</span>
      </Label>
      <Select value={fleetType} onValueChange={setFleetType}>
        <SelectTrigger>
          <SelectValue placeholder={t('selectFleetType')}>
            <div className="flex items-center space-x-2">
              <span>{availableFleetTypes.find(type => type.code === fleetType)?.icon}</span>
              <span>{t(availableFleetTypes.find(type => type.code === fleetType)?.name as any)}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableFleetTypes.map((type) => (
            <SelectItem key={type.code} value={type.code}>
              <div className="flex items-center space-x-2">
                <span>{type.icon}</span>
                <span>{t(type.name as any)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default FleetTypeSelector;