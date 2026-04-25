import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { LoginRequest, LoginResponse } from './login.models';
import type { RegisterRequest, RegisterSuccessResponse } from './register.models';

type ForgotPasswordRequest = { email: string };
type MessageResponse = { message?: string };
type ResetPasswordRequest = { token: string; newPassword: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  register(payload: RegisterRequest): Observable<RegisterSuccessResponse> {
    const url = `${environment.apiBaseUrl}/api/auth/register`;
    return this.http.post<RegisterSuccessResponse>(url, payload);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const url = `${environment.apiBaseUrl}/api/auth/login`;
    return this.http.post<LoginResponse>(url, credentials);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<MessageResponse> {
    const url = `${environment.apiBaseUrl}/api/auth/forgot-password`;
    return this.http.post<MessageResponse>(url, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<MessageResponse> {
    const url = `${environment.apiBaseUrl}/api/auth/reset-password`;
    return this.http.post<MessageResponse>(url, payload);
  }

  
}
