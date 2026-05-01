import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { AuthStorageService } from '../../core/auth/auth-storage.service';
import type { LoginApiErrorBody, LoginRequest } from '../../core/auth/login.models';
import { HomeNavbarComponent } from '../../shared/home-navbar/home-navbar.component';
import { SilkBackgroundComponent } from '../../shared/silk/silk-background.component';
import { environment } from '../../../environments/environment';

type LoginServerFieldKey = 'email' | 'password';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, HomeNavbarComponent, SilkBackgroundComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly authStorage = inject(AuthStorageService);
  private readonly router = inject(Router);

  readonly currentYear = new Date().getFullYear();

  submitting = false;
  loginSuccess = false;
  successMessage = '';
  globalError: string | null = null;
  serverFieldErrors: Partial<Record<LoginServerFieldKey, string>> = {};

  readonly form = this.fb.group({
    email: this.fb.control('', {
      validators: [Validators.required, Validators.email]
    }),
    password: this.fb.control('', {
      validators: [Validators.required]
    })
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.globalError) {
        this.globalError = null;
      }
      if (Object.keys(this.serverFieldErrors).length > 0) {
        this.serverFieldErrors = {};
      }
    });
  }

  onGoogleSignIn(): void {
    // Backend OAuth2 currently returns JSON directly after Google sign-in success
    // (no redirect back to Angular yet). For now we start the real OAuth2 flow by
    // navigating the browser to the backend entry URL.
    window.location.assign(`${environment.apiBaseUrl}/oauth2/authorization/google`);
  }

  onGithubSignIn(): void {
    window.location.assign(`${environment.apiBaseUrl}/oauth2/authorization/github`);
  }

  onSubmit(): void {
    if (this.loginSuccess) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.globalError = null;
    this.serverFieldErrors = {};
    this.submitting = true;

    const raw = this.form.getRawValue();
    const credentials: LoginRequest = {
      email: raw.email.trim(),
      password: raw.password
    };

    this.auth
      .login(credentials)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (response) => {
          this.authStorage.saveLoginResult(response);
          if (!environment.production) {
            console.debug('[Salama Auth] Logged-in user:', response.user);
          }
          if (response.user.role === 'CLIENT') {
            void this.router.navigateByUrl('/client');
            return;
          }
          if (response.user.role === 'ADMIN') {
            void this.router.navigateByUrl('/admin/dashboard');
            return;
          }
          if (response.user.role === 'EXPERT') {
            void this.router.navigateByUrl('/expert/dashboard');
            return;
          }
          if (response.user.role === 'ASSUREUR') {
             void this.router.navigateByUrl('/assureur/dashboard');
             return;
            }

          this.loginSuccess = true;
          this.successMessage =
            'Signed in successfully. Client and Admin workspaces are available for supported accounts; additional roles will be supported in a future release.';
        },
        error: (err: unknown) => this.applyLoginHttpError(err)
      });
  }

  private applyLoginHttpError(err: unknown): void {
    if (!(err instanceof HttpErrorResponse)) {
      this.globalError = 'Something went wrong. Please try again.';
      return;
    }

    if (err.status === 0) {
      this.globalError =
        'Unable to reach the server. Check your connection and that the API is running on the configured base URL.';
      return;
    }

    const body = err.error as LoginApiErrorBody | string | null | undefined;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      this.globalError = 'Something went wrong. Please try again.';
      return;
    }

    if (err.status === 401) {
      this.globalError = 'Invalid email or password.';
      return;
    }

    if (err.status === 423) {
      this.globalError =
        body.message ??
        'Account is locked (compte verrouillé). Contact an administrator.';
      return;
    }

    if (err.status === 400) {
      if (body.errors && typeof body.errors === 'object') {
        const mapped: Partial<Record<LoginServerFieldKey, string>> = {};
        for (const key of ['email', 'password'] as const) {
          const msg = body.errors[key];
          if (typeof msg === 'string' && msg.trim()) {
            mapped[key] = msg;
          }
        }
        if (Object.keys(mapped).length > 0) {
          this.serverFieldErrors = mapped;
        }
      }

      const hasFieldMessages = Object.keys(this.serverFieldErrors).length > 0;
      if (body.message) {
        if (!hasFieldMessages) {
          this.globalError = body.message;
        } else if (body.message !== 'Validation failed') {
          this.globalError = body.message;
        }
      } else if (!hasFieldMessages) {
        this.globalError = 'The request could not be processed. Please review your details.';
      }
      return;
    }

    this.globalError = body.message ?? 'Something went wrong. Please try again.';
  }
}
