import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccidentService {

  private apiUrl = 'http://localhost:8082/SalamaInsurance/api/accidents';

  constructor(private http: HttpClient) {}

  submitConstat(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/constats`, data);
  }

  submitDamageReport(accidentId: number, damages: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/damages?accidentId=${accidentId}`, damages);
  }

  validateAccident(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/validate`, {});
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  getRecentConstats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/recent`);
  }

  rejeterAccident(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/rejeter`, {}, { responseType: 'text' });
  }
}