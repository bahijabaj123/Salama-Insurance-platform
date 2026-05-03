import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

function confirmPasswordMatches(passwordControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) {
      return null;
    }
    const passwordCtrl = parent.get(passwordControlName);
    if (!passwordCtrl) {
      return null;
    }
    if (!control.value) {
      return null;
    }
    return passwordCtrl.value === control.value ? null : { passwordMismatch: true };
  };
}

@Component({
  selector: 'app-reset-password',
    standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  submitting = false;
  success = false;
  successMessage = 'Password has been reset successfully.';
  globalError: string | null = null;
  token: string | null = null;

  readonly form = this.fb.group({
    newPassword: this.fb.control('', { validators: [Validators.required, Validators.minLength(6)] }),
    confirmPassword: this.fb.control('', {
      validators: [Validators.required, confirmPasswordMatches('newPassword')]
    })
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((map) => {
      const t = map.get('token');
      this.token = t && t.trim() ? t.trim() : null;
    });

    this.form.controls.newPassword.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: false });
    });

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
    if (!this.token) {
      this.globalError = 'Reset token is missing. Please use the link from your email again.';
      return;
    }

    this.submitting = true;
    this.globalError = null;

    const raw = this.form.getRawValue();
    this.auth
      .resetPassword({ token: this.token, newPassword: raw.newPassword })
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
    const msg = body && typeof body === 'object' && !Array.isArray(body) ? body.message : null;

    if (err.status === 400) {
      this.globalError = msg ?? 'Invalid or expired token.';
      return;
    }
    this.globalError = msg ?? 'Unable to reset password. Please try again.';
  }
}

