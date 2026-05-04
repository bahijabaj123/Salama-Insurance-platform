/** Vues du schéma carrosserie (citadine / berline simplifiée). */
export type CarWireframeView = 'avant' | 'droit' | 'arriere' | 'gauche';

export interface WireframeHitPart {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const WIRE_VIEW_TITLES: Record<CarWireframeView, string> = {
  avant: 'Front',
  droit: 'Right side',
  arriere: 'Rear',
  gauche: 'Left side',
};

/** Silhouette filaire (stroke seulement), viewBox commun 0 0 220 200 */
export const WIRE_OUTLINES: Record<CarWireframeView, string> = {
  avant:
    'M110 38 L165 52 L188 88 L195 128 L195 168 L25 168 L25 128 L32 88 L55 52 Z M55 52 L165 52 M70 88 L150 88 M85 118 L135 118',
  arriere:
    'M110 38 L55 52 L32 88 L25 128 L25 168 L195 168 L195 128 L188 88 L165 52 Z M55 52 L165 52 M70 88 L150 88 M85 118 L135 118',
  droit:
    'M28 168 L28 118 L38 78 L58 52 L108 42 L158 52 L178 78 L188 118 L188 168 Z M38 78 L178 78 M58 52 L158 52 M108 42 L108 168',
  gauche:
    'M192 168 L192 118 L182 78 L162 52 L112 42 L62 52 L42 78 L32 118 L32 168 Z M182 78 L42 78 M162 52 L62 52 M112 42 L112 168',
};

export const WIRE_PARTS: Record<CarWireframeView, WireframeHitPart[]> = {
  avant: [
    { id: 'phare_g', label: 'Left headlamp', x: 28, y: 92, w: 36, h: 38 },
    { id: 'phare_d', label: 'Right headlamp', x: 156, y: 92, w: 36, h: 38 },
    { id: 'calandre', label: 'Grille', x: 78, y: 108, w: 64, h: 28 },
    { id: 'capot', label: 'Hood', x: 62, y: 58, w: 96, h: 48 },
    { id: 'pare_choc_av', label: 'Front bumper', x: 38, y: 138, w: 144, h: 38 },
    { id: 'aile_av_g', label: 'Left front wing', x: 22, y: 100, w: 42, h: 52 },
    { id: 'aile_av_d', label: 'Right front wing', x: 156, y: 100, w: 42, h: 52 },
  ],
  arriere: [
    { id: 'feu_g', label: 'Left rear lamp', x: 32, y: 98, w: 34, h: 36 },
    { id: 'feu_d', label: 'Right rear lamp', x: 154, y: 98, w: 34, h: 36 },
    { id: 'hayon', label: 'Tailgate / trunk', x: 68, y: 62, w: 84, h: 52 },
    { id: 'pare_choc_ar', label: 'Rear bumper', x: 40, y: 138, w: 140, h: 36 },
    { id: 'aile_ar_g', label: 'Left rear wing', x: 22, y: 100, w: 40, h: 50 },
    { id: 'aile_ar_d', label: 'Right rear wing', x: 158, y: 100, w: 40, h: 50 },
  ],
  droit: [
    { id: 'pare_choc_av', label: 'Front bumper (side)', x: 168, y: 108, w: 32, h: 48 },
    { id: 'porte_av_d', label: 'Right front door', x: 118, y: 72, w: 48, h: 58 },
    { id: 'porte_ar_d', label: 'Right rear door', x: 58, y: 72, w: 48, h: 58 },
    { id: 'aile_ar_d', label: 'Rear wing (side)', x: 18, y: 98, w: 36, h: 52 },
    { id: 'retro_d', label: 'Right mirror', x: 132, y: 58, w: 28, h: 18 },
    { id: 'bas_caisse_d', label: 'Right rocker panel', x: 48, y: 138, w: 120, h: 22 },
  ],
  gauche: [
    { id: 'pare_choc_av', label: 'Front bumper (side)', x: 20, y: 108, w: 32, h: 48 },
    { id: 'porte_av_g', label: 'Left front door', x: 54, y: 72, w: 48, h: 58 },
    { id: 'porte_ar_g', label: 'Left rear door', x: 114, y: 72, w: 48, h: 58 },
    { id: 'aile_ar_g', label: 'Rear wing (side)', x: 166, y: 98, w: 36, h: 52 },
    { id: 'retro_g', label: 'Left mirror', x: 60, y: 58, w: 28, h: 18 },
    { id: 'bas_caisse_g', label: 'Left rocker panel', x: 52, y: 138, w: 120, h: 22 },
  ],
};

export const DAMAGE_TYPE_CODES = ['ENFONCE', 'RAYE'] as const;
export type DamageTypeCode = (typeof DAMAGE_TYPE_CODES)[number];

export const DAMAGE_TYPE_LABELS: Record<DamageTypeCode, string> = {
  ENFONCE: 'Dented',
  RAYE: 'Scratched',
};
