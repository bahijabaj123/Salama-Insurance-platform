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

  continueToReport(): void {
    if (!this.basePrefill) return;
    const payload: ExpertisePrefillPayload = {
      ...this.basePrefill,
      damages: this.entriesToPrefill(),
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
