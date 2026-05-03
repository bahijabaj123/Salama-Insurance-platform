// src/app/core/services/websocket.service.ts
/*import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private stompClient: Client;

  constructor(private notificationService: NotificationService) {}

  connect(userId: number): void {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8082/ws'),
      connectHeaders: { userId: userId.toString() },
      onConnect: () => {
        this.stompClient.subscribe('/user/queue/notifications', this.onNotificationReceived.bind(this));
        console.log('WebSocket connecté');
      }
    });
    this.stompClient.activate();
  }

  private onNotificationReceived(message: Message): void {
    const data = JSON.parse(message.body);
    this.notificationService.show(
      data.title,
      data.message,
      data.type,
      5000,
      data.claimId
    );
  }

  disconnect(): void {
    this.stompClient?.deactivate();
  }
}
*/