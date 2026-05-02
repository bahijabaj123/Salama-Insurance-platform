import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import {
  VEHICLE_CHOICE_STORAGE_KEY,
  VEHICLE_IMAGE_PLACEHOLDER,
  VEHICLE_SELECTION_CATALOG,
  type VehicleModelVariant,
  type VehiclePickItem,
  type VehicleRegionGroup,
} from '../../data/vehicle-selection.catalog';

interface VehicleCategorySelection {
  group: VehicleRegionGroup;
  item: VehiclePickItem;
}

@Component({
  selector: 'app-expert-vehicle-selection',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './expert-vehicle-selection.component.html',
  styleUrl: './expert-vehicle-selection.component.scss',
})
export class ExpertVehicleSelectionComponent {
  readonly catalog = VEHICLE_SELECTION_CATALOG;
  readonly placeholderImg = VEHICLE_IMAGE_PLACEHOLDER;

  /** Catégorie ouverte : liste des modèles avec images */
  openCategory: VehicleCategorySelection | null = null;

  constructor(private router: Router) {}

  openModels(group: VehicleRegionGroup, item: VehiclePickItem): void {
    this.openCategory = { group, item };
  }

  closeModels(): void {
    this.openCategory = null;
  }

  onImageError(event: Event): void {
    const el = event.target;
    if (el instanceof HTMLImageElement) {
      el.src = this.placeholderImg;
      el.classList.add('veh-model-img--broken');
    }
  }

  /** Choix précis : marque + type issus du modèle */
  selectModel(model: VehicleModelVariant): void {
    const ctx = this.openCategory;
    if (!ctx) return;
    this.persistAndGo({
      vehiculeType: ctx.item.vehiculeType,
      vehiculeMarque: `${model.vehiculeMarque} — ${model.modelLabel}`,
      vehiculeGenre: ctx.item.vehiculeGenre ?? '',
      selectionLabel: `${ctx.item.name} — ${model.modelLabel}`,
      estimationHint: ctx.item.estimationHint,
    });
  }

  /** Sans modèle listé : garde le libellé agrégé de la catégorie */
  selectCategoryOnly(): void {
    const ctx = this.openCategory;
    if (!ctx) return;
    this.persistAndGo({
      vehiculeType: ctx.item.vehiculeType,
      vehiculeMarque: ctx.item.vehiculeMarque,
      vehiculeGenre: ctx.item.vehiculeGenre ?? '',
      selectionLabel: ctx.item.name,
      estimationHint: ctx.item.estimationHint,
    });
  }

  private persistAndGo(payload: Record<string, string>): void {
    try {
      sessionStorage.setItem(VEHICLE_CHOICE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* quota / navigation privée */
    }
    this.openCategory = null;
    void this.router.navigateByUrl('/expert/expertise/vehicule/degats');
  }
}
