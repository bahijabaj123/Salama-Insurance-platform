import type { DamageTypeCode } from './vehicle-damage-wireframe';

/** TVA affichée sur les lignes dommages (cohérent formulaire rapport). */
export const TVA_DOMMAGES_PCT = 19;

/**
 * Tarif de base TTC indicatif par identifiant de pièce (grille simplifiée carrosserie).
 * À ajuster selon votre barème interne / convention assureur.
 */
export const PART_BASE_TTC: Record<string, number> = {
  phare_g: 265,
  phare_d: 265,
  calandre: 175,
  capot: 395,
  pare_choc_av: 325,
  aile_av_g: 298,
  aile_av_d: 298,
  feu_g: 115,
  feu_d: 115,
  hayon: 455,
  pare_choc_ar: 278,
  aile_ar_g: 288,
  aile_ar_d: 288,
  porte_av_d: 498,
  porte_ar_d: 472,
  porte_av_g: 498,
  porte_ar_g: 472,
  retro_d: 88,
  retro_g: 88,
  bas_caisse_d: 165,
  bas_caisse_g: 165,
};

/** Base si la pièce n’est pas répertoriée. */
export const DEFAULT_BASE_TTC = 120;

/** Surcoût indicatif sur la base : enfoncé = tôlerie + peinture lourde ; rayé = peinture légère. */
export const SURCHARGE_RATE: Record<'ENFONCE' | 'RAYE', number> = {
  ENFONCE: 0.58,
  RAYE: 0.22,
};

export function getPartBaseTtc(partId: string): number {
  const v = PART_BASE_TTC[partId];
  return typeof v === 'number' && v > 0 ? v : DEFAULT_BASE_TTC;
}

/**
 * Estimation TTC indicatif (arrondi entier €) à partir de la base pièce et des types de dégât.
 */
export function estimateDamageMontantTtc(partId: string, types: DamageTypeCode[]): number {
  const base = getPartBaseTtc(partId);
  let extra = 0;
  if (types.includes('ENFONCE')) extra += base * SURCHARGE_RATE.ENFONCE;
  if (types.includes('RAYE')) extra += base * SURCHARGE_RATE.RAYE;
  return Math.round(base + extra);
}

/** Libellé court pour l’UI (coefficients). */
export function describePricingRule(): string {
  return `Part base incl. VAT + ${Math.round(SURCHARGE_RATE.ENFONCE * 100)}% if dented, + ${Math.round(SURCHARGE_RATE.RAYE * 100)}% if scratched (stackable).`;
}
