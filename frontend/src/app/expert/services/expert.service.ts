import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Expert } from '../models/expert.model';

@Injectable({
  providedIn: 'root'
})
export class ExpertService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/experts`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Expert[]> {
    return this.http.get<Expert[]>(this.apiUrl);
  }

  getById(id: number): Observable<Expert> {
    return this.http.get<Expert>(`${this.apiUrl}/${id}`);
  }

  create(expert: Expert): Observable<Expert> {
    return this.http.post<Expert>(`${this.apiUrl}/add`, expert);
  }

  update(id: number, expert: Expert): Observable<Expert> {
    return this.http.put<Expert>(`${this.apiUrl}/update/${id}`, expert);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/delete/${id}`);
  }
}
