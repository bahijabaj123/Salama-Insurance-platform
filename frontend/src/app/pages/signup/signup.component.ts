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
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import type { RegisterErrorBody, RegisterRequest } from '../../core/auth/register.models';
import { HomeNavbarComponent } from '../../shared/home-navbar/home-navbar.component';
import { SilkBackgroundComponent } from '../../shared/silk/silk-background.component';

export type SignupRole = 'CLIENT' | 'ASSUREUR' | 'EXPERT';

type SignupServerFieldKey = 'fullName' | 'email' | 'password' | 'role';

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
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink, HomeNavbarComponent, SilkBackgroundComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);

  readonly currentYear = new Date().getFullYear();

  submitting = false;
  registrationSuccess = false;
  successMessage = '';
  globalError: string | null = null;
  serverFieldErrors: Partial<Record<SignupServerFieldKey, string>> = {};

  readonly form = this.fb.group({
    fullName: this.fb.control('', { validators: [Validators.required] }),
    email: this.fb.control('', { validators: [Validators.required, Validators.email] }),
    password: this.fb.control('', { validators: [Validators.required, Validators.minLength(6)] }),
    confirmPassword: this.fb.control('', {
      validators: [Validators.required, confirmPasswordMatches('password')]
    }),
    role: this.fb.control<SignupRole>('CLIENT', { validators: [Validators.required] })
  });

  constructor() {
    this.form.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.form.controls.confirmPassword.updateValueAndValidity({ emitEvent: false });
      });

    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.globalError) {
        this.globalError = null;
      }
      if (Object.keys(this.serverFieldErrors).length > 0) {
        this.serverFieldErrors = {};
      }
    });
  }

  onSubmit(): void {
    if (this.registrationSuccess) {
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
    const payload: RegisterRequest = {
      fullName: raw.fullName.trim(),
      email: raw.email.trim(),
      password: raw.password,
      role: raw.role
    };

    this.auth
      .register(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (res) => {
          this.registrationSuccess = true;
          this.successMessage =
            res.message ??
            'Registration successful. Please check your email to verify your account.';
          this.form.reset({
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            role: 'CLIENT'
          });
        },
        error: (err: unknown) => this.applyRegisterHttpError(err)
      });
  }

  private applyRegisterHttpError(err: unknown): void {
    if (!(err instanceof HttpErrorResponse)) {
      this.globalError = 'Something went wrong. Please try again.';
      return;
    }

    if (err.status === 0) {
      this.globalError =
        'Unable to reach the server. Check your connection and that the API is running on the configured base URL.';
      return;
    }

    const body = err.error as RegisterErrorBody | string | null | undefined;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      this.globalError = 'Something went wrong. Please try again.';
      return;
    }

    if (err.status === 409) {
      this.globalError = body.message ?? 'Email already exists.';
      return;
    }

    if (err.status === 400) {
      if (body.errors && typeof body.errors === 'object') {
        const mapped: Partial<Record<SignupServerFieldKey, string>> = {};
        const keys: SignupServerFieldKey[] = ['fullName', 'email', 'password', 'role'];
        for (const key of keys) {
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
