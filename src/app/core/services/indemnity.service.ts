// src/app/services/indemnity.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Indemnity {
  idIndemnity?: number;
  claimId: number;
  grossAmount: number;
  responsibility: number;
  deductibleValue: number;
  netAmount: number;
  calculationDate: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class IndemnityService {

private apiUrl = 'http://localhost:8082/api';   // ✅ avec slash

  constructor(private http: HttpClient) { }

  // Générer ou mettre à jour l'indemnité pour un sinistre
  generateIndemnity(claimId: number): Observable<Indemnity> {
    return this.http.post<Indemnity>(`${this.apiUrl}/indemnities/generate/${claimId}`, {});
}

  // Récupérer l'indemnité par claimId
  getIndemnityByClaimId(claimId: number): Observable<Indemnity> {
    return this.http.get<Indemnity>(`${this.apiUrl}/claim/${claimId}`);
  }

  // Récupérer toutes les indemnités
  getAllIndemnities(): Observable<Indemnity[]> {
    return this.http.get<Indemnity[]>(this.apiUrl);
  }

  // Récupérer une indemnité par son id
  getIndemnityById(id: number): Observable<Indemnity> {
    return this.http.get<Indemnity>(`${this.apiUrl}/${id}`);
  }

  // Mettre à jour le statut
  updateStatus(id: number, status: string): Observable<Indemnity> {
    return this.http.patch<Indemnity>(`${this.apiUrl}/${id}/status?status=${status}`, {});
  }

  // Supprimer une indemnité
  deleteIndemnity(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Générer PDF
  downloadPdf(id: number, signature: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/${id}/pdf`, { signature }, { responseType: 'blob' });
  }
}