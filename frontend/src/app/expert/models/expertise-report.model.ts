export interface DommageLine {
  designation?: string;
  pointChoc?: string;
  montant?: string | number;
  tauxTva?: string | number;
  estOccasion?: boolean;
  quantite?: number;
}

export interface MainOeuvreLine {
  typeTravail?: string;
  montant?: string | number;
  tauxTva?: string | number;
  description?: string;
}

export interface PieceJointeLine {
  typeDocument?: string;
  nombre?: number;
}

export interface ExpertiseReport {
  idRapport?: number;
  numeroReference?: string;
  dateMission?: string;
  dateAccident?: string;
  dateExamen?: string;
  lieuExamen?: string;
  accidentLatitude?: number;
  accidentLongitude?: number;
  accidentLocationLabel?: string;
  observation?: string;
  assureNom?: string;
  assureContrat?: string;
  mandantAssurance?: string;
  mandantAgence?: string;
  tiersNom?: string;
  tiersContrat?: string;
  tiersAssurance?: string;
  tiersImmatriculation?: string;
  vehiculeMarque?: string;
  vehiculeType?: string;
  vehiculeImmatriculation?: string;
  vehiculeGenre?: string;
  vehiculeCouleur?: string;
  vehiculePuissance?: string;
  vehiculeEnergie?: string;
  vehiculeEtat?: string;
  vehiculeNumeroSerie?: string;
  vehiculeDateMiseCirculation?: string;
  vehiculeIndexKm?: number;
  natureDegats?: string;
  statutRapport?: string;
  expertiseStatus?: string;
  totalFournituresHT?: string | number;
  tvaFournitures?: string | number;
  totalFournituresTTC?: string | number;
  totalMainOeuvreHT?: string | number;
  totalMainOeuvreTTC?: string | number;
  totalGeneral?: string | number;
  remise?: string | number;
  vetuste?: string | number;
  totalNet?: string | number;
  conclusions?: string;
  /** Data URL PNG de la signature (persistée côté serveur). */
  expertSignature?: string;
  findings?: string;
  estimatedRepairCost?: number;
  estimatedIndemnity?: number;
  expertPhotos?: string[];
  dommages?: DommageLine[];
  mainsOeuvre?: MainOeuvreLine[];
  piecesJointes?: PieceJointeLine[];
  expert?: { idExpert?: number; firstName?: string; lastName?: string; email?: string };
}

export interface ChatbotApiResponse {
  message?: string;
  sender?: string;
  timestamp?: string;
  intent?: string;
  metadata?: unknown;
}

export interface AccidentImageAnalysisResult {
  success: boolean;
  analysis?: string;
  errorMessage?: string;
}
