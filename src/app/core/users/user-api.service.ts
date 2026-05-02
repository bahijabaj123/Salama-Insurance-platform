import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { LoggedUser } from '../auth/login.models';

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
}
