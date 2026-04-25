import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';

interface Notification {
  id: number;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'claim_update' | 'expert_assigned' | 'document_required' | 'payment';
  claimId?: number;
}

@Component({
  selector: 'app-client-notifications',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTabsModule],
  template: `
    <div class="notifications-container">
      <div class="header">
        <h1>🔔 Notifications</h1>
        <button mat-stroked-button (click)="markAllAsRead()" *ngIf="unreadCount > 0">
          <mat-icon>done_all</mat-icon> Tout marquer comme lu
        </button>
      </div>

      <mat-tab-group animationDuration="0ms">
        <mat-tab label="Toutes">
          <div class="tab-content">
            <div *ngFor="let notif of allNotifications" class="notification-item" [class.unread]="!notif.read" (click)="markAsRead(notif)">
              <div class="notif-icon" [class]="getIconClass(notif.type)">
                <mat-icon>{{ getIcon(notif.type) }}</mat-icon>
              </div>
              <div class="notif-content">
                <div class="notif-title">{{ notif.title }}</div>
                <div class="notif-message">{{ notif.message }}</div>
                <div class="notif-date">{{ getRelativeDate(notif.date) }}</div>
              </div>
              <div class="notif-badge" *ngIf="!notif.read"><span class="dot"></span></div>
            </div>
            <div *ngIf="allNotifications.length === 0" class="empty-state">
              <mat-icon>notifications_off</mat-icon><p>Aucune notification</p>
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Non lues">
          <div class="tab-content">
            <div *ngFor="let notif of unreadNotifications" class="notification-item unread" (click)="markAsRead(notif)">
              <div class="notif-icon" [class]="getIconClass(notif.type)">
                <mat-icon>{{ getIcon(notif.type) }}</mat-icon>
              </div>
              <div class="notif-content">
                <div class="notif-title">{{ notif.title }}</div>
                <div class="notif-message">{{ notif.message }}</div>
                <div class="notif-date">{{ getRelativeDate(notif.date) }}</div>
              </div>
            </div>
            <div *ngIf="unreadNotifications.length === 0" class="empty-state">
              <mat-icon>done_all</mat-icon><p>Toutes vos notifications sont lues</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .notifications-container { max-width: 900px; margin: 0 auto; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 24px; }
    .tab-content { padding: 16px 0; }
    .notification-item { display: flex; gap: 16px; padding: 16px; background: white; border-radius: 12px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s; border: 1px solid #e0e0e0; }
    .notification-item:hover { background: #f8f9fa; }
    .notification-item.unread { background: #f0f7ff; border-left: 3px solid #185FA5; }
    .notif-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .notif-icon.claim_update { background: #E6F1FB; color: #185FA5; }
    .notif-icon.expert_assigned { background: #FAEEDA; color: #FF8C00; }
    .notif-icon.document_required { background: #FCEBEB; color: #A32D2D; }
    .notif-icon.payment { background: #EAF3DE; color: #3B6D11; }
    .notif-content { flex: 1; }
    .notif-title { font-weight: 600; margin-bottom: 4px; }
    .notif-message { font-size: 13px; color: #666; margin-bottom: 6px; }
    .notif-date { font-size: 11px; color: #999; }
    .notif-badge { display: flex; align-items: center; }
    .dot { width: 8px; height: 8px; background: #185FA5; border-radius: 50%; }
    .empty-state { text-align: center; padding: 60px; color: #666; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.3; }
  `]
})
export class ClientNotificationsComponent implements OnInit {
  allNotifications: Notification[] = [];
  unreadNotifications: Notification[] = [];
  unreadCount = 0;

  constructor(private router: Router) {}

  ngOnInit(): void { this.loadNotifications(); }

  loadNotifications(): void {
    this.allNotifications = [
      { id: 1, title: 'Expert assigné', message: 'Karim Trabelsi a été assigné à votre sinistre CLM-20260410-9215', date: new Date(Date.now() - 2 * 60 * 60 * 1000), read: false, type: 'expert_assigned', claimId: 1 },
      { id: 2, title: 'Document requis', message: 'Merci d\'ajouter le constat amiable signé', date: new Date(Date.now() - 5 * 60 * 60 * 1000), read: false, type: 'document_required', claimId: 1 },
      { id: 3, title: 'Sinistre ouvert', message: 'Votre déclaration a été enregistrée avec succès', date: new Date(Date.now() - 24 * 60 * 60 * 1000), read: true, type: 'claim_update', claimId: 2 },
      { id: 4, title: 'Paiement effectué', message: 'L\'indemnisation de votre sinistre a été versée', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), read: true, type: 'payment', claimId: 3 }
    ];
    this.updateUnreadCount();
  }

  updateUnreadCount(): void {
    this.unreadNotifications = this.allNotifications.filter(n => !n.read);
    this.unreadCount = this.unreadNotifications.length;
  }

  markAsRead(notification: Notification): void {
    if (!notification.read) {
      notification.read = true;
      this.updateUnreadCount();
      if (notification.claimId) this.router.navigate(['/client/sinistres', notification.claimId]);
    }
  }

  markAllAsRead(): void {
    this.allNotifications.forEach(n => n.read = true);
    this.updateUnreadCount();
  }

  getIcon(type: string): string {
    switch (type) {
      case 'claim_update': return 'assignment';
      case 'expert_assigned': return 'engineering';
      case 'document_required': return 'description';
      case 'payment': return 'payments';
      default: return 'notifications';
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'claim_update': return 'claim_update';
      case 'expert_assigned': return 'expert_assigned';
      case 'document_required': return 'document_required';
      case 'payment': return 'payment';
      default: return '';
    }
  }

  getRelativeDate(date: Date): string {
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours} h`;
    if (diffDays < 7) return `il y a ${diffDays} j`;
    return date.toLocaleDateString('fr-FR');
  }
}