import { ExpertiseReport } from '../models/expertise-report.model';

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildFullExpertiseReportPayload(overrides?: Partial<ExpertiseReport>): Partial<ExpertiseReport> {
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const da = String(now.getDate()).padStart(2, '0');
  const accident = new Date(now);
  accident.setDate(accident.getDate() - 4);
  const token = `${y}${mo}${da}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase();

  const base: Partial<ExpertiseReport> = {
    numeroReference: `REF-${token}`,
    dateMission: iso(now),
    dateAccident: iso(accident),
    dateExamen: iso(now),
    lieuExamen: 'To be specified',
    assureNom: 'To be completed',
    assureContrat: `CONT-CHAT-${token}`,
    mandantAssurance: 'To be completed',
    mandantAgence: 'To be completed',
    tiersNom: 'To be completed',
    tiersContrat: 'To be completed',
    tiersAssurance: 'To be completed',
    tiersImmatriculation: '000XX000',
    vehiculeMarque: 'To be completed',
    vehiculeType: 'To be completed',
    vehiculeImmatriculation: '000TN000',
    vehiculeGenre: 'VP',
    vehiculeCouleur: 'To be completed',
    vehiculePuissance: '-',
    vehiculeEnergie: 'DIESEL',
    vehiculeEtat: 'ASSEZ_BON',
    vehiculeNumeroSerie: 'To be completed',
    vehiculeDateMiseCirculation: iso(new Date(y - 3, 0, 15)),
    vehiculeIndexKm: 0,
    natureDegats: 'To be completed after on-site inspection.',
    conclusions: 'To be completed after file analysis.',
    statutRapport: 'EN_COURS'
  };

  return { ...base, ...overrides };
}
