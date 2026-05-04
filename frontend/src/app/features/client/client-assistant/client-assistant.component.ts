import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-client-assistant',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="assistant-container">
  <mat-card class="chat-card">
    <mat-card-header>
      <mat-icon mat-card-avatar>smart_toy</mat-icon>
      <mat-card-title>Salama AI Assistant</mat-card-title>
      <mat-card-subtitle>Ask your question</mat-card-subtitle>
    </mat-card-header>
    
    <mat-card-content>
      <div class="chat-messages" #chatMessages>
        <div *ngFor="let msg of messages" class="message" [class.user]="msg.isUser">
          <div class="message-avatar">
            <mat-icon *ngIf="!msg.isUser">smart_toy</mat-icon>
            <mat-icon *ngIf="msg.isUser">person</mat-icon>
          </div>
          <div class="message-bubble">
            <div class="message-text" [innerHTML]="msg.text"></div>
            <div class="message-time">{{ msg.timestamp | date:'HH:mm' }}</div>
          </div>
        </div>
        <div *ngIf="isLoading" class="message bot">
          <div class="message-avatar">
            <mat-icon>smart_toy</mat-icon>
          </div>
          <div class="message-bubble typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    </mat-card-content>

    <mat-card-actions>
      <div class="quick-suggestions">
        <button mat-stroked-button (click)="sendQuickQuestion('How to file a claim?')">
          📝 File claim
        </button>
        <button mat-stroked-button (click)="sendQuickQuestion('My claims')">
          📋 My claims
        </button>
        <button mat-stroked-button (click)="sendQuickQuestion('Statistics')">
          📊 Statistics
        </button>
        <button mat-stroked-button (click)="sendQuickQuestion('What documents do I need?')">
          📄 Documents
        </button>
        <button mat-stroked-button (click)="sendQuickQuestion('How to contact my expert?')">
          👨‍🔧 Expert
        </button>
        <button mat-stroked-button (click)="sendQuickQuestion('What are the deadlines?')">
          ⏱️ Deadlines
        </button>
      </div>

      <div class="input-area">
        <input [(ngModel)]="newMessage" 
               (keyup.enter)="sendMessage()"
               placeholder="Type your message..."
               class="message-input">
        <button mat-raised-button color="primary" (click)="sendMessage()" [disabled]="!newMessage.trim() || isLoading">
          <mat-icon>send</mat-icon>
          Send
        </button>
      </div>
    </mat-card-actions>
  </mat-card>
</div>
  `,
  styles: [`
    .assistant-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .chat-card {
      height: 70vh;
      display: flex;
      flex-direction: column;
    }
    .chat-card mat-card-content {
      flex: 1;
      overflow-y: auto;
      max-height: calc(70vh - 180px);
    }
    .chat-messages {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .message {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    .message.user {
      flex-direction: row-reverse;
    }
    .message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e9ecef;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .message.user .message-avatar {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
    .message-avatar mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .message-bubble {
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 18px;
      background: #f0f2f5;
    }
    .message.user .message-bubble {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
    .message-text {
      white-space: pre-wrap;
      line-height: 1.4;
    }
    .message-time {
      font-size: 10px;
      margin-top: 4px;
      opacity: 0.6;
    }
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 10px 14px;
    }
    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #999;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }
    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }
    .quick-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #e0e0e0;
    }
    .quick-suggestions button {
      font-size: 12px;
    }
    .input-area {
      display: flex;
      gap: 12px;
      padding: 16px;
      border-top: 1px solid #e0e0e0;
    }
    .message-input {
      flex: 1;
      padding: 10px 16px;
      border: 1px solid #ddd;
      border-radius: 24px;
      outline: none;
      font-size: 14px;
    }
    .message-input:focus {
      border-color: #667eea;
    }
  `]
})
export class ClientAssistantComponent implements AfterViewInit {
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;
  
  messages: Message[] = [];
  newMessage = '';
  isLoading = false;
  private apiUrl = 'http://localhost:8082/api/chatbot/message';
  private userEmail = 'client@salama.tn';

  constructor(private http: HttpClient) {
    this.addWelcomeMessage();
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  addWelcomeMessage() {
    this.messages.push({
      text: `🤖 **Bonjour !** Je suis votre assistant intelligent Salama.<br><br>
**Je peux vous aider avec :**<br>
• 📝 Déclarer un sinistre<br>
• 📊 Suivre votre dossier (par référence)<br>
• 📄 Documents nécessaires<br>
• 👨‍🔧 Contacter votre expert<br>
• ⏱️ Délais d'indemnisation<br><br>
**💡 Exemples :**<br>
• "Statut du sinistre CLM-20260330-2763"<br>
• "Mes sinistres"<br>
• "Quels documents ?"<br><br>
Comment puis-je vous aider aujourd'hui ?`,
      isUser: false,
      timestamp: new Date()
    });
  }

  sendQuickQuestion(question: string) {
    this.newMessage = question;
    this.sendMessage();
  }

  sendMessage() {
    if (!this.newMessage.trim() || this.isLoading) return;

    const userMessage = this.newMessage.trim();
    this.messages.push({
      text: userMessage,
      isUser: true,
      timestamp: new Date()
    });
    
    this.newMessage = '';
    this.isLoading = true;
    this.scrollToBottom();

    this.http.post<any>(this.apiUrl, 
      { message: userMessage },
      { headers: { 'X-User-Email': this.userEmail } }
    ).subscribe({
      next: (response) => {
        this.messages.push({
          text: response.message,
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Erreur chatbot:', err);
        this.messages.push({
          text: '❌ Désolé, une erreur technique est survenue. Veuillez réessayer.',
          isUser: false,
          timestamp: new Date()
        });
        this.isLoading = false;
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatMessagesContainer) {
        this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }
}