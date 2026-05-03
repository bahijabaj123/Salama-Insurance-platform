// src/app/core/services/notification.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  claimId?: number;
  read: boolean;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new Subject<PushNotification>();
  notifications$ = this.notificationsSubject.asObservable();
  
  private unreadCountSubject = new Subject<number>();
  unreadCount$ = this.unreadCountSubject.asObservable();
  
  private notifications: PushNotification[] = [];
  private unreadCount = 0;

  constructor() {
    this.loadFromLocalStorage();
  }

  // Ajouter une notification
  show(title: string, message: string, type: PushNotification['type'] = 'info', duration = 5000, claimId?: number): void {
    const notification: PushNotification = {
      id: Date.now().toString() + Math.random(),
      title,
      message,
      type,
      duration,
      claimId,
      read: false,
      createdAt: new Date()
    };
    
    this.notifications.unshift(notification);
    this.unreadCount++;
    this.saveToLocalStorage();
    
    this.notificationsSubject.next(notification);
    this.unreadCountSubject.next(this.unreadCount);
    
    // Auto-supprimer après durée
    if (duration > 0) {
      setTimeout(() => this.remove(notification.id), duration);
    }
  }

  // Marquer comme lu
  markAsRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif && !notif.read) {
      notif.read = true;
      this.unreadCount--;
      this.saveToLocalStorage();
      this.unreadCountSubject.next(this.unreadCount);
    }
  }

  // Marquer tout comme lu
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
    this.saveToLocalStorage();
    this.unreadCountSubject.next(0);
  }

  // Supprimer une notification
  remove(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      if (!this.notifications[index].read) {
        this.unreadCount--;
        this.unreadCountSubject.next(this.unreadCount);
      }
      this.notifications.splice(index, 1);
      this.saveToLocalStorage();
    }
  }

  // Obtenir toutes les notifications
  getAll(): PushNotification[] {
    return this.notifications;
  }

  // Obtenir le nombre de non lues
  getUnreadCount(): number {
    return this.unreadCount;
  }

  // Sauvegarde locale
  private saveToLocalStorage(): void {
    localStorage.setItem('push_notifications', JSON.stringify(this.notifications));
    localStorage.setItem('unread_count', this.unreadCount.toString());
  }

  // Charger depuis localStorage
  private loadFromLocalStorage(): void {
    const saved = localStorage.getItem('push_notifications');
    if (saved) {
      this.notifications = JSON.parse(saved);
      this.unreadCount = this.notifications.filter(n => !n.read).length;
      this.unreadCountSubject.next(this.unreadCount);
    }
  }
}
