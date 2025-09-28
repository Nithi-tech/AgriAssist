export interface CropDetails {
  id: string;
  name: string;
  variety: string;
  plantingDate: string;
  expectedHarvestDate: string;
  irrigationType: string;
  fertilizerDetails: string;
  notes: string;
  isLocked: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sensors?: LinkedSensor[];
}

export interface LinkedSensor {
  id: string;
  type: 'soil_moisture' | 'pH' | 'temperature' | 'humidity';
  name: string;
  status: 'active' | 'inactive';
  lastReading?: {
    value: number;
    timestamp: string;
    unit: string;
  };
}

export interface CropFormData {
  name: string;
  variety: string;
  plantingDate: string;
  expectedHarvestDate: string;
  irrigationType: string;
  fertilizerDetails: string;
  notes?: string;
}
