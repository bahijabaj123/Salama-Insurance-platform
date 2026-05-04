import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthStorageService } from '../../core/auth/auth-storage.service';
import { UserApiService } from '../../core/users/user-api.service';

@Component({
  selector: 'app-oauth2-success',
  standalone: true,
  imports: [],
  templateUrl: './oauth2-success.component.html',
  styleUrl: './oauth2-success.component.scss'
})
export class OAuth2SuccessComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly storage = inject(AuthStorageService);
  private readonly users = inject(UserApiService);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const token = (params.get('token') ?? '').trim();
      if (!token) {
        void this.router.navigateByUrl('/login');
        return;
      }

      // Persist token first so the JWT interceptor can attach it to /api/users/me.
      this.storage.saveToken(token, 'Bearer');

      this.users.getCurrentUser().pipe(takeUntilDestroyed()).subscribe({
        next: (user) => {
          this.storage.updateStoredUser(user);
          if (user.role === 'CLIENT') {
            void this.router.navigateByUrl('/client/dashboard');
            return;
          }
          if (user.role === 'ADMIN') {
            void this.router.navigateByUrl('/admin/dashboard');
            return;
          }
          if (user.role === 'EXPERT') {
            void this.router.navigateByUrl('/expert/dashboard');
            return;
          }
          // Unknown role: return to login for now.
          this.storage.clear();
          void this.router.navigateByUrl('/login');
        },
        error: () => {
          this.storage.clear();
          void this.router.navigateByUrl('/login');
        }
      });
    });
  }
}

