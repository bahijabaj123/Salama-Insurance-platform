import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStorageService } from '../../../core/auth/auth-storage.service';

/**
 * Allows access to assureur routes only when a JWT and stored user exist 
 * and the user role is ASSUREUR.
 */
export const assureurAuthGuard: CanActivateFn = () => {
  const storage = inject(AuthStorageService);
  const router = inject(Router);

  const token = storage.getToken();
  const user = storage.getUser();

  // Pas de token ou pas d'utilisateur → rediriger vers login
  if (!token || !user) {
    return router.createUrlTree(['/login']);
  }

  // Rôle différent de ASSUREUR → rediriger vers login
  if (user.role !== 'ASSUREUR') {
    return router.createUrlTree(['/login']);
  }

  return true;
};