import { Injectable } from '@angular/core';

import type { LoggedUser, LoginResponse } from './login.models';

const STORAGE_PREFIX = 'salama.auth';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  private readonly tokenKey = `${STORAGE_PREFIX}.token`;
  private readonly typeKey = `${STORAGE_PREFIX}.tokenType`;
  private readonly userKey = `${STORAGE_PREFIX}.user`;

  saveLoginResult(result: LoginResponse): void {
    localStorage.setItem(this.tokenKey, result.token);
    localStorage.setItem(this.typeKey, result.type);
    localStorage.setItem(this.userKey, JSON.stringify(result.user));
  }

  /** Save token/type without user (e.g. OAuth2 redirect flow). */
  saveToken(token: string, type: string = 'Bearer'): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.typeKey, type);
  }

  clear(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.typeKey);
    localStorage.removeItem(this.userKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getTokenType(): string | null {
    return localStorage.getItem(this.typeKey);
  }

  getUser(): LoggedUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as LoggedUser;
    } catch {
      return null;
    }
  }

  /** Replace stored user (e.g. after profile refresh). Token/type unchanged. */
  updateStoredUser(user: LoggedUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }
}
