import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Complaint, ComplaintStatus } from './complaint';
import { ComplaintService } from './complaint.service';

@Component({
  selector: 'app-complaint-detail-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-container">
        <!-- Header -->
        <div class="modal-header" [ngClass]="'priority-' + ((data.priority || 'medium').toLowerCase())">
          <div class="header-left">
            <span class="ticket-icon">🎫</span>
            <div>
              <h2>Ticket #{{ data.idComplaint }}</h2>
              <p class="ticket-date">{{ data.createdAt | date:'dd MMMM yyyy HH:mm' }}</p>
            </div>
          </div>
          <button class="close-btn" (click)="close()">✕</button>
        </div>

        <!-- Main Content -->
        <div class="modal-body">
          <!-- Status & Priority Badges -->
          <div class="badges-section">
            <span class="badge" [ngClass]="'priority-' + ((data.priority || 'medium').toLowerCase())">
              ⚡ {{ getPriorityText(data.priority) }}
            </span>
            <span class="badge" [ngClass]="'status-' + ((data.status || 'pending').toLowerCase())">
              📌 {{ getStatusText(data.status) }}
            </span>
            <span class="badge sentiment" [ngClass]="getSentimentClass(data.detectedSentiment)">
              {{ getSentimentIcon(data.detectedSentiment) }} {{ getSentimentText(data.detectedSentiment) }}
            </span>
          </div>

          <!-- Title -->
          <div class="info-card">
            <div class="info-icon">📝</div>
            <div class="info-content">
              <label>Title</label>
              <p>{{ data.title || 'Untitled' }}</p>
            </div>
          </div>

          <!-- Description -->
          <div class="info-card description-card">
            <div class="info-icon">💬</div>
            <div class="info-content">
              <label>Client Description</label>
              <p class="client-message">{{ data.description }}</p>
            </div>
          </div>

          <!-- Insurer Response Section -->
          <div class="response-section" *ngIf="!isReplying && !isEditingReply; else replyForm">
            <div class="response-header">
              <span class="response-icon">💡</span>
              <span>Insurer's Response</span>
            </div>
            
            <div *ngIf="data.response" class="existing-response">
              <p>{{ data.response }}</p>
              <div class="response-meta">
                <span>👤 {{ data.respondedBy || 'Insurer' }}</span>
                <span>📅 {{ data.responseDate | date:'dd/MM/yyyy HH:mm' }}</span>
                <button class="edit-response-btn" (click)="startEditReply()">✏️ Edit</button>
              </div>
            </div>
            
            <div *ngIf="!data.response" class="no-response">
              <p>No response yet</p>
            </div>
            
            <button class="reply-btn" (click)="startReply()" *ngIf="data.status !== 'RESOLVED'">
              ✏️ Reply to this complaint
            </button>
          </div>

          <!-- Reply Form -->
          <ng-template #replyForm>
            <div class="reply-form">
              <div class="form-header">
                <span>{{ isEditingReply ? '✏️ Edit Response' : '✏️ New Response' }}</span>
              </div>
              <textarea 
                [(ngModel)]="replyText" 
                placeholder="Write your response here..."
                rows="4"
                class="reply-textarea"
              ></textarea>
              <div class="form-actions">
                <button class="cancel-btn" (click)="cancelReply()">Cancel</button>
                <button class="send-btn" (click)="saveReply()" [disabled]="!replyText.trim()">
                  {{ isEditingReply ? '💾 Save' : '📨 Send' }}
                </button>
              </div>
            </div>
          </ng-template>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="close-footer-btn" (click)="close()">Close</button>
          <button class="resolve-btn" *ngIf="data.status !== 'RESOLVED' && !isReplying" (click)="resolveWithoutReply()">
            ✅ Mark as Resolved
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-container {
      background: white;
      border-radius: 20px;
      width: 550px;
      max-width: 90vw;
      max-height: 85vh;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .modal-header {
      padding: 20px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
    }
    .modal-header.priority-high { background: linear-gradient(135deg, #ff5252, #ff1744); color: white; }
    .modal-header.priority-medium { background: linear-gradient(135deg, #ff9800, #f57c00); color: white; }
    .modal-header.priority-low { background: linear-gradient(135deg, #4caf50, #2e7d32); color: white; }
    .header-left {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .ticket-icon {
      font-size: 40px;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
    .ticket-date {
      margin: 5px 0 0;
      font-size: 12px;
      opacity: 0.8;
    }
    .close-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      font-size: 20px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s;
    }
    .close-btn:hover {
      background: rgba(255,255,255,0.3);
      transform: scale(1.1);
    }
    .modal-body {
      padding: 20px 24px;
      max-height: calc(85vh - 140px);
      overflow-y: auto;
    }
    .badges-section {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge.priority-high { background: #ffebee; color: #c62828; }
    .badge.priority-medium { background: #fff3e0; color: #ef6c00; }
    .badge.priority-low { background: #e8f5e9; color: #2e7d32; }
    .badge.status-pending { background: #fff3e0; color: #ef6c00; }
    .badge.status-resolved { background: #e8f5e9; color: #2e7d32; }
    .badge.sentiment { background: #f3e5f5; color: #7b1fa2; }
    .info-card {
      display: flex;
      gap: 15px;
      background: #f8f9fa;
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .info-icon {
      font-size: 24px;
    }
    .info-content {
      flex: 1;
    }
    .info-content label {
      font-size: 11px;
      text-transform: uppercase;
      color: #999;
      letter-spacing: 1px;
      display: block;
      margin-bottom: 5px;
    }
    .info-content p {
      margin: 0;
      font-size: 14px;
      color: #333;
      line-height: 1.5;
    }
    .client-message {
      background: white;
      padding: 12px;
      border-radius: 10px;
      margin-top: 5px;
      border-left: 3px solid #1976d2;
    }
    .description-card {
      background: #fff8e1;
    }
    .response-section {
      margin-top: 20px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
    .response-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #1976d2;
      margin-bottom: 15px;
    }
    .existing-response {
      background: #e8f5e9;
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .existing-response p {
      margin: 0 0 10px;
      font-size: 14px;
      line-height: 1.5;
    }
    .response-meta {
      display: flex;
      gap: 15px;
      font-size: 11px;
      color: #666;
      align-items: center;
      flex-wrap: wrap;
    }
    .edit-response-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      color: #1976d2;
      margin-left: 15px;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .edit-response-btn:hover {
      background: #e3f2fd;
    }
    .no-response {
      background: #f5f5f5;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      color: #999;
      margin-bottom: 15px;
    }
    .reply-btn {
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 25px;
      cursor: pointer;
      font-size: 14px;
      width: 100%;
      transition: all 0.2s;
    }
    .reply-btn:hover {
      background: #1565c0;
      transform: translateY(-2px);
    }
    .reply-form {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .form-header {
      font-weight: 600;
      margin-bottom: 15px;
    }
    .reply-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 12px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
    }
    .reply-textarea:focus {
      outline: none;
      border-color: #1976d2;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 15px;
    }
    .cancel-btn {
      background: #f5f5f5;
      border: none;
      padding: 8px 20px;
      border-radius: 25px;
      cursor: pointer;
    }
    .send-btn {
      background: #4caf50;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 25px;
      cursor: pointer;
    }
    .send-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .modal-footer {
      padding: 15px 24px;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: #fafafa;
    }
    .close-footer-btn {
      background: #f5f5f5;
      border: none;
      padding: 8px 20px;
      border-radius: 25px;
      cursor: pointer;
    }
    .resolve-btn {
      background: #4caf50;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 25px;
      cursor: pointer;
    }
    .resolve-btn:hover {
      background: #43a047;
    }
  `]
})
export class ComplaintDetailDialogComponent {
  isReplying = false;
  isEditingReply = false;
  replyText = '';

  constructor(
    public dialogRef: MatDialogRef<ComplaintDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Complaint,
    private complaintService: ComplaintService
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  startReply(): void {
    this.isReplying = true;
    this.isEditingReply = false;
    this.replyText = '';
  }

  startEditReply(): void {
    this.isEditingReply = true;
    this.isReplying = true;
    this.replyText = this.data.response || '';
  }

  cancelReply(): void {
    this.isReplying = false;
    this.isEditingReply = false;
    this.replyText = '';
  }

  saveReply(): void {
    if (!this.replyText.trim()) return;
    
    this.complaintService.respondToComplaint(this.data.idComplaint, this.replyText, 'Insurer').subscribe({
      next: (updated: Complaint) => {
        this.data.response = updated.response;
        this.data.responseDate = updated.responseDate;
        this.data.respondedBy = updated.respondedBy;
        this.data.status = updated.status;
        this.isReplying = false;
        this.isEditingReply = false;
        this.replyText = '';
      },
      error: (error: any) => {
        console.error('Error', error);
        alert('❌ Error saving response');
      }
    });
  }

  resolveWithoutReply(): void {
    if (confirm('Mark this complaint as resolved without a response?')) {
      this.complaintService.resolveComplaint(this.data.idComplaint).subscribe({
        next: (updated: Complaint) => {
          this.data.status = updated.status;
        },
        error: (error: any) => {
          console.error('Error', error);
          alert('❌ Error');
        }
      });
    }
  }

  getPriorityText(priority: string): string {
    switch(priority) {
      case 'HIGH': return 'High';
      case 'MEDIUM': return 'Medium';
      case 'LOW': return 'Low';
      default: return 'Medium';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'PENDING': return 'Pending';
      case 'RESOLVED': return 'Resolved';
      default: return 'Pending';
    }
  }

  getSentimentIcon(sentiment: string): string {
    const s = sentiment?.toUpperCase() || '';
    if (s === 'POSITIVE') return '😊';
    if (s === 'NEGATIVE') return '😞';
    return '😐';
  }

  getSentimentText(sentiment: string): string {
    const s = sentiment?.toUpperCase() || '';
    if (s === 'POSITIVE') return 'Positive';
    if (s === 'NEGATIVE') return 'Negative';
    return 'Neutral';
  }

  getSentimentClass(sentiment: string): string {
    const s = sentiment?.toUpperCase() || '';
    if (s === 'POSITIVE') return 'sentiment-positive';
    if (s === 'NEGATIVE') return 'sentiment-negative';
    return 'sentiment-neutral';
  }
}