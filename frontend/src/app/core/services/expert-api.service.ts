import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { Expert } from '../models/claim.model';

export interface CreateExpertRequest {
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  postalCode?: string;
  email: string;
  phone?: string;
  fax?: string;
  specialty?: string;
  status: string;
  interventionZone?: string;
  registrationDate: string;
  yearsOfExperience: number;
  currentWorkload: number;
  available: boolean;
  performanceScore: number;
  activeClaims: number;
  validationRate: number;
  maxWorkload: number;
}

@Injectable({ providedIn: 'root' })
export class ExpertApiService {
  private readonly http = inject(HttpClient);

  createExpert(body: CreateExpertRequest): Observable<Expert> {
    return this.http.post<Expert>(`${environment.apiBaseUrl}/api/experts/add`, body);
  }
}
