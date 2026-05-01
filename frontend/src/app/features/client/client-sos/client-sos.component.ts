import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import { environment } from '../../../../environments/environment';

interface NearbyTowTruck {
  id: number;
  name: string;
  phone?: string;
  company?: string;
  address?: string;
  email?: string;
  latitude: number;
  longitude: number;
}

interface TowTruckWithDistance extends NearbyTowTruck {
  distanceKm: number;
}

@Component({
  selector: 'app-client-sos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './client-sos.component.html',
  styleUrls: ['./client-sos.component.scss'],
})
export class ClientSosComponent implements AfterViewInit, OnDestroy {
  private map?: L.Map;
  private accidentMarker?: L.Marker;
  private readonly defaultPosition: [number, number] = [36.8065, 10.1815];
  private readonly defaultZoom = 12;
  private readonly apiBaseUrl = `${environment.apiBaseUrl}/api`;
  private accidentLat?: number;
  private accidentLng?: number;

  accidentAddress = '';
  nearbyTowTrucks: TowTruckWithDistance[] = [];
  loadingTowTrucks = false;
  selectedTowTruckId?: number;
  showRequestForm = false;
  submittingRequest = false;
  sosStatus = '';
  sosError = '';
  phoneHint = '';

  sosForm!: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private authStorage: AuthStorageService,
  ) {
    this.sosForm = this.createForm();
  }

  private createForm() {
    return this.fb.group({
      clientName: ['', [Validators.required]],
      clientPhone: ['', [Validators.required, Validators.pattern(/^(2|4|5|7|9)\d{7}$/)]],
      description: [''],
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.placeAccidentPoint(this.defaultPosition[0], this.defaultPosition[1], true);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    this.map = L.map('sos-map', {
      center: this.defaultPosition,
      zoom: this.defaultZoom,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.map.on('click', (event: L.LeafletMouseEvent) => {
      this.placeAccidentPoint(event.latlng.lat, event.latlng.lng, true);
    });
  }

  private placeAccidentPoint(lat: number, lng: number, refreshData: boolean): void {
    if (!this.map) return;

    if (this.accidentMarker) {
      this.accidentMarker.setLatLng([lat, lng]);
    } else {
      this.accidentMarker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
      this.accidentMarker.on('dragend', () => {
        const pos = this.accidentMarker?.getLatLng();
        if (pos) {
          this.placeAccidentPoint(pos.lat, pos.lng, true);
        }
      });
    }

    if (refreshData) {
      this.accidentLat = lat;
      this.accidentLng = lng;
      this.reverseGeocode(lat, lng);
      this.loadNearestTowTrucks(lat, lng);
    }
  }

  clearPoint(): void {
    if (this.accidentMarker) {
      this.accidentMarker.remove();
      this.accidentMarker = undefined;
    }
    this.accidentAddress = '';
    this.nearbyTowTrucks = [];
    this.selectedTowTruckId = undefined;
    this.showRequestForm = false;
    this.sosStatus = '';
    this.sosError = '';
  }

  private reverseGeocode(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        this.accidentAddress = data?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      })
      .catch(() => {
        this.accidentAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      });
  }

  private loadNearestTowTrucks(lat: number, lng: number): void {
    this.loadingTowTrucks = true;
    this.sosError = '';
    this.sosStatus = '';

    this.http.get<NearbyTowTruck[]>(`${this.apiBaseUrl}/tow-trucks`).subscribe({
      next: (towTrucks) => {
        this.nearbyTowTrucks = (towTrucks ?? [])
          .filter((t) => t.latitude != null && t.longitude != null)
          .map((t) => ({
            ...t,
            distanceKm: this.computeDistanceKm(lat, lng, t.latitude!, t.longitude!),
          }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 4);

        this.selectedTowTruckId = this.nearbyTowTrucks[0]?.id;
        this.loadingTowTrucks = false;
      },
      error: (err) => {
        this.loadingTowTrucks = false;
        this.nearbyTowTrucks = [];
        this.sosError = `Chargement des remorqueurs impossible: ${err?.message || 'Erreur inconnue'}`;
      },
    });
  }

  private computeDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earth = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(earth * c * 100) / 100;
  }

  chooseTowTruck(id: number): void {
    this.selectedTowTruckId = id;
  }

  openSosForm(): void {
    if (!this.accidentMarker) {
      this.sosError = "Selectionnez d'abord la position de l'accident.";
      this.sosStatus = '';
      return;
    }
    if (!this.selectedTowTruckId) {
      this.sosError = "Choisissez un remorqueur disponible avant l'envoi.";
      this.sosStatus = '';
      return;
    }

    const user = this.authStorage.getUser();
    const storedPhone = localStorage.getItem('salama.clientPhone') || '';
    this.phoneHint = storedPhone ? '' : 'Telephone non trouve dans votre profil, veuillez le saisir une seule fois.';
    this.sosForm.reset({
      clientName: user?.fullName || '',
      clientPhone: storedPhone,
      description: '',
    });

    this.showRequestForm = true;
    this.sosError = '';
  }

  closeSosForm(): void {
    this.showRequestForm = false;
  }

  submitSosRequest(): void {
    if (this.sosForm.invalid) {
      this.sosForm.markAllAsTouched();
      return;
    }
    if (!this.selectedTowTruckId || this.accidentLat == null || this.accidentLng == null) {
      this.sosError = 'Informations SOS incompletes.';
      return;
    }

    this.submittingRequest = true;
    const payload = {
      type: 'REMORQUAGE',
      clientName: this.sosForm.value.clientName,
      clientPhone: this.sosForm.value.clientPhone,
      latitude: this.accidentLat,
      longitude: this.accidentLng,
      description: this.sosForm.value.description || '',
      status: 'EN_ATTENTE',
      garageId: null,
      mechanicId: null,
      towTruckId: this.selectedTowTruckId,
    };

    this.http.post(`${this.apiBaseUrl}/sos-requests`, payload).subscribe({
      next: () => {
        localStorage.setItem('salama.clientPhone', this.sosForm.value.clientPhone || '');
        const selected = this.nearbyTowTrucks.find((t) => t.id === this.selectedTowTruckId);
        this.sosStatus = `Demande SOS envoyee vers ${selected?.name || 'le remorqueur selectionne'}.`;
        this.sosError = '';
        this.submittingRequest = false;
        this.showRequestForm = false;
      },
      error: (err) => {
        this.submittingRequest = false;
        this.sosError = `Envoi SOS impossible: ${err?.error?.message || err?.message || 'Erreur inconnue'}`;
      },
    });
  }

}
