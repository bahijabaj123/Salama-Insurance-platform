// ─── Enums (doivent correspondre EXACTEMENT aux enums Java) ──────────────────

export enum ClaimStatus {
  OPENED             = 'OPENED',
  ASSIGNED_TO_EXPERT = 'ASSIGNED_TO_EXPERT',
  UNDER_EXPERTISE    = 'UNDER_EXPERTISE',
  CLOSED             = 'CLOSED',
  REJECTED           = 'REJECTED',
}

export enum SeverityLevel {
  LOW      = 'LOW',
  MEDIUM   = 'MEDIUM',
  HIGH     = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum FraudRiskLevel {
  LOW    = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH   = 'HIGH',
}

// ─── Expert (correspond à ExpertHassen) ──────────────────────────────────────

export interface Expert {
   idExpert: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialty: string;
  interventionZone: string;
  status: string;
  available: boolean;
  performanceScore: number;
  activeClaims: number;
  currentWorkload: number;
  maxWorkload: number;
  yearsOfExperience: number;
  address?: string;
  city?: string;

  // Champs calculés côté frontend
  get fullName(): string;
}

// Helper function pour construire le nom complet
export function expertFullName(e: Expert): string {
  return `${e.firstName} ${e.lastName}`;
}

// ─── Accident ─────────────────────────────────────────────────────────────────

// Dans src/app/core/models/claim.model.ts

// Accident interface
export interface Accident {
  id: number;
  accidentDate: string;      // "yyyy-MM-dd"
  time: string;              // "HH:mm:ss"
  location: string;
  injuries: boolean;
  propertyDamage: boolean;
  observations: string;
  sketch: string;
  status: string;
  damagedZones: number[];
  drivers: Driver[];
  photos: Photo[];
}

export interface Driver {
  id: number;
  driverType: string;
  name: string;              // ← Important: c'est "name" pas "fullName"
  cin: string;
  address: string;
  phoneNumber: string;
  licenseNumber: string;
  insuranceCompany: string;
  policyNumber: string;
  licensePlate: string;
  carMake: string;
  signature: string;
  dateOfBirth: string;
  email: string;
  circumstances: string[];
}

export interface Photo {
  id: number;
  photoUrl: string;
  description: string;
  uploadedAt: string;
}
// ─── Claim (correspond EXACTEMENT à l'entité Claim Java) ─────────────────────

// src/app/core/models/claim.model.ts

export interface Claim {
   id: number;
  reference: string;
  status: ClaimStatus;
  region: string;
  openingDate: string;
  assignedDate: string | null;
  closingDate: string | null;
  lastModifiedDate: string;
  notes?: string;
  urgencyScore: number;
  severityLevel?: string;
  estimatedAmount?: number;
      expert?: Expert | null;
      Expert?: Expert | null;

  // Relations
  accident?: Accident;
 client?: {            
    id: number;
    email: string;
    fullName: string;
    role?: string;
  };
  insurer?: any;
  actionHistory?: string[];
  latestExpertiseReport?: any;
}

export function getClaimExpert(claim: Claim): Expert | null | undefined {
  return claim.expert || claim.Expert;
}


// ─── ClaimResponseDTO (correspond au DTO Spring) ─────────────────────────────

export interface ClaimResponseDTO {
  id:            number;
  reference:     string;
  status:        string;
  region:        string;
  openingDate:   string;
  assignedDate?: string;
  notes?:        string;
  expert?: {
    id:         number;
    name:       string;
    speciality: string;
  };
}

// ─── Fraud ───────────────────────────────────────────────────────────────────

export interface FraudAnalysis {
  id:              number;
  claimId?:        number;
  claimReference?: string;
  fraudScore:      number;       // Note: fraudScore (pas riskScore) selon FraudAnalysisDTO
  riskLevel:       FraudRiskLevel;
  triggeredRules?: FraudRule[];  // List<FraudRule> selon le service
  recommendation?: string;
  analysisDate?:   string;       // analysisDate selon FraudAnalysisDTO
}

export interface FraudRule {
  code:        string;
  description: string;
  details?:    string;
}

export interface FraudDashboard {
  totalAnalyses:  number;
  highRisk:       number;
  mediumRisk:     number;
  lowRisk:        number;
  averageScore:   number;
  latestAnalyses: FraudDashboardItem[];
  highRiskCount:  number;
  topRules:       Record<string, number>;
}

export interface FraudDashboardItem {
  id:            number;
  claimId:       number;
  claimReference: string;
  fraudScore:    number;
  riskLevel:     FraudRiskLevel;
  analysisDate:  string;
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export interface ClaimStatistics {
  totalClaims:       number;
  byStatus:          Record<string, number>;
  byRegion:          Record<string, number>;
  avgProcessingDays?: number;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PagedResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  size:          number;
  number:        number;
}

// ─── Labels et couleurs (pour le template HTML) ───────────────────────────────

export const STATUS_LABELS: Record<ClaimStatus, string> = {
  [ClaimStatus.OPENED]:             'Ouvert',
  [ClaimStatus.ASSIGNED_TO_EXPERT]: 'Expert assigné',
  [ClaimStatus.UNDER_EXPERTISE]:    'En expertise',
  [ClaimStatus.CLOSED]:             'Clôturé',
  [ClaimStatus.REJECTED]:           'Rejeté',
};

export const STATUS_BADGE_CSS: Record<ClaimStatus, string> = {
  [ClaimStatus.OPENED]: 'badge-opened',
  [ClaimStatus.ASSIGNED_TO_EXPERT]: 'badge-assigned',
  [ClaimStatus.UNDER_EXPERTISE]: 'badge-expertise',
  [ClaimStatus.CLOSED]: 'badge-closed',
  [ClaimStatus.REJECTED]: 'badge-rejected',
};

export const STATUS_CSS: Record<ClaimStatus, string> = {
  [ClaimStatus.OPENED]:             'status-opened',
  [ClaimStatus.ASSIGNED_TO_EXPERT]: 'status-assigned',
  [ClaimStatus.UNDER_EXPERTISE]:    'status-expertise',
  [ClaimStatus.CLOSED]:             'status-closed',
  [ClaimStatus.REJECTED]:           'status-rejected',
};

export const SEVERITY_CSS: Record<SeverityLevel, string> = {
  [SeverityLevel.LOW]:      'severity-low',
  [SeverityLevel.MEDIUM]:   'severity-medium',
  [SeverityLevel.HIGH]:     'severity-high',
  [SeverityLevel.CRITICAL]: 'severity-critical',
};
