import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  input,
  output,
  viewChild
} from '@angular/core';
import * as L from 'leaflet';

export interface AccidentLocationPick {
  lat: number;
  lng: number;
  label: string;
  address?: string;
}

@Component({
  selector: 'app-accident-location-picker',
  standalone: true,
  templateUrl: './accident-location-picker.html',
  styleUrl: './accident-location-picker.scss'
})
export class AccidentLocationPickerComponent implements AfterViewInit, OnDestroy {
  mapEl = viewChild.required<ElementRef<HTMLElement>>('mapEl');

  initialLat = input<number | null>(null);
  initialLng = input<number | null>(null);

  picked = output<AccidentLocationPick | null>();

  geocoding = false;

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private reverseTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly defaultCenter: L.LatLngTuple = [36.8065, 10.1815];
  private readonly defaultZoom = 7;
  private readonly pinIcon = L.divIcon({
    className: 'accident-leaflet-divicon',
    html: '<span class="accident-pin-dot"></span>',
    iconSize: [26, 26],
    iconAnchor: [13, 24]
  });

  ngAfterViewInit(): void {
    queueMicrotask(() => this.initMap());
  }

  ngOnDestroy(): void {
    if (this.reverseTimer) clearTimeout(this.reverseTimer);
    this.map?.remove();
  }

  private initMap(): void {
    const el = this.mapEl().nativeElement;
    const lat0 = this.initialLat();
    const lng0 = this.initialLng();
    const hasInitial = lat0 != null && lng0 != null && Number.isFinite(lat0) && Number.isFinite(lng0);
    const center: L.LatLngTuple = hasInitial ? [lat0!, lng0!] : this.defaultCenter;
    const zoom = hasInitial ? 14 : this.defaultZoom;

    this.map = L.map(el).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setMarkerAndPick(e.latlng.lat, e.latlng.lng);
    });

    if (hasInitial) {
      this.placeMarker(lat0!, lng0!, false);
    }
  }

  private setMarkerAndPick(lat: number, lng: number): void {
    this.placeMarker(lat, lng, true);
    this.scheduleReverseGeocode(lat, lng);
  }

  private placeMarker(lat: number, lng: number, emit: boolean): void {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon: this.pinIcon, draggable: true }).addTo(this.map);
      this.marker.on('dragend', () => {
        const p = this.marker!.getLatLng();
        this.scheduleReverseGeocode(p.lat, p.lng);
      });
    }

    if (emit) {
      this.picked.emit({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    }
  }

  private scheduleReverseGeocode(lat: number, lng: number): void {
    if (this.reverseTimer) clearTimeout(this.reverseTimer);
    this.geocoding = true;
    this.reverseTimer = setTimeout(() => {
      void this.reverseGeocode(lat, lng);
    }, 400);
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const res = await fetch(url);
      const data = await res.json();
      const label = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      this.picked.emit({ lat, lng, label, address: label });
    } catch {
      this.picked.emit({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
    } finally {
      this.geocoding = false;
    }
  }

  clearPoint(): void {
    this.marker?.remove();
    this.marker = null;
    this.picked.emit(null);
  }
}
