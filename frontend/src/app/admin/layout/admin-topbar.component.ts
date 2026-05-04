import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AdminApiService } from '../core/admin-api.service';
import type { AdminNotification } from '../core/admin.models';

const POLL_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss'
})
export class AdminTopbarComponent implements OnInit, OnDestroy {
  private readonly api = inject(AdminApiService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly pageTitle = input('Dashboard');
  readonly identity = input<{ initials: string; name: string } | null>(null);

  readonly notificationsClick = output<void>();
  readonly settingsClick = output<void>();

  /* ---------------- Notification state ---------------- */

  readonly notifications = signal<AdminNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly notifOpen = signal(false);
  readonly notifLoading = signal(false);
  readonly notifError = signal<string | null>(null);
  readonly markingAll = signal(false);

  readonly badgeText = computed(() => {
    const n = this.unreadCount();
    if (n <= 0) return '';
    return n > 99 ? '99+' : String(n);
  });

  private pollHandle: ReturnType<typeof setInterval> | undefined;

  ngOnInit(): void {
    this.refreshUnreadCount();
    this.pollHandle = setInterval(() => this.refreshUnreadCount(), POLL_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = undefined;
    }
  }

  /* ---------------- Public events kept for parent ---------------- */

  onSettings(): void {
    this.settingsClick.emit();
  }

  /* ---------------- Notifications: toggle / load ---------------- */

  toggleNotifications(event?: Event): void {
    event?.stopPropagation();
    const next = !this.notifOpen();
    this.notifOpen.set(next);
    this.notificationsClick.emit();
    if (next) {
      this.loadNotifications();
    }
  }

  closeNotifications(): void {
    if (this.notifOpen()) {
      this.notifOpen.set(false);
    }
  }

  loadNotifications(): void {
    this.notifLoading.set(true);
    this.notifError.set(null);
    this.api
      .getNotifications(0, 10)
      .pipe(finalize(() => this.notifLoading.set(false)))
      .subscribe({
        next: (list) => {
          // newest first — backend already sorts but enforce defensively
          const sorted = [...list].sort(
            (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
          );
          this.notifications.set(sorted);
          this.refreshUnreadCount();
        },
        error: (err: unknown) => {
          this.notifError.set(this.resolveErrorMessage(err, 'Unable to load notifications.'));
        }
      });
  }

  refreshUnreadCount(): void {
    this.api.getUnreadCount().subscribe({
      next: (n) => this.unreadCount.set(n),
      error: () => {
        // Stay quiet: badge just doesn't update; the dropdown surfaces real errors.
      }
    });
  }

  /* ---------------- Mark as read ---------------- */

  onNotificationClick(n: AdminNotification, event?: Event): void {
    event?.stopPropagation();
    if (n.read) return;
    // Optimistic update
    const previous = this.notifications();
    this.notifications.set(previous.map((it) => (it.id === n.id ? { ...it, read: true } : it)));
    this.unreadCount.set(Math.max(0, this.unreadCount() - 1));

    this.api.markNotificationAsRead(n.id).subscribe({
      next: () => this.refreshUnreadCount(),
      error: () => {
        // Revert on failure
        this.notifications.set(previous);
        this.refreshUnreadCount();
      }
    });
  }

  markAllRead(event?: Event): void {
    event?.stopPropagation();
    if (this.markingAll() || this.unreadCount() === 0) return;
    this.markingAll.set(true);
    const previous = this.notifications();
    this.notifications.set(previous.map((it) => ({ ...it, read: true })));
    this.unreadCount.set(0);

    this.api
      .markAllNotificationsAsRead()
      .pipe(finalize(() => this.markingAll.set(false)))
      .subscribe({
        next: () => this.refreshUnreadCount(),
        error: () => {
          this.notifications.set(previous);
          this.refreshUnreadCount();
        }
      });
  }

  /* ---------------- Helpers ---------------- */

  notificationKindClass(type: string | undefined): string {
    switch ((type ?? '').toUpperCase()) {
      case 'NEW_USER_REGISTERED':
        return 'notif--blue';
      case 'ACCOUNT_LOCKED':
        return 'notif--red';
      default:
        return 'notif--neutral';
    }
  }

  notificationIcon(type: string | undefined): string {
    switch ((type ?? '').toUpperCase()) {
      case 'NEW_USER_REGISTERED':
        return 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z';
      case 'ACCOUNT_LOCKED':
        return 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z';
      default:
        return 'M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z';
    }
  }

  private resolveErrorMessage(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse && err.status === 0) {
      return 'Unable to reach the server. Please check your connection.';
    }
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string } | string | null | undefined;
      if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.message === 'string') {
        return body.message;
      }
    }
    return fallback;
  }

  /* ---------------- Outside click & escape ---------------- */

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.notifOpen()) return;
    const target = event.target as Node | null;
    if (target && this.host.nativeElement.contains(target)) return;
    this.closeNotifications();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeNotifications();
  }
}
