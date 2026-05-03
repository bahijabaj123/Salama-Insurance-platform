import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import {
  describePricingRule,
  estimateDamageMontantTtc,
  getPartBaseTtc,
  TVA_DOMMAGES_PCT,
} from '../../data/vehicle-damage-pricing';
import {
  DAMAGE_TYPE_LABELS,
  type CarWireframeView,
  type DamageTypeCode,
  type WireframeHitPart,
  WIRE_OUTLINES,
  WIRE_PARTS,
  WIRE_VIEW_TITLES,
} from '../../data/vehicle-damage-wireframe';
import {
  EXPERTISE_PREFILL_NAV_STATE_KEY,
  VEHICLE_CHOICE_STORAGE_KEY,
  type ExpertisePrefillDamage,
  type ExpertisePrefillPayload,
} from '../../data/vehicle-selection.catalog';
import {
  computeDamageFraudSnapshot,
  fraudRadarGridRingPoints,
  fraudRadarPolygonPoints,
  type FraudRiskBand,
} from '../../utils/expert-damage-fraud-snapshot';

const ACCIDENT_AT_SESSION_KEY = 'salama.expertise.accidentAt';

interface DamageRecord {
  id: string;
  view: CarWireframeView;
  partId: string;
  partLabel: string;
  types: DamageTypeCode[];
  montantTtc: number;
}

@Component({
  selector: 'app-expert-vehicle-damage',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './expert-vehicle-damage.component.html',
  styleUrl: './expert-vehicle-damage.component.scss',
})
export class ExpertVehicleDamageComponent implements OnInit {
  readonly views: CarWireframeView[] = ['avant', 'droit', 'arriere', 'gauche'];
  readonly titles = WIRE_VIEW_TITLES;
  readonly outlines = WIRE_OUTLINES;
  readonly parts = WIRE_PARTS;
  readonly typeLabels = DAMAGE_TYPE_LABELS;
  readonly tvaDommagesPct = TVA_DOMMAGES_PCT;
  readonly pricingRuleText = describePricingRule();

  vehicleSummary = '';
  entries: DamageRecord[] = [];
  editing: { view: CarWireframeView; part: WireframeHitPart } | null = null;
  draftEnfonce = false;
  draftRaye = false;

  private basePrefill: ExpertisePrefillPayload | null = null;
  /** ISO date/heure sinistre pour règles temporelles (nuit, etc.). */
  accidentAtIso: string | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    const raw = sessionStorage.getItem(VEHICLE_CHOICE_STORAGE_KEY);
    if (!raw) {
      void this.router.navigateByUrl('/expert/expertise/vehicule');
      return;
    }
    try {
      const o = JSON.parse(raw) as ExpertisePrefillPayload;
      if (typeof o.vehiculeType !== 'string' || !o.vehiculeType.trim()) {
        void this.router.navigateByUrl('/expert/expertise/vehicule');
        return;
      }
      this.basePrefill = o;
      this.accidentAtIso =
        (typeof o.accidentAt === 'string' && o.accidentAt.trim()) ||
        (() => {
          try {
            return sessionStorage.getItem(ACCIDENT_AT_SESSION_KEY);
          } catch {
            return null;
          }
        })();
      this.vehicleSummary =
        (typeof o.selectionLabel === 'string' && o.selectionLabel.trim()) ||
        `${o.vehiculeMarque} — ${o.vehiculeType}`;
    } catch {
      void this.router.navigateByUrl('/expert/expertise/vehicule');
    }
  }

  partsFor(view: CarWireframeView): WireframeHitPart[] {
    return this.parts[view] ?? [];
  }

  entriesForView(view: CarWireframeView): DamageRecord[] {
    return this.entries.filter((e) => e.view === view);
  }

  highlightTone(view: CarWireframeView, partId: string): 'none' | 'enfonce' | 'raye' | 'both' {
    const e = this.entries.find((x) => x.view === view && x.partId === partId);
    if (!e?.types.length) return 'none';
    const hasE = e.types.includes('ENFONCE');
    const hasR = e.types.includes('RAYE');
    if (hasE && hasR) return 'both';
    if (hasE) return 'enfonce';
    return 'raye';
  }

  isEditing(view: CarWireframeView, partId: string): boolean {
    return this.editing?.view === view && this.editing.part.id === partId;
  }

  onPartClick(view: CarWireframeView, part: WireframeHitPart): void {
    this.editing = { view, part };
    const ex = this.entries.find((e) => e.view === view && e.partId === part.id);
    this.draftEnfonce = ex?.types.includes('ENFONCE') ?? false;
    this.draftRaye = ex?.types.includes('RAYE') ?? false;
  }

  clearEditingChip(): void {
    this.editing = null;
  }

  toggleDraft(code: DamageTypeCode, checked: boolean): void {
    if (code === 'ENFONCE') this.draftEnfonce = checked;
    else this.draftRaye = checked;
  }

  cancelEdit(): void {
    this.editing = null;
  }

  confirmEdit(): void {
    if (!this.editing) return;
    const { view, part } = this.editing;
    const types: DamageTypeCode[] = [];
    if (this.draftEnfonce) types.push('ENFONCE');
    if (this.draftRaye) types.push('RAYE');
    if (!types.length) {
      this.removeEntryByPart(view, part.id);
      this.editing = null;
      return;
    }
    const montantTtc = estimateDamageMontantTtc(part.id, types);
    const next: DamageRecord = {
      id: this.newId(),
      view,
      partId: part.id,
      partLabel: part.label,
      types,
      montantTtc,
    };
    const ix = this.entries.findIndex((e) => e.view === view && e.partId === part.id);
    if (ix >= 0) this.entries = [...this.entries.slice(0, ix), next, ...this.entries.slice(ix + 1)];
    else this.entries = [...this.entries, next];
    this.editing = null;
  }

  removeEntry(id: string): void {
    this.entries = this.entries.filter((e) => e.id !== id);
  }

  private removeEntryByPart(view: CarWireframeView, partId: string): void {
    this.entries = this.entries.filter((e) => !(e.view === view && e.partId === partId));
  }

  typesLabel(types: DamageTypeCode[]): string {
    return types.map((t) => this.typeLabels[t]).join(', ');
  }

  formatEuro(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  partBaseEuro(part: WireframeHitPart): number {
    return getPartBaseTtc(part.id);
  }

  /** Montant indicatif pendant l’édition (cases cochées). */
  draftLiveMontant(): number {
    if (!this.editing) return 0;
    const types: DamageTypeCode[] = [];
    if (this.draftEnfonce) types.push('ENFONCE');
    if (this.draftRaye) types.push('RAYE');
    if (!types.length) return 0;
    return estimateDamageMontantTtc(this.editing.part.id, types);
  }

  draftHasTypes(): boolean {
    return this.draftEnfonce || this.draftRaye;
  }

  entriesTotalTtc(): number {
    return this.entries.reduce((s, e) => s + e.montantTtc, 0);
  }

  fraudSnapshot() {
    return computeDamageFraudSnapshot(
      this.entries.map((e) => ({
        view: e.view,
        partId: e.partId,
        montantTtc: e.montantTtc,
        types: e.types as string[],
      })),
      this.accidentAtIso,
    );
  }

  fraudScenario() {
    return this.fraudSnapshot().scenario;
  }

  fraudRadarMainPoly(): string {
    const s = this.fraudSnapshot();
    return fraudRadarPolygonPoints(s.radar, 140, 118, 86);
  }

  fraudRadarRing(r: number): string {
    return fraudRadarGridRingPoints(140, 118, r);
  }

  /**
   * Courbe « signaux → score » : échantillons (x,y) pour SVG (vue 380×108).
   * La valeur suit le cumul des points de facteurs (base 8) puis converge vers le score affiché.
   */
  fraudSignalsCurveLineD(): string {
    const pts = this.fraudSignalsCurvePoints();
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
    }
    return d;
  }

  fraudSignalsCurveAreaD(): string {
    const pts = this.fraudSignalsCurvePoints();
    if (pts.length < 2) return '';
    const yb = 102;
    let d = `M ${pts[0].x.toFixed(2)} ${yb} L ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last.x.toFixed(2)} ${yb} Z`;
    return d;
  }

  fraudSignalsCurveEndPoint(): { x: number; y: number } {
    const pts = this.fraudSignalsCurvePoints();
    return pts.length ? pts[pts.length - 1]! : { x: 0, y: 0 };
  }

  private fraudSignalsCurvePoints(): { x: number; y: number }[] {
    const snap = this.fraudSnapshot();
    const W = 380;
    const H = 108;
    const padL = 14;
    const padR = 18;
    const padT = 14;
    const padB = 34;
    const iw = W - padL - padR;
    const ih = H - padT - padB;
    const fl = snap.factorsList;
    const score = Math.min(100, Math.max(0, snap.score));

    type M = { t: number; v: number };
    const milestones: M[] = [{ t: 0, v: Math.min(8, score) }];
    let cum = 8;
    if (!fl.length) {
      milestones.push({ t: 1, v: score });
    } else {
      const m = fl.length + 1;
      for (let i = 0; i < fl.length; i++) {
        cum += fl[i].points;
        milestones.push({ t: (i + 1) / m, v: Math.min(100, Math.max(milestones[milestones.length - 1].v, cum)) });
      }
      milestones.push({ t: 1, v: Math.max(milestones[milestones.length - 1].v, score) });
    }

    const valueAt = (t: number): number => {
      const tt = Math.min(1, Math.max(0, t));
      for (let k = 1; k < milestones.length; k++) {
        if (tt <= milestones[k].t || k === milestones.length - 1) {
          const a = milestones[k - 1];
          const b = milestones[k];
          const span = b.t - a.t;
          const u = span < 1e-6 ? 1 : (tt - a.t) / span;
          return a.v + u * (b.v - a.v);
        }
      }
      return milestones[milestones.length - 1].v;
    };

    const n = 52;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const v = valueAt(t);
      const x = padL + t * iw;
      const y = padT + ih * (1 - v / 100);
      pts.push({ x, y });
    }
    return pts;
  }

  fraudBandClass(b: FraudRiskBand): string {
    const m: Record<FraudRiskBand, string> = {
      LOW: 'dmg-fraud__band--low',
      MEDIUM: 'dmg-fraud__band--med',
      HIGH: 'dmg-fraud__band--high',
      CRITICAL: 'dmg-fraud__band--crit',
    };
    return m[b] ?? '';
  }

  fraudBandLabelFr(b: FraudRiskBand): string {
    const m: Record<FraudRiskBand, string> = {
      LOW: 'Risque faible',
      MEDIUM: 'Risque modéré',
      HIGH: 'Risque élevé',
      CRITICAL: 'Risque critique',
    };
    return m[b] ?? b;
  }

  continueToReport(): void {
    if (!this.basePrefill) return;
    const payload: ExpertisePrefillPayload = {
      ...this.basePrefill,
      damages: this.entriesToPrefill(),
      accidentAt: this.accidentAtIso ?? this.basePrefill.accidentAt,
    };
    try {
      sessionStorage.setItem(VEHICLE_CHOICE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* */
    }
    void this.router.navigate(['/expert/reports/new'], {
      state: { [EXPERTISE_PREFILL_NAV_STATE_KEY]: payload },
    });
  }

  private entriesToPrefill(): ExpertisePrefillDamage[] {
    return this.entries.map((e) => ({
      view: e.view,
      partId: e.partId,
      partLabel: e.partLabel,
      types: [...e.types],
      montantEstime: String(e.montantTtc),
    }));
  }

  private newId(): string {
    const c = globalThis.crypto;
    if (c && 'randomUUID' in c) return c.randomUUID();
    return `dmg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}
