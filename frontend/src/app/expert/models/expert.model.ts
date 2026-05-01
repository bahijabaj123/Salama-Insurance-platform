export type ExpertStatus = 'ACTIVE' | 'INACTIVE' | 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';

export type InterventionZone =
  | 'Tunis' | 'Ariana' | 'Ben_Arous' | 'Manouba' | 'Nabeul' | 'Zaghouan'
  | 'Bizerte' | 'Beja' | 'Jendouba' | 'Kef' | 'Siliana' | 'Sousse'
  | 'Monastir' | 'Mahdia' | 'Sfax' | 'Kairouan' | 'Kasserine' | 'Sidi_Bouzid'
  | 'Gabes' | 'Medenine' | 'Tataouine' | 'Gafsa' | 'Tozeur' | 'Kebili';

export interface Expert {
  idExpert?: number;
  lastName: string;
  firstName: string;
  photo?: string;
  photoUrl?: string;
  avatar?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  email: string;
  phone?: string;
  fax?: string;
  specialty?: string;
  status?: ExpertStatus;
  interventionZone?: InterventionZone;
  registrationDate?: string;
  yearsOfExperience?: number;
  currentWorkload?: number;
  available?: boolean;
  performanceScore?: number;
  activeClaims?: number;
  averageProcessingTime?: number;
  validationRate?: number;
  maxWorkload?: number;
  lastAssignmentDate?: string;
}

export const INTERVENTION_ZONES: InterventionZone[] = [
  'Tunis', 'Ariana', 'Ben_Arous', 'Manouba', 'Nabeul', 'Zaghouan',
  'Bizerte', 'Beja', 'Jendouba', 'Kef', 'Siliana', 'Sousse',
  'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi_Bouzid',
  'Gabes', 'Medenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kebili'
];

export const EXPERT_STATUSES: ExpertStatus[] = ['ACTIVE', 'INACTIVE', 'AVAILABLE', 'BUSY', 'UNAVAILABLE'];
