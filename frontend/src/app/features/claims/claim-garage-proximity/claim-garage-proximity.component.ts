import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import * as L from 'leaflet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClaimService } from '../../../core/services/claim.service';
import { GarageService } from '../../../core/services/garage.service';
import { Claim } from '../../../core/models/claim.model';
import { GarageWithDistance } from '../../../core/models/garage.model';

@Component({
  selector: 'app-claim-garage-proximity',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './claim-garage-proximity.component.html',
  styleUrls: ['./claim-garage-proximity.component.scss'],
})
export class ClaimGarageProximityComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private garageMap?: L.Map;
  private garageMarker?: L.Marker;

  private readonly garagePinIcon = L.divIcon({
    className: 'claim-garage-pin-wrap',
    html:
      '<span style="display:block;width:22px;height:22px;background:#185FA5;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 8px rgba(24,95,165,.35);"></span>',
    iconSize: [28, 36],
    iconAnchor: [14, 34],
  });

  claim?: Claim;
  loadingClaim = true;
  /** Erreur chargement du sinistre (affiche l’écran minimal dédié). */
  claimLoadError = '';
  /** Erreur sauvegarde : bandeau sous le titre (style alerte). */
  saveError = '';
  /** Succès après « Confirmer le garage » : même principe visuel, puis Fermer → liste sinistres. */
  saveSuccessMsg = '';

  nearbyGarages: GarageWithDistance[] = [];
  loadingGarages = false;
  assigningGarage = false;
  selectedGarageId?: number;
  private accidentLat?: number;
  private accidentLng?: number;
  garageAccidentAddress = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private claimService: ClaimService,
    private garageService: GarageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const claimId = idParam ? parseInt(idParam, 10) : NaN;
    if (!Number.isFinite(claimId) || claimId < 1) {
      void this.router.navigate(['/assureur/claims']);
      return;
    }

    this.claimService
      .getClaimById(claimId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (c) => {
          this.claim = c;
          this.loadingClaim = false;
          setTimeout(() => this.initGarageMapWhenReady(), 0);
        },
        error: () => {
          this.claimLoadError = 'Claim not found.';
          this.loadingClaim = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.teardownGarageMap();
    this.destroy$.next();
    this.destroy$.complete();
  }

  backToClaims(): void {
    void this.router.navigate(['/assureur/claims']);
  }

  private teardownGarageMap(): void {
    this.garageMap?.remove();
    this.garageMap = undefined;
    this.garageMarker = undefined;
  }

  private regionCenter(region?: string | null): [number, number] {
    const cities: Record<string, [number, number]> = {
      tunis: [36.8065, 10.1815],
      sfax: [34.7405, 10.7605],
      sousse: [35.8255, 10.6365],
      bizerte: [37.2740, 9.8739],
      nabeul: [36.4550, 10.7350],
      gabes: [33.8815, 10.0985],
      kairouan: [35.6781, 10.0964],
      monastir: [35.7645, 10.8115],
      ariana: [36.8601, 10.1955],
      'ben arous': [36.7525, 10.2193],
      manouba: [36.8085, 10.0955],
    };
    const r = (region || '').toLowerCase();
    const key = Object.keys(cities).find((k) => r.includes(k));
    return key ? cities[key] : [36.8065, 10.1815];
  }

  private initGarageMapWhenReady(attempt = 0): void {
    if (!this.claim || attempt > 30) return;
    const host = document.getElementById('claim-garage-map');
    if (!host) {
      setTimeout(() => this.initGarageMapWhenReady(attempt + 1), 40);
      return;
    }
    this.initGarageMap();
  }

  private initGarageMap(): void {
    if (!this.claim) return;
    const host = document.getElementById('claim-garage-map');
    if (!host) return;

    this.teardownGarageMap();
    const center = this.regionCenter(this.claim.region);
    this.garageMap = L.map('claim-garage-map', { center, zoom: 11 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.garageMap);

    this.garageMap.on('click', (e: L.LeafletMouseEvent) => {
      this.placeAccidentPoint(e.latlng.lat, e.latlng.lng, true);
    });

    this.placeAccidentPoint(center[0], center[1], true);
    setTimeout(() => this.garageMap?.invalidateSize(), 0);
    setTimeout(() => this.garageMap?.invalidateSize(), 280);
  }

  private placeAccidentPoint(lat: number, lng: number, refreshList: boolean): void {
    if (!this.garageMap) return;
    this.accidentLat = lat;
    this.accidentLng = lng;

    if (this.garageMarker) {
      this.garageMarker.setLatLng([lat, lng]);
    } else {
      this.garageMarker = L.marker([lat, lng], { draggable: true, icon: this.garagePinIcon }).addTo(this.garageMap);
      this.garageMarker.on('dragend', () => {
        const p = this.garageMarker?.getLatLng();
        if (p) this.placeAccidentPoint(p.lat, p.lng, true);
      });
    }

    if (refreshList) {
      this.loadNearbyGarages(lat, lng);
    }
    this.reverseGeocode(lat, lng);
  }

  private reverseGeocode(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        this.garageAccidentAddress = data?.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.garageAccidentAddress = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        this.cdr.markForCheck();
      });
  }

  clearPoint(): void {
    if (this.garageMarker) {
      this.garageMarker.remove();
      this.garageMarker = undefined;
    }
    this.accidentLat = undefined;
    this.accidentLng = undefined;
    this.nearbyGarages = [];
    this.selectedGarageId = undefined;
    this.garageAccidentAddress = '';
    this.saveError = '';
    this.saveSuccessMsg = '';
  }

  onChooseNearestGarageClick(): void {
    if (this.accidentLat == null || this.accidentLng == null) {
      const c = this.regionCenter(this.claim?.region);
      this.placeAccidentPoint(c[0], c[1], true);
      return;
    }
    this.loadNearbyGarages(this.accidentLat, this.accidentLng);
  }

  private loadNearbyGarages(lat: number, lng: number): void {
    this.loadingGarages = true;
    this.garageService
      .getNearestWithFallback(lat, lng, 8)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingGarages = false;
        }),
      )
      .subscribe({
        next: (rows) => {
          this.nearbyGarages = rows;
          this.selectedGarageId = rows[0]?.id;
        },
        error: () => {
          this.nearbyGarages = [];
        },
      });
  }

  private static readonly NOTES_MAX_LEN = 1000;

  confirmGarageOnClaim(): void {
    if (!this.claim || !this.selectedGarageId) return;
    const g = this.nearbyGarages.find((x) => x.id === this.selectedGarageId);
    if (!g) return;

    const coord =
      this.accidentLat != null && this.accidentLng != null
        ? ` — accident position ${this.accidentLat.toFixed(5)}, ${this.accidentLng.toFixed(5)}`
        : '';
    const line = `[Garage] ${g.name} (${g.city || '—'}) — ${g.distanceKm} km${coord}`;
    let notes = [this.claim.notes, line].filter((s) => !!s && String(s).trim()).join('\n');
    if (notes.length > ClaimGarageProximityComponent.NOTES_MAX_LEN) {
      notes = notes.slice(0, ClaimGarageProximityComponent.NOTES_MAX_LEN - 3) + '…';
    }

    this.saveError = '';
    this.saveSuccessMsg = '';
    this.assigningGarage = true;
    this.claimService
      .patchClaimNotes(this.claim.id, notes)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.assigningGarage = false)),
      )
      .subscribe({
        next: () => {
          const ref = this.claim!.reference;
          this.saveSuccessMsg = `Garage “${g.name}” has been saved on claim ${ref}.`;
          this.saveError = '';
          this.cdr.markForCheck();
        },
        error: (err: HttpErrorResponse) => {
          this.saveSuccessMsg = '';
          const body = err.error;
          const detail =
            typeof body === 'string' && body.trim()
              ? body.trim()
              : (body as { message?: string })?.message || err.message;
          this.saveError =
            detail && detail.length < 280
              ? detail
              : 'Could not save. Please try again.';
          this.cdr.markForCheck();
        },
      });
  }

  dismissSaveError(): void {
    this.saveError = '';
  }

  dismissSaveSuccess(): void {
    const ref = this.claim?.reference;
    void this.router.navigate(['/assureur/claims'], {
      queryParams: { garageOk: '1', ref: ref ?? undefined },
    });
  }

  selectGarageRow(id: number): void {
    this.selectedGarageId = id;
    this.saveError = '';
    this.saveSuccessMsg = '';
  }
}
