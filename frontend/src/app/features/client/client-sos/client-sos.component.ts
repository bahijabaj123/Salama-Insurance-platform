import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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

interface SosRequestCreated {
  id: number;
  status?: string;
  towTruck?: { id: number; name?: string; latitude?: number; longitude?: number };
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
  private towTruckMarker?: L.Marker;
  private routePolyline?: L.Polyline;
  private trackingSub?: Subscription;
  private readonly defaultPosition: [number, number] = [36.8065, 10.1815];
  private readonly defaultZoom = 12;
  private readonly apiBaseUrl = `${environment.apiBaseUrl}/api`;
  private readonly trackingPollMs = 3500;
  private readonly apiMoveThresholdKm = 0.08;
  private readonly arrivalThresholdKm = 0.045;
  private readonly simStep = 0.036;
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

  /** Après envoi SOS : suivi carte + polling API remorqueur */
  trackingActive = false;
  trackingArrived = false;
  trackingDistanceLabel = '';
  trackingPollError = '';
  trackingPanelDismissed = false;
  activeSosRequestId?: number;
  private trackingTowTruckId?: number;
  private trackingInitialized = false;
  private lastApiTowLat = 0;
  private lastApiTowLng = 0;
  private simProgress = 0;

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
    this.stopLiveTracking(true);
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
    this.stopLiveTracking(true);
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
        if (!this.trackingActive) {
          this.refreshTowTruckMapOverlay();
        }
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
    if (!this.trackingActive) {
      this.refreshTowTruckMapOverlay();
    }
  }

  stopLiveTracking(removeOverlays: boolean): void {
    this.trackingSub?.unsubscribe();
    this.trackingSub = undefined;
    this.trackingActive = false;
    this.trackingArrived = false;
    this.trackingDistanceLabel = '';
    this.trackingPollError = '';
    this.trackingPanelDismissed = false;
    this.activeSosRequestId = undefined;
    this.trackingTowTruckId = undefined;
    this.trackingInitialized = false;
    this.simProgress = 0;
    if (removeOverlays) {
      this.removeTowTruckOverlays();
    }
  }

  /** Arrête le rafraîchissement et masque le panneau ; la carte garde le dernier tracé. */
  closeTrackingPanel(): void {
    this.trackingSub?.unsubscribe();
    this.trackingSub = undefined;
    this.trackingPanelDismissed = true;
    this.trackingActive = false;
  }

  private removeTowTruckOverlays(): void {
    if (this.towTruckMarker) {
      this.towTruckMarker.remove();
      this.towTruckMarker = undefined;
    }
    if (this.routePolyline) {
      this.routePolyline.remove();
      this.routePolyline = undefined;
    }
  }

  private towTruckDivIcon(): L.DivIcon {
    return L.divIcon({
      className: 'sos-truck-divicon',
      html: '<span class="sos-truck-icon" aria-hidden="true">🚛</span>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  private refreshTowTruckMapOverlay(): void {
    if (!this.map || this.accidentLat == null || this.accidentLng == null) {
      return;
    }
    const tow = this.nearbyTowTrucks.find((t) => t.id === this.selectedTowTruckId);
    if (!tow || tow.latitude == null || tow.longitude == null) {
      this.removeTowTruckOverlays();
      return;
    }
    this.setTowTruckMarkerAt(tow.latitude, tow.longitude);
    this.updateRoutePolyline(tow.latitude, tow.longitude);
    this.map.fitBounds(
      [
        [tow.latitude, tow.longitude],
        [this.accidentLat, this.accidentLng],
      ],
      { padding: [28, 28], maxZoom: 14 },
    );
  }

  private setTowTruckMarkerAt(lat: number, lng: number): void {
    if (!this.map) return;
    if (this.towTruckMarker) {
      this.towTruckMarker.setLatLng([lat, lng]);
    } else {
      this.towTruckMarker = L.marker([lat, lng], { icon: this.towTruckDivIcon() }).addTo(this.map);
      this.towTruckMarker.bindTooltip('Remorqueur', { permanent: false });
    }
  }

  private updateRoutePolyline(truckLat: number, truckLng: number): void {
    if (!this.map || this.accidentLat == null || this.accidentLng == null) return;
    const latlngs: L.LatLngExpression[] = [
      [truckLat, truckLng],
      [this.accidentLat, this.accidentLng],
    ];
    if (this.routePolyline) {
      this.routePolyline.setLatLngs(latlngs);
    } else {
      this.routePolyline = L.polyline(latlngs, {
        color: '#185FA5',
        weight: 3,
        dashArray: '8 7',
        opacity: 0.9,
      }).addTo(this.map);
    }
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private beginLiveTracking(sosRequestId: number, towTruckId: number): void {
    this.stopLiveTracking(true);
    if (!this.map || this.accidentLat == null || this.accidentLng == null) {
      return;
    }

    this.trackingActive = true;
    this.trackingArrived = false;
    this.trackingPanelDismissed = false;
    this.trackingPollError = '';
    this.activeSosRequestId = sosRequestId;
    this.trackingTowTruckId = towTruckId;
    this.trackingInitialized = false;
    this.simProgress = 0;

    const fromList = this.nearbyTowTrucks.find((t) => t.id === towTruckId);
    if (fromList?.latitude != null && fromList.longitude != null) {
      this.lastApiTowLat = fromList.latitude;
      this.lastApiTowLng = fromList.longitude;
    }

    this.trackingSub = timer(0, this.trackingPollMs)
      .pipe(switchMap(() => this.http.get<NearbyTowTruck>(`${this.apiBaseUrl}/tow-trucks/${towTruckId}`)))
      .subscribe({
        next: (apiTow) => {
          this.trackingPollError = '';
          const alat = apiTow.latitude;
          const alng = apiTow.longitude;
          if (alat == null || alng == null || this.accidentLat == null || this.accidentLng == null) {
            return;
          }

          if (!this.trackingInitialized) {
            this.lastApiTowLat = alat;
            this.lastApiTowLng = alng;
            this.trackingInitialized = true;
            this.simProgress = 0;
            this.applyTrackingFrame(alat, alng);
            const dist0 = this.computeDistanceKm(alat, alng, this.accidentLat, this.accidentLng);
            if (dist0 <= this.arrivalThresholdKm) {
              this.finishTrackingArrived();
            }
            return;
          }

          const apiMoved =
            this.computeDistanceKm(this.lastApiTowLat, this.lastApiTowLng, alat, alng) > this.apiMoveThresholdKm;
          let displayLat: number;
          let displayLng: number;
          if (apiMoved) {
            this.lastApiTowLat = alat;
            this.lastApiTowLng = alng;
            this.simProgress = 0;
            displayLat = alat;
            displayLng = alng;
          } else {
            this.simProgress = Math.min(1, this.simProgress + this.simStep);
            displayLat = this.lerp(this.lastApiTowLat, this.accidentLat, this.simProgress);
            displayLng = this.lerp(this.lastApiTowLng, this.accidentLng, this.simProgress);
          }

          this.applyTrackingFrame(displayLat, displayLng);

          const distEnd = this.computeDistanceKm(displayLat, displayLng, this.accidentLat, this.accidentLng);
          if (distEnd <= this.arrivalThresholdKm || this.simProgress >= 0.995) {
            this.finishTrackingArrived();
          }
        },
        error: () => {
          this.trackingPollError = 'Impossible de rafraîchir la position (réseau).';
        },
      });
  }

  private finishTrackingArrived(): void {
    this.trackingArrived = true;
    this.trackingActive = false;
    this.trackingDistanceLabel = '';
    this.trackingSub?.unsubscribe();
    this.trackingSub = undefined;
  }

  private applyTrackingFrame(lat: number, lng: number): void {
    if (!this.map || this.accidentLat == null || this.accidentLng == null) return;
    this.setTowTruckMarkerAt(lat, lng);
    this.updateRoutePolyline(lat, lng);
    const dist = this.computeDistanceKm(lat, lng, this.accidentLat, this.accidentLng);
    this.trackingDistanceLabel =
      dist <= this.arrivalThresholdKm ? '' : `Environ ${dist.toFixed(2)} km jusqu’à vous`;
    this.map.fitBounds(
      [
        [lat, lng],
        [this.accidentLat, this.accidentLng],
      ],
      { padding: [36, 36], maxZoom: 14 },
    );
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

    this.http.post<SosRequestCreated>(`${this.apiBaseUrl}/sos-requests`, payload).subscribe({
      next: (created) => {
        localStorage.setItem('salama.clientPhone', this.sosForm.value.clientPhone || '');
        const selected = this.nearbyTowTrucks.find((t) => t.id === this.selectedTowTruckId);
        const towId = created.towTruck?.id ?? this.selectedTowTruckId;
        this.sosStatus = `Demande SOS envoyée vers ${selected?.name || 'le remorqueur sélectionné'}. Suivi en direct activé sur la carte.`;
        this.sosError = '';
        this.submittingRequest = false;
        this.showRequestForm = false;
        if (towId != null && created.id != null) {
          this.beginLiveTracking(created.id, towId);
        }
      },
      error: (err) => {
        this.submittingRequest = false;
        this.sosError = `Envoi SOS impossible: ${err?.error?.message || err?.message || 'Erreur inconnue'}`;
      },
    });
  }

}
