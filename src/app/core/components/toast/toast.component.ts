// src/app/core/components/toast/toast.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, PushNotification } from '../../services/notification.service';
import { MatIconModule } from '@angular/material/icon'; 

@Component({
  selector: 'app-toast',
  standalone: true,
   imports: [CommonModule, MatIconModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let notif of notifications" 
           class="toast toast-{{ notif.type }}"
           [class.slide-in]="true"
           (click)="onClick(notif)">
        <div class="toast-icon">
          <mat-icon>{{ getIcon(notif.type) }}</mat-icon>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{ notif.title }}</div>
          <div class="toast-message">{{ notif.message }}</div>
        </div>
        <button class="toast-close" (click)="$event.stopPropagation(); remove(notif.id)">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .toast {
      min-width: 300px;
      max-width: 400px;
      background: white;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      cursor: pointer;
      transition: all 0.3s ease;
      animation: slideIn 0.3s ease;
    }
    .toast:hover {
      transform: translateX(-4px);
    }
    .toast-info { border-left: 4px solid #185FA5; }
    .toast-success { border-left: 4px solid #3B6D11; }
    .toast-warning { border-left: 4px solid #FF8C00; }
    .toast-error { border-left: 4px solid #A32D2D; }
    .toast-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }
    .toast-info .toast-icon { color: #185FA5; }
    .toast-success .toast-icon { color: #3B6D11; }
    .toast-warning .toast-icon { color: #FF8C00; }
    .toast-error .toast-icon { color: #A32D2D; }
    .toast-content { flex: 1; }
    .toast-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .toast-message { font-size: 12px; color: #666; }
    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      display: flex;
      align-items: center;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  notifications: PushNotification[] = [];
   private subscription: Subscription = new Subscription();
   

  constructor(
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(notif => {
      this.notifications.push(notif);
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== notif.id);
      }, notif.duration || 5000);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  getIcon(type: string): string {
    switch(type) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  }

  onClick(notif: PushNotification): void {
    this.notificationService.markAsRead(notif.id);
    if (notif.claimId) {
      this.router.navigate(['/assureur/claims', notif.claimId]);
    }
    this.remove(notif.id);
  }

  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notificationService.remove(id);
  }
}
