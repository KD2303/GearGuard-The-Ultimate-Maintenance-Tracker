import api from './api';

export interface MapCoordinateUpdate {
  equipmentId: string;
  x: number | null;
  y: number | null;
  floorPlanId?: string | null;
}

export interface FloorPlanData {
  id?: string;
  name?: string;
  imageUrl: string;
}

export const mapService = {
  getFloorPlan: async (): Promise<FloorPlanData> => {
    const response = await api.get('/map/floor-plan');
    return response.data.data || response.data;
  },

  updateEquipmentCoordinates: async (updates: MapCoordinateUpdate[]): Promise<void> => {
    await api.put('/map/equipment/coordinates', { updates });
  },
};
