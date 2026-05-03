/**
 * Heuristique locale (sans appel serveur obligatoire) pour estimer un profil de risque
 * à partir des dégâts saisis sur le schéma et, si disponible, de la date/heure du sinistre.
 */

export type FraudRiskBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FraudFactor {
  code: string;
  label: string;
  detail: string;
  points: number;
  severity: 'info' | 'watch' | 'alert';
}

export interface FraudRadarAxes {
  /** Déclaration / créneau horaire */
  temporal: number;
  /** Dispersion sur les vues du véhicule */
  spatial: number;
  /** Charge financière indicative */
  financial: number;
  /** Cohérence des types de dommage */
  pattern: number;
  /** Complexité (nombre de lignes) */
  complexity: number;
}

export interface DamageLineLite {
  view: string;
  partId: string;
  montantTtc: number;
  types: string[];
}

/** Estimation cinématique à partir de la répartition des dégâts sur le schéma 4 vues. */
export interface AccidentScenarioEstimate {
  code: string;
  title: string;
  narrative: string;
  /** Libellé affiché : ex. « Confiance élevée » */
  confidence: string;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function isNightLocal(d: Date): boolean {
  const h = d.getHours();
  return h >= 22 || h < 6;
}

function bandFromScore(score: number): FraudRiskBand {
  if (score >= 88) return 'CRITICAL';
  if (score >= 62) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
}

/**
 * Infère comment l’accident a pu se produire (véhicule assuré = schéma unique) :
 * dominante arrière → souvent tamponnement ; avant → choc frontal / obstacle ; etc.
 */
export function estimateAccidentScenario(entries: DamageLineLite[]): AccidentScenarioEstimate {
  if (!entries.length) {
    return {
      code: 'unknown',
      title: 'Aucun dégât saisi',
      narrative: 'Validez au moins une zone sur le schéma pour obtenir une estimation.',
      confidence: '—',
    };
  }

  const keys = ['avant', 'arriere', 'gauche', 'droit'] as const;
  const w: Record<(typeof keys)[number], number> = { avant: 0, arriere: 0, gauche: 0, droit: 0 };
  for (const e of entries) {
    const k = (keys as readonly string[]).includes(e.view) ? (e.view as (typeof keys)[number]) : 'avant';
    w[k] += e.montantTtc + 120;
  }
  const sum = w.avant + w.arriere + w.gauche + w.droit || 1;
  const p = (v: number) => v / sum;

  const pa = p(w.avant);
  const pr = p(w.arriere);
  const pg = p(w.gauche);
  const pd = p(w.droit);

  if (pr >= 0.52 && pa < 0.14) {
    return {
      code: 'rear_struck',
      title: 'Tamponnement par l’arrière',
      narrative:
        'Les dégâts dominent sur l’arrière : scénario typique d’un choc reçu par derrière (tamponnement, file arrêtée, feu). Croiser avec photos arrière, pare-chocs et longerons.',
      confidence: 'Élevée',
    };
  }
  if (pa >= 0.52 && pr < 0.14) {
    return {
      code: 'front_impact',
      title: 'Choc frontal ou obstacle',
      narrative:
        'La face avant concentre l’essentiel des impacts : collision avant (véhicule, obstacle fixe, glissière). Vérifier optiques, radiateur, capteurs ADAS.',
      confidence: 'Élevée',
    };
  }
  if (pg >= 0.46 && pd < 0.2) {
    return {
      code: 'side_left',
      title: 'Choc latéral gauche',
      narrative:
        'La gauche porte la majorité des dommages : côté conducteur souvent exposé en croisement, dépassement ou stationnement. Contrôler portes, ailes et montants.',
      confidence: 'Moyenne à élevée',
    };
  }
  if (pd >= 0.46 && pg < 0.2) {
    return {
      code: 'side_right',
      title: 'Choc latéral droit',
      narrative:
        'La droite est sur-représentée : côté passager (angle mort, créneau, voie rapide). Photos en élévation utiles.',
      confidence: 'Moyenne à élevée',
    };
  }
  if (pa > 0.26 && pr > 0.26) {
    return {
      code: 'front_rear',
      title: 'Chocs avant et arrière',
      narrative:
        'Des masses importantes à l’avant et à l’arrière : possible chaîne de collisions, manœuvre complexe, ou deux événements. Demander chronologie et constat.',
      confidence: 'Moyenne',
    };
  }
  if (pg > 0.22 && pd > 0.22 && pa + pr < 0.45) {
    return {
      code: 'narrow_sides',
      title: 'Pression latérale des deux côtés',
      narrative:
        'Gauche et droite marquées avec peu d’avant/arrière : passage étroit, portes contre obstacle, ou carwash / remorquage. À confirmer avec le déclarant.',
      confidence: 'Moyenne',
    };
  }
  return {
    code: 'mixed',
    title: 'Cinématique mixte',
    narrative:
      'La répartition ne pointe pas un seul mode de choc dominant : plusieurs directions ou dégâts cumulés. Affiner avec témoignages, angle d’attaque et photos d’ensemble.',
    confidence: 'Faible à moyenne',
  };
}

function temporalRadarFromScenario(code: string): number {
  const m: Record<string, number> = {
    rear_struck: 36,
    front_impact: 34,
    side_left: 40,
    side_right: 40,
    front_rear: 58,
    narrow_sides: 48,
    mixed: 46,
    unknown: 30,
  };
  return m[code] ?? 40;
}

export function computeDamageFraudSnapshot(
  entries: DamageLineLite[],
  accidentAtIso?: string | null,
): {
  score: number;
  band: FraudRiskBand;
  radar: FraudRadarAxes;
  factorsList: FraudFactor[];
  scenario: AccidentScenarioEstimate;
} {
  const factorsList: FraudFactor[] = [];
  let raw = 8;

  const scenario = estimateAccidentScenario(entries);

  const views = new Set(entries.map((e) => e.view));
  const n = entries.length;
  const total = entries.reduce((s, e) => s + e.montantTtc, 0);
  const enfonceCount = entries.filter((e) => e.types.includes('ENFONCE')).length;
  const enfonceRatio = n ? enfonceCount / n : 0;

  let temporalRadar = temporalRadarFromScenario(scenario.code);
  let hasKnownTime = false;
  if (accidentAtIso) {
    const d = new Date(accidentAtIso);
    if (!Number.isNaN(d.getTime())) {
      hasKnownTime = true;
      if (isNightLocal(d)) {
        raw += 28;
        temporalRadar = 88;
        factorsList.push({
          code: 'NIGHT',
          label: 'Accident déclaré la nuit',
          detail: 'Créneau 22h–06h : vigilance accrue (déclaration, visibilité, cohérence avec les dégâts).',
          points: 28,
          severity: 'alert',
        });
      } else {
        temporalRadar = 32;
        factorsList.push({
          code: 'DAY',
          label: 'Créneau horaire classique',
          detail: 'Heure de déclaration dans la plage jour — critère temporel rassurant.',
          points: 0,
          severity: 'info',
        });
      }
    }
  }
  if (!hasKnownTime) {
    temporalRadar = temporalRadarFromScenario(scenario.code);
  }

  const viewCount = views.size;
  if (viewCount >= 3) {
    raw += 14;
    factorsList.push({
      code: 'MULTI_FACE',
      label: 'Impact multi-faces',
      detail: `${viewCount} vues distinctes : choc étendu — vérifier cohérence cinématique et photos.`,
      points: 14,
      severity: 'watch',
    });
  } else if (viewCount === 1 && n >= 2) {
    raw += 6;
    factorsList.push({
      code: 'SINGLE_FACE_MANY',
      label: 'Plusieurs zones sur une seule face',
      detail: 'Dommages concentrés : fréquent en stationnement — rester vigilant sur le surcoût pièces.',
      points: 6,
      severity: 'info',
    });
  }

  if (n >= 8) {
    raw += 16;
    factorsList.push({
      code: 'FRAGMENTED',
      label: 'Nombre de zones élevé',
      detail: `${n} lignes de dégâts : dossier fragmenté — contrôler doublons et chevauchements.`,
      points: 16,
      severity: 'watch',
    });
  }

  if (n === 1 && total > 7500) {
    raw += 12;
    factorsList.push({
      code: 'CONCENTRATED_COST',
      label: 'Montant élevé sur une pièce unique',
      detail: 'Un seul impact très coûteux : vérifier pièce d’origine / optiques / ADAS.',
      points: 12,
      severity: 'watch',
    });
  }

  if (total > 22_000 && n <= 4) {
    raw += 14;
    factorsList.push({
      code: 'HIGH_TICKET',
      label: 'Panier élevé / peu de lignes',
      detail: 'Total indicatif élevé avec peu de zones : demander justificatifs atelier.',
      points: 14,
      severity: 'alert',
    });
  }

  if (enfonceRatio > 0.75 && n >= 4) {
    raw += 10;
    factorsList.push({
      code: 'DENT_HEAVY',
      label: 'Profil « enfoncement » dominant',
      detail: 'Majorité de chocs profonds : cohérent avec choc lourd — photos latérales utiles.',
      points: 10,
      severity: 'info',
    });
  }

  raw = clamp(raw, 0, 100);
  const band = bandFromScore(raw);

  const spatialRadar = clamp(18 + viewCount * 22 + Math.min(n, 10) * 3, 0, 100);
  const financialRadar = clamp((total / 28_000) * 100, 0, 100);
  const patternRadar = clamp(40 + enfonceRatio * 45 - (viewCount === 1 ? 8 : 0), 0, 100);
  const complexityRadar = clamp(n * 9 + (total > 12_000 ? 18 : 0), 0, 100);

  return {
    score: Math.round(raw),
    band,
    radar: {
      temporal: temporalRadar,
      spatial: spatialRadar,
      financial: financialRadar,
      pattern: patternRadar,
      complexity: complexityRadar,
    },
    factorsList,
    scenario,
  };
}

export function fraudRadarPolygonPoints(
  axes: FraudRadarAxes,
  cx: number,
  cy: number,
  maxR: number,
): string {
  const vals = [axes.temporal, axes.spatial, axes.financial, axes.pattern, axes.complexity];
  const n = vals.length;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const rr = (clamp(vals[i], 0, 100) / 100) * maxR;
    pts.push(`${(cx + rr * Math.cos(ang)).toFixed(2)},${(cy + rr * Math.sin(ang)).toFixed(2)}`);
  }
  return pts.join(' ');
}

export function fraudRadarGridRingPoints(
  cx: number,
  cy: number,
  r: number,
): string {
  const n = 5;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push(`${(cx + r * Math.cos(ang)).toFixed(2)},${(cy + r * Math.sin(ang)).toFixed(2)}`);
  }
  return pts.join(' ');
}
