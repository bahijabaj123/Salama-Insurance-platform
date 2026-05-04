import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { LoggedUser } from '../auth/login.models';
import type { DeviceResponse } from './device.models';

/** Body for PUT /api/users/{id} — CLIENT profile saves send only fullName. */
export interface UserProfileUpdateRequest {
  fullName: string;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly http = inject(HttpClient);

  getCurrentUser(): Observable<LoggedUser> {
    return this.http.get<LoggedUser>(`${environment.apiBaseUrl}/api/users/me`);
  }

  updateUser(userId: number, body: UserProfileUpdateRequest): Observable<LoggedUser> {
    return this.http.put<LoggedUser>(`${environment.apiBaseUrl}/api/users/${userId}`, body);
  }

  /**
   * GET /api/users/me/devices
   * Returns devices linked to the currently authenticated user, ordered by
   * lastLoginAt DESC. The JWT interceptor adds the Authorization header.
   */
  getCurrentUserDevices(): Observable<DeviceResponse[]> {
    return this.http.get<DeviceResponse[]>(`${environment.apiBaseUrl}/api/users/me/devices`);
  }
}
