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
