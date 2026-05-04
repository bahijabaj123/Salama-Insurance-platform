import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8082/api/complaints';
  private notifications: Notification[] = [];
  private notificationSubject = new Subject<Notification[]>();
  private lastCheckTime: number = Date.now();
  private pollingInterval: any;

  constructor(private http: HttpClient) {}

  startPolling() {
    this.pollingInterval = setInterval(() => {
      this.checkNewComplaints();
    }, 10000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  private checkNewComplaints() {
    this.http.get<any>(`${this.apiUrl}/check-new?lastChecked=${this.lastCheckTime}`).subscribe({
      next: (data) => {
        if (data && data.hasNew) {
          const notification: Notification = {
            id: Date.now(),
            title: '📋 New Complaint',
            message: `${data.count} new complaint(s) received`,
            type: 'info',
            timestamp: new Date(),
            read: false
          };
          this.notifications.unshift(notification);
          this.notificationSubject.next(this.notifications);
          this.lastCheckTime = Date.now();
        }
      },
      error: (err) => console.error('Error checking notifications', err)
    });
  }

  getNotifications() {
    return this.notificationSubject.asObservable();
  }

  markAsRead(id: number) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
    this.notificationSubject.next(this.notifications);
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notificationSubject.next(this.notifications);
  }

  clearAll() {
    this.notifications = [];
    this.notificationSubject.next(this.notifications);
  }

  requestPermission() {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }
}