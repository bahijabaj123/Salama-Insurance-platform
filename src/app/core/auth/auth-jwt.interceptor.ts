import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthStorageService } from './auth-storage.service';

/** Paths that must not receive an Authorization header (public auth). */
function isPublicAuthUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.replace(/\/+$/, '') || '/';
    return pathname === '/api/auth/login' || pathname === '/api/auth/register';
  } catch {
    return /\/api\/auth\/(?:login|register)(?:\?|#|$)/.test(url);
  }
}

export const authJwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPublicAuthUrl(req.url)) {
    return next(req);
  }

  const storage = inject(AuthStorageService);
  const token = storage.getToken();
  if (!token) {
    return next(req);
  }

  const tokenType = (storage.getTokenType() ?? 'Bearer').trim();
  const authorization = `${tokenType} ${token}`;

  return next(
    req.clone({
      setHeaders: {
        Authorization: authorization
      }
    })
  );
};
