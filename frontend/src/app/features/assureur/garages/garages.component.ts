import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, finalize, takeUntil } from 'rxjs';
import * as L from 'leaflet';
import { Garage, GaragePayload } from '../../../core/models/garage.model';
import { GarageService } from '../../../core/services/garage.service';

@Component({
  selector: 'app-garages',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './garages.component.html',
  styleUrls: ['./garages.component.scss'],
})
export class GaragesComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private map?: L.Map;
  private marker?: L.Marker;
  private readonly defaultCoords: [number, number] = [36.8065, 10.1815];

  garages: Garage[] = [];
  filteredGarages: Garage[] = [];
  loading = false;
  saving = false;
  deletingId?: number;
  selectedGarageId?: number;
  search = '';
  successMsg = '';
  errorMsg = '';
  detectedAddress = '';

  garageForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private garageService: GarageService,
  ) {
    this.garageForm = this.fb.group({
      name: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^(2|4|5|7|9)\d{7}$/)]],
      email: ['', [Validators.required, Validators.email]],
      city: ['', [Validators.required]],
      partner: [false, [Validators.required]],
      address: ['', [Validators.required]],
      latitude: [null as number | null, [Validators.required]],
      longitude: [null as number | null, [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadGarages();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.map?.remove();
  }

  private initMap(): void {
    this.map = L.map('garage-map', {
      center: this.defaultCoords,
      zoom: 7,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.placeMarker(e.latlng.lat, e.latlng.lng);
      this.detectAddress(e.latlng.lat, e.latlng.lng);
    });
  }

  private placeMarker(lat: number, lng: number): void {
    if (!this.map) return;
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker?.getLatLng();
        if (pos) {
          this.patchCoordinates(pos.lat, pos.lng);
          this.detectAddress(pos.lat, pos.lng);
        }
      });
    }
    this.patchCoordinates(lat, lng);
  }

  private patchCoordinates(lat: number, lng: number): void {
    this.garageForm.patchValue({ latitude: lat, longitude: lng });
  }

  private detectAddress(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const label = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        this.detectedAddress = label;
        if (!this.garageForm.value.address) {
          this.garageForm.patchValue({ address: label });
        }
      })
      .catch(() => {
        this.detectedAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      });
  }

  clearPoint(): void {
    if (this.marker) {
      this.marker.remove();
      this.marker = undefined;
    }
    this.garageForm.patchValue({ latitude: null, longitude: null });
    this.detectedAddress = '';
  }

  loadGarages(): void {
    this.loading = true;
    this.garageService.getAll()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (garages) => {
          this.garages = garages;
          this.applyFilter();
        },
        error: (err) => {
          this.showError(`Chargement impossible: ${err?.error?.message || err.message}`);
        },
      });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase().trim();
    this.filteredGarages = this.garages.filter((g) => {
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.city.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.includes(q)
      );
    });
  }

  startCreate(): void {
    this.selectedGarageId = undefined;
    this.detectedAddress = '';
    this.garageForm.reset({
      name: '',
      phone: '',
      email: '',
      city: '',
      partner: false,
      address: '',
      latitude: null,
      longitude: null,
    });
    this.clearPoint();
  }

  startEdit(garage: Garage): void {
    this.selectedGarageId = garage.id;
    this.garageForm.patchValue({
      name: garage.name,
      phone: garage.phone,
      email: garage.email,
      city: garage.city,
      partner: garage.partner,
      address: garage.address,
      latitude: garage.latitude,
      longitude: garage.longitude,
    });
    this.detectedAddress = garage.address;
    this.placeMarker(garage.latitude, garage.longitude);
    this.map?.setView([garage.latitude, garage.longitude], 12);
  }

  submit(): void {
    if (this.garageForm.invalid) {
      this.garageForm.markAllAsTouched();
      return;
    }

    this.saving = true;
    const payload = this.garageForm.getRawValue() as GaragePayload;

    const request$ = this.selectedGarageId
      ? this.garageService.update(this.selectedGarageId, payload)
      : this.garageService.create(payload);

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.saving = false)),
      )
      .subscribe({
        next: () => {
          this.showSuccess(this.selectedGarageId ? 'Garage modifié avec succès.' : 'Garage ajouté avec succès.');
          this.startCreate();
          this.loadGarages();
        },
        error: (err) => {
          this.showError(`Enregistrement impossible: ${err?.error?.message || err.message}`);
        },
      });
  }

  remove(garage: Garage): void {
    if (!confirm(`Supprimer le garage "${garage.name}" ?`)) return;
    this.deletingId = garage.id;
    this.garageService.delete(garage.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.deletingId = undefined)),
      )
      .subscribe({
        next: () => {
          this.showSuccess('Garage supprimé avec succès.');
          this.garages = this.garages.filter((g) => g.id !== garage.id);
          this.applyFilter();
          if (this.selectedGarageId === garage.id) {
            this.startCreate();
          }
        },
        error: (err) => {
          this.showError(`Suppression impossible: ${err?.error?.message || err.message}`);
        },
      });
  }

  private showSuccess(message: string): void {
    this.successMsg = message;
    this.errorMsg = '';
    setTimeout(() => (this.successMsg = ''), 3500);
  }

  private showError(message: string): void {
    this.errorMsg = message;
    this.successMsg = '';
    setTimeout(() => (this.errorMsg = ''), 5000);
  }
}
