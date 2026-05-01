import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Garage, GaragePayload } from '../models/garage.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GarageService {
  private readonly BASE = `${environment.apiBaseUrl}/api/repair-shops-linda`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Garage[]> {
    return this.http.get<Garage[]>(this.BASE);
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
