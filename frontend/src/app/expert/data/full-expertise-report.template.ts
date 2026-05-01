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
    lieuExamen: 'A preciser',
    assureNom: 'A completer',
    assureContrat: `CONT-CHAT-${token}`,
    assureDossier: `DOS-CHAT-${y}${mo}${da}`,
    mandantAssurance: 'A completer',
    mandantAgence: 'A completer',
    tiersNom: 'A completer',
    tiersContrat: 'A completer',
    tiersAssurance: 'A completer',
    tiersImmatriculation: '000XX000',
    vehiculeMarque: 'A completer',
    vehiculeType: 'A completer',
    vehiculeImmatriculation: '000TN000',
    vehiculeGenre: 'VP',
    vehiculeCouleur: 'A completer',
    vehiculePuissance: '-',
    vehiculeEnergie: 'DIESEL',
    vehiculeEtat: 'ASSEZ_BON',
    vehiculeNumeroSerie: 'A completer',
    vehiculeDateMiseCirculation: iso(new Date(y - 3, 0, 15)),
    vehiculeIndexKm: 0,
    natureDegats: 'A completer apres constat sur place.',
    conclusions: 'A completer apres analyse du dossier.',
    statutRapport: 'EN_COURS'
  };

  return { ...base, ...overrides };
}
