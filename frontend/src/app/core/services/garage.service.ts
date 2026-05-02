import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Garage, GaragePayload, GarageNearestApiRow, GarageWithDistance } from '../models/garage.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GarageService {
  private readonly BASE = `${environment.apiBaseUrl}/api/repair-shops-linda`;
  private readonly PROXIMITY = `${environment.apiBaseUrl}/api/garages`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Garage[]> {
    return this.http.get<Garage[]>(this.BASE);
  }

  /**
   * Garages les plus proches (haversine côté serveur).
   * @see GarageProximityController
   */
  getNearest(lat: number, lng: number, limit = 8): Observable<GarageWithDistance[]> {
    const params = new HttpParams()
      .set('lat', String(lat))
      .set('lng', String(lng))
      .set('limit', String(limit));
    return this.http.get<GarageNearestApiRow[]>(`${this.PROXIMITY}/nearest`, { params }).pipe(
      map((rows) =>
        (rows ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          latitude: r.latitude,
          longitude: r.longitude,
          city: '',
          phone: '',
          email: '',
          address: '',
          partner: false,
          distanceKm: r.distanceKm,
        })),
      ),
    );
  }

  /** Même logique que getNearest, avec repli sur getAll + tri local si l’API nearest échoue. */
  getNearestWithFallback(lat: number, lng: number, limit = 8): Observable<GarageWithDistance[]> {
    return this.getNearest(lat, lng, limit).pipe(
      catchError(() => this.getAll().pipe(map((list) => this.rankGaragesByDistance(list ?? [], lat, lng, limit)))),
    );
  }

  private rankGaragesByDistance(
    list: Garage[],
    lat: number,
    lng: number,
    limit: number,
  ): GarageWithDistance[] {
    return list
      .filter((g) => g.latitude != null && g.longitude != null)
      .map((g) => ({ ...g, distanceKm: this.haversineKm(lat, lng, g.latitude, g.longitude) }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earth = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(earth * c * 100) / 100;
  }

  create(payload: GaragePayload): Observable<Garage> {
    return this.http.post<Garage>(this.BASE, payload);
  }

  update(id: number, payload: GaragePayload): Observable<Garage> {
    return this.http.put<Garage>(`${this.BASE}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }
}
