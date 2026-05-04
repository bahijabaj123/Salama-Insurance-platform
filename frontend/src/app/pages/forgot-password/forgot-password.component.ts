import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
    standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);

  submitting = false;
  success = false;
  successMessage =
    'If an account with that email exists, a reset link has been sent.';
  globalError: string | null = null;

  readonly form = this.fb.group({
    email: this.fb.control('', { validators: [Validators.required, Validators.email] })
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.globalError) {
        this.globalError = null;
      }
    });
  }

  onSubmit(): void {
    if (this.success) {
      return;
    }
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    this.globalError = null;
    this.submitting = true;

    const email = this.form.getRawValue().email.trim();
    this.auth
      .forgotPassword({ email })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (res) => {
          this.success = true;
          this.successMessage = res.message ?? this.successMessage;
        },
        error: (err: unknown) => this.applyHttpError(err)
      });
  }

  private applyHttpError(err: unknown): void {
    if (!(err instanceof HttpErrorResponse)) {
      this.globalError = 'Something went wrong. Please try again.';
      return;
    }
    if (err.status === 0) {
      this.globalError =
        'Unable to reach the server. Check your connection and that the API is running.';
      return;
    }
    const body = err.error as { message?: string } | string | null | undefined;
    if (body && typeof body === 'object' && !Array.isArray(body) && body.message) {
      this.globalError = body.message;
      return;
    }
    this.globalError = 'Unable to send reset email. Please try again.';
  }
}

