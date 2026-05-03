import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStorageService } from '../../core/auth/auth-storage.service';

/**
 * Allows access to `/client/**` only when a JWT and stored user exist and the user role is CLIENT.
 */
export const clientAuthGuard: CanActivateFn = () => {
  const storage = inject(AuthStorageService);
  const router = inject(Router);

  const token = storage.getToken();
  const user = storage.getUser();

  if (!token || !user) {
    return router.createUrlTree(['/login']);
  }

  if (user.role !== 'CLIENT') {
    return router.createUrlTree(['/login']);
  }

  return true;
};
