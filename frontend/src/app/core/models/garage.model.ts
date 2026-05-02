export interface Garage {
  id: number;
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  partner: boolean;
  latitude: number;
  longitude: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GaragePayload {
  name: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  partner: boolean;
  latitude: number;
  longitude: number;
}

/** Réponse de GET /api/garages/nearest */
export interface GarageNearestApiRow {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export type GarageWithDistance = Garage & { distanceKm: number };
