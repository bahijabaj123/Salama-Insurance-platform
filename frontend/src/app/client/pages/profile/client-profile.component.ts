import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import type { LoggedUser, LoginApiErrorBody } from '../../../core/auth/login.models';
import { UserApiService } from '../../../core/users/user-api.service';

type MockDevice = {
  name: string;
  detail: string;
  badge: 'Current session' | 'Preview';
};

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <div class="profile saas-container">
      <header class="page-head">
        <div class="page-head__titles">
          <p class="page-eyebrow">Account</p>
          <h2 class="page-title">Profile &amp; security</h2>
          <p class="page-subtitle">
            Review your identity details, keep your name up to date, and preview how device trust will appear once backend
            sync is enabled.
          </p>
        </div>
        @if (profile()) {
          <div class="page-head__actions">
            @if (!editMode()) {
              <button type="button" class="btn btn--primary" (click)="startEdit()">Edit profile</button>
            } @else {
              <button type="button" class="btn btn--ghost" (click)="cancelEdit()" [disabled]="saving()">Cancel</button>
              <button type="button" class="btn btn--primary" (click)="saveProfile()" [disabled]="saving()">
                @if (saving()) {
                  Saving…
                } @else {
                  Save changes
                }
              </button>
            }
          </div>
        }
      </header>

      @if (saveSuccess()) {
        <div class="banner banner--success" role="status">
          <strong>Changes saved</strong>
          <span>Your profile has been updated and your session details refreshed.</span>
        </div>
      }

      @if (loading()) {
        <section class="card card--loading" aria-busy="true">
          <div class="skeleton skeleton--title"></div>
          <div class="skeleton skeleton--line"></div>
          <div class="skeleton skeleton--line skeleton--short"></div>
          <div class="skeleton skeleton--grid">
            <div class="skeleton skeleton--block"></div>
            <div class="skeleton skeleton--block"></div>
          </div>
        </section>
      } @else {
        @if (loadError()) {
          <section class="card banner banner--error" role="alert">
            <strong>We couldn't load your profile</strong>
            <p>{{ loadError() }}</p>
            <button type="button" class="btn btn--primary btn--compact" (click)="loadProfile()">Try again</button>
          </section>
        } @else {
          @if (profile(); as user) {
            <form class="profile__grid" [formGroup]="form" (ngSubmit)="$event.preventDefault()">
              <section class="card profile__card saas-card">
                <div class="card__head">
                  <div>
                    <h3 class="card__title">Personal information</h3>
                    <p class="card__sub">Identity fields from Salama. Only your full name can be edited as a client.</p>
                  </div>
                </div>

                @if (saveError()) {
                  <div class="inline-error" role="alert">{{ saveError() }}</div>
                }

                <dl class="fields">
                  <div class="field-row">
                    <dt>Full name</dt>
                    <dd>
                      @if (editMode()) {
                        <div class="field-edit">
                          <input
                            class="input"
                            type="text"
                            formControlName="fullName"
                            autocomplete="name"
                            [disabled]="saving()"
                          />
                          @if (form.controls.fullName.touched && form.controls.fullName.invalid) {
                            <span class="field-hint field-hint--error">Full name is required.</span>
                          }
                        </div>
                      } @else {
                        <span class="field-value">{{ user.fullName }}</span>
                      }
                    </dd>
                  </div>

                  <div class="field-row">
                    <dt>Email</dt>
                    <dd><span class="field-value field-value--muted">{{ user.email }}</span></dd>
                  </div>

                  <div class="field-row">
                    <dt>Active role</dt>
                    <dd><span class="badge badge--solid">{{ user.role }}</span></dd>
                  </div>

                  <div class="field-row">
                    <dt>Requested role</dt>
                    <dd>
                      @if (user.requestedRole) {
                        <span class="badge">{{ user.requestedRole }}</span>
                      } @else {
                        <span class="field-value field-value--muted">—</span>
                      }
                    </dd>
                  </div>

                  <div class="field-row">
                    <dt>Approval status</dt>
                    <dd><span class="badge badge--soft">{{ user.approvalStatus }}</span></dd>
                  </div>
                </dl>
              </section>

              <div class="profile__stack">
                <section class="card profile__card saas-card">
                  <div class="card__head">
                    <div>
                      <h3 class="card__title">Account summary</h3>
                      <p class="card__sub">High-signal status for underwriting and access control teams.</p>
                    </div>
                  </div>

                  <div class="chips">
                    <div class="chip">
                      <span class="chip__label">Role</span>
                      <span class="chip__value">{{ user.role }}</span>
                    </div>
                    <div class="chip">
                      <span class="chip__label">Approval</span>
                      <span class="chip__value">{{ user.approvalStatus }}</span>
                    </div>
                    <div class="chip">
                      <span class="chip__label">Enabled</span>
                      <span class="chip__value" [class.chip__value--ok]="user.enabled" [class.chip__value--bad]="!user.enabled">
                        {{ user.enabled ? 'Yes' : 'No' }}
                      </span>
                    </div>
                    <div class="chip">
                      <span class="chip__label">Locked</span>
                      <span class="chip__value" [class.chip__value--ok]="!user.locked" [class.chip__value--bad]="user.locked">
                        {{ user.locked ? 'Yes' : 'No' }}
                      </span>
                    </div>
                  </div>

                  <div class="meta-grid">
                    <div class="meta">
                      <span class="meta__label">Member since</span>
                      <span class="meta__value">{{ user.createdAt | date: 'mediumDate' }}</span>
                    </div>
                    <div class="meta">
                      <span class="meta__label">Last updated</span>
                      <span class="meta__value">{{ user.updatedAt | date: 'medium' }}</span>
                    </div>
                  </div>
                </section>

                <section class="card profile__card profile__card--devices saas-card">
                  <div class="card__head">
                    <div>
                      <h3 class="card__title">Connected devices</h3>
                      <p class="card__sub">
                        Security-focused view of where your account is active. This section is UI-only until device APIs are
                        connected.
                      </p>
                    </div>
                  </div>

                  <ul class="device-list" aria-label="Preview device list">
                    @for (device of mockDevices; track device.name) {
                      <li class="device">
                        <div class="device__icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M4 6h16v10H4V6zm2 2v6h12V8H6zm8 10h2v2H6v-2h8z"
                            />
                          </svg>
                        </div>
                        <div class="device__body">
                          <div class="device__top">
                            <span class="device__name">{{ device.name }}</span>
                            <span class="device__badge" [class.device__badge--accent]="device.badge === 'Current session'">
                              {{ device.badge }}
                            </span>
                          </div>
                          <p class="device__detail">{{ device.detail }}</p>
                        </div>
                      </li>
                    }
                  </ul>

                  <div class="device-footnote">
                    <strong>Coming next:</strong> register, rename, and revoke devices from a secured endpoint—without leaving
                    this profile experience.
                  </div>
                </section>
              </div>
            </form>
          }
        }
      }
    </div>
  `,
  styles: `
    /* ============================================================ */
    /* STYLES COMPLETS POUR LA PAGE PROFIL                          */
    /* ============================================================ */
    
    :host {
      display: block;
    }
    
    :root {
      --s-text: #1a2332;
      --s-muted: #6b7a8e;
      --s-border: #e2e6ea;
      --s-color-primary: #185fa5;
      --s-color-primary-light: #e8f1f9;
      --s-surface: #f4f6fa;
      --s-card-bg: #ffffff;
    }
    
    .profile {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 1120px;
    }
    
    .profile__grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.95rem;
    }
    
    @media (min-width: 1040px) {
      .profile__grid {
        grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
        align-items: start;
      }
    }
    
    .profile__stack {
      display: flex;
      flex-direction: column;
      gap: 0.95rem;
    }
    
    .page-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }
    
    .page-head__titles {
      flex: 1;
    }
    
    .page-eyebrow {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--s-muted);
      margin: 0 0 0.25rem;
    }
    
    .page-title {
      font-size: 26px;
      font-weight: 700;
      margin: 0 0 0.5rem;
      color: var(--s-text);
    }
    
    .page-subtitle {
      font-size: 14px;
      color: var(--s-muted);
      margin: 0;
      line-height: 1.45;
    }
    
    .page-head__actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }
    
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 40px;
      padding: 8px 20px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s;
      border: 1px solid transparent;
    }
    
    .btn--primary {
      background: var(--s-color-primary);
      color: white;
    }
    
    .btn--primary:hover {
      background: #0e4a82;
    }
    
    .btn--ghost {
      background: transparent;
      border-color: var(--s-border);
      color: var(--s-text);
    }
    
    .btn--ghost:hover {
      background: var(--s-surface);
    }
    
    .btn--compact {
      padding: 6px 16px;
      font-size: 12px;
    }
    
    .banner {
      padding: 0.85rem 1rem;
      border-radius: 14px;
      display: flex;
      gap: 0.75rem;
      align-items: baseline;
      flex-wrap: wrap;
    }
    
    .banner--success {
      background: #e8f5e9;
      border: 1px solid #c8e6c9;
      color: #1e4620;
    }
    
    .banner--error {
      background: #fdecea;
      border: 1px solid #f5c2c0;
      color: #5c0f0a;
    }
    
    .card {
      background: white;
      border-radius: 1rem;
      border: 1px solid var(--s-border);
      overflow: hidden;
    }
    
    .card__head {
      padding: 1.25rem 1.25rem 0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .card__title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
      color: var(--s-text);
    }
    
    .card__sub {
      font-size: 13px;
      color: var(--s-muted);
      margin: 0;
    }
    
    .card--loading {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .fields {
      margin: 0;
      padding: 0.5rem 1.25rem 1.25rem;
    }
    
    .field-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.35rem;
      padding: 0.75rem 0;
      border-top: 1px solid #f1f5f9;
    }
    
    @media (min-width: 720px) {
      .field-row {
        grid-template-columns: 220px minmax(0, 1fr);
        align-items: start;
        gap: 1rem;
      }
    }
    
    .field-row:first-of-type {
      border-top: 0;
      padding-top: 0;
    }
    
    .field-row dt {
      margin: 0;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--s-muted);
    }
    
    .field-row dd {
      margin: 0;
    }
    
    .field-value {
      font-weight: 850;
      color: var(--s-text);
      font-size: 14px;
    }
    
    .field-value--muted {
      color: #475569;
      font-weight: 700;
    }
    
    .field-edit {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      max-width: 34rem;
    }
    
    .input {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--s-border);
      border-radius: 14px;
      padding: 10px 12px;
      font: inherit;
      font-weight: 650;
      color: var(--s-text);
      background: #fff;
      transition: border-color 150ms, box-shadow 150ms;
    }
    
    .input:focus {
      outline: none;
      border-color: var(--s-color-primary);
      box-shadow: 0 0 0 3px rgb(94 176 255 / 0.22);
    }
    
    .input:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    
    .field-hint {
      font-size: 12px;
      font-weight: 700;
    }
    
    .field-hint--error {
      color: #b42318;
    }
    
    .inline-error {
      margin: 0 0 0.85rem;
      padding: 0.65rem 0.75rem;
      border-radius: 14px;
      border: 1px solid #f5c2c0;
      background: #fdecea;
      color: #5c0f0a;
      font-weight: 750;
      font-size: 13px;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 40px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid;
    }
    
    .badge--solid {
      background: var(--s-color-primary);
      border-color: var(--s-color-primary);
      color: #fff;
    }
    
    .badge--soft {
      background: #e8f1f9;
      border-color: #cfe1f5;
      color: var(--s-color-primary);
    }
    
    .chips {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 0.65rem;
      padding: 0.5rem 1.25rem 1.25rem;
    }
    
    .chip {
      grid-column: span 12;
      border: 1px solid #eef2f7;
      background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
      border-radius: 0.85rem;
      padding: 0.75rem 0.8rem;
    }
    
    @media (min-width: 520px) {
      .chip {
        grid-column: span 6;
      }
    }
    
    @media (min-width: 1040px) {
      .chip {
        grid-column: span 12;
      }
    }
    
    .chip__label {
      display: block;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--s-muted);
      margin-bottom: 0.25rem;
    }
    
    .chip__value {
      display: block;
      font-size: 14px;
      font-weight: 900;
      color: var(--s-text);
    }
    
    .chip__value--ok {
      color: #0d3d2e;
    }
    
    .chip__value--bad {
      color: #7a1c16;
    }
    
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      margin-top: 0.95rem;
      padding: 0 1.25rem 1.25rem;
      border-top: 1px solid #f1f5f9;
    }
    
    @media (min-width: 520px) {
      .meta-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    
    .meta {
      border: 1px dashed #dbe7f3;
      border-radius: 0.85rem;
      padding: 0.75rem 0.8rem;
      background: #fbfdff;
    }
    
    .meta__label {
      display: block;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--s-muted);
      margin-bottom: 0.25rem;
    }
    
    .meta__value {
      font-weight: 850;
      color: var(--s-text);
    }
    
    .device-list {
      list-style: none;
      margin: 0;
      padding: 0.5rem 1.25rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    
    .device {
      display: flex;
      gap: 0.75rem;
      padding: 0.85rem;
      border-radius: 0.85rem;
      border: 1px solid #eef2f7;
      background: #fff;
    }
    
    .device__icon {
      width: 2.35rem;
      height: 2.35rem;
      border-radius: 0.75rem;
      display: grid;
      place-items: center;
      color: var(--s-color-primary);
      background: #e8f1f9;
      border: 1px solid #d7e6f6;
      flex: 0 0 auto;
    }
    
    .device__icon svg {
      width: 1.2rem;
      height: 1.2rem;
    }
    
    .device__body {
      min-width: 0;
    }
    
    .device__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    
    .device__name {
      font-weight: 900;
      letter-spacing: -0.02em;
    }
    
    .device__badge {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid #dbe7f3;
      color: var(--s-muted);
      background: #fbfdff;
      white-space: nowrap;
    }
    
    .device__badge--accent {
      color: var(--s-color-primary);
      border-color: #cfe1f5;
      background: #e8f1f9;
    }
    
    .device__detail {
      margin: 0.35rem 0 0;
      color: #475569;
      line-height: 1.45;
      font-size: 13.5px;
    }
    
    .device-footnote {
      margin: 0.5rem 1.25rem 1.25rem;
      padding: 0.85rem;
      border-radius: 0.85rem;
      border: 1px solid #dbe7f3;
      background: linear-gradient(180deg, #fbfdff 0%, #f3f7ff 100%);
      color: #334155;
      line-height: 1.45;
      font-size: 13px;
    }
    
    .device-footnote strong {
      color: var(--s-text);
    }
    
    .skeleton {
      border-radius: 0.75rem;
      background: linear-gradient(90deg, #eef2f7 0%, #f8fafc 50%, #eef2f7 100%);
      background-size: 200% 100%;
      animation: shimmer 1.1s ease-in-out infinite;
    }
    
    .skeleton--title {
      height: 1.35rem;
      width: 40%;
    }
    
    .skeleton--line {
      height: 0.95rem;
      width: 92%;
    }
    
    .skeleton--short {
      width: 62%;
    }
    
    .skeleton--grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    
    .skeleton--block {
      height: 6.5rem;
    }
    
    @keyframes shimmer {
      0% {
        background-position: 0% 0%;
      }
      100% {
        background-position: -200% 0%;
      }
    }
  `
})
export class ClientProfileComponent implements OnInit, OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly userApi = inject(UserApiService);
  private readonly authStorage = inject(AuthStorageService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly profile = signal<LoggedUser | null>(null);

  readonly editMode = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly saveSuccess = signal(false);

  private saveSuccessTimer: ReturnType<typeof setTimeout> | undefined;

  readonly form = this.fb.group({
    fullName: this.fb.control('', { validators: [Validators.required] })
  });

  readonly mockDevices: MockDevice[] = [
    {
      name: 'This browser',
      detail: 'The session you are using right now. Revocation controls will appear here once available.',
      badge: 'Current session'
    },
    {
      name: 'Trusted device (example)',
      detail: 'Placeholder for a registered phone or laptop. Data will sync from the server when device APIs ship.',
      badge: 'Preview'
    }
  ];

  ngOnInit(): void {
    this.loadProfile();
  }

  ngOnDestroy(): void {
    if (this.saveSuccessTimer) {
      clearTimeout(this.saveSuccessTimer);
    }
  }

  startEdit(): void {
    const user = this.profile();
    if (!user) return;
    this.saveError.set(null);
    this.editMode.set(true);
    this.form.controls.fullName.setValue(user.fullName);
  }

  cancelEdit(): void {
    const user = this.profile();
    if (user) {
      this.form.controls.fullName.setValue(user.fullName);
    }
    this.form.controls.fullName.markAsPristine();
    this.form.controls.fullName.markAsUntouched();
    this.saveError.set(null);
    this.editMode.set(false);
  }

  saveProfile(): void {
    const user = this.profile();
    if (!user) return;
    this.form.controls.fullName.markAsTouched();
    if (this.form.controls.fullName.invalid) return;

    this.saveError.set(null);
    this.saving.set(true);

    const fullName = this.form.controls.fullName.value.trim();
    this.userApi
      .updateUser(user.id, { fullName })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.authStorage.updateStoredUser(updated);
          this.form.controls.fullName.setValue(updated.fullName);
          this.editMode.set(false);
          this.flashSaveSuccess();
        },
        error: (err: unknown) => this.handleSaveError(err)
      });
  }

  loadProfile(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.userApi
      .getCurrentUser()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (user) => {
          this.profile.set(user);
          this.form.controls.fullName.setValue(user.fullName);
        },
        error: (err: unknown) => this.handleLoadError(err)
      });
  }

  private handleLoadError(err: unknown): void {
    if (this.isUnauthorized(err)) {
      this.handleUnauthorized();
      return;
    }
    this.loadError.set(this.resolveApiMessage(err, 'Unable to load your profile. Please try again.'));
  }

  private handleSaveError(err: unknown): void {
    if (this.isUnauthorized(err)) {
      this.handleUnauthorized();
      return;
    }
    if (err instanceof HttpErrorResponse && err.status === 403) {
      this.saveError.set('Access denied. You cannot update this profile.');
      return;
    }
    if (err instanceof HttpErrorResponse && err.status === 404) {
      this.saveError.set('Profile not found.');
      return;
    }
    this.saveError.set(this.resolveApiMessage(err, 'Unable to save changes. Please try again.'));
  }

  private isUnauthorized(err: unknown): boolean {
    return err instanceof HttpErrorResponse && err.status === 401;
  }

  private handleUnauthorized(): void {
    this.authStorage.clear();
    void this.router.navigateByUrl('/login');
  }

  private resolveApiMessage(err: unknown, fallback: string): string {
    if (!(err instanceof HttpErrorResponse)) return fallback;
    const body = err.error as LoginApiErrorBody | string | null | undefined;
    if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.message === 'string') {
      return body.message;
    }
    return fallback;
  }

  private flashSaveSuccess(): void {
    if (this.saveSuccessTimer) {
      clearTimeout(this.saveSuccessTimer);
    }
    this.saveSuccess.set(true);
    this.saveSuccessTimer = setTimeout(() => {
      this.saveSuccess.set(false);
      this.saveSuccessTimer = undefined;
    }, 4200);
  }
}