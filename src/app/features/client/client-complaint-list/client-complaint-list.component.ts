import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ComplaintService } from '../../complaint/complaint.service';
import { Complaint } from '../../complaint/complaint';
import { SpeechRecognitionService } from '../../../core/services/speech-recognition.service';

@Component({
  selector: 'app-client-complaint-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="complaint-modern-container">
      <div class="header-section">
        <div class="icon-badge">📋</div>
        <h1>Submit a Complaint</h1>
        <p>Express your dissatisfaction or issue.<br />We will get back to you as soon as possible.</p>
      </div>

      <div class="form-card">
        <!-- Required title -->
        <div class="form-group">
          <label><span class="label-icon">📌</span> Title <span class="required">*</span></label>
          <input type="text" [(ngModel)]="newTitle" placeholder="E.g., Reimbursement problem, expertise delay..." class="form-control" />
          <div *ngIf="submitted && !newTitle" class="field-error">Title is required</div>
        </div>

        <!-- Description with microphone -->
        <div class="form-group">
          <label><span class="label-icon">💬</span> Description <span class="required">*</span></label>
          <div class="voice-input-wrapper">
            <textarea [(ngModel)]="newDescription" rows="5" placeholder="Describe your problem in detail..." class="form-control"></textarea>
            <button type="button" class="voice-btn" (click)="startVoiceInput()" [disabled]="!voiceSupported" title="Voice input">🎤</button>
          </div>
          <div *ngIf="submitted && !newDescription" class="field-error">Description is required</div>
        </div>

        <!-- Submit button -->
        <button class="submit-btn" (click)="submitComplaint()" [disabled]="isSubmitting">
          {{ isSubmitting ? 'Sending...' : '📨 Send my complaint' }}
        </button>

        <!-- Feedback messages -->
        <div *ngIf="successMessage" class="toast-success">{{ successMessage }}</div>
        <div *ngIf="errorMessage" class="toast-error">{{ errorMessage }}</div>
      </div>

      <!-- History -->
      <div class="history-toggle">
        <button class="history-btn" (click)="toggleHistory()">
          {{ showHistory ? '📜 Hide my history' : '📜 View my history' }}
        </button>
      </div>

      <div *ngIf="showHistory" class="history-section">
        <h2>📜 My complaint history</h2>
        <div *ngIf="myComplaints.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>You haven't submitted any complaints yet.</p>
        </div>
        <div class="complaint-list">
          <div *ngFor="let complaint of myComplaints" class="complaint-card">
            <div class="card-header">
              <span class="complaint-id">#{{ complaint.idComplaint }}</span>
              <span class="status-badge" [ngClass]="complaint.status">{{ getStatusLabel(complaint.status) }}</span>
            </div>
            <div class="card-body">
              <h3>{{ complaint.title || 'Customer complaint' }}</h3>
              <p>{{ complaint.description }}</p>
              <div class="meta">
                <span>📅 {{ complaint.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div *ngIf="complaint.response" class="response-block">
                <strong>Insurer response :</strong>
                <p>{{ complaint.response }}</p>
                <small>on {{ complaint.responseDate | date:'dd/MM/yyyy HH:mm' }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .complaint-modern-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 24px;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(145deg, #f9fafb 0%, #f1f5f9 100%);
      min-height: 100vh;
    }
    .header-section { text-align: center; margin-bottom: 40px; }
    .icon-badge { font-size: 48px; margin-bottom: 12px; }
    h1 {
      font-size: 32px;
      font-weight: 700;
      background: linear-gradient(135deg, #1e293b, #2d3a4a);
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      margin: 0 0 8px 0;
    }
    .header-section p { color: #475569; font-size: 15px; }
    .form-card {
      background: white;
      border-radius: 32px;
      padding: 32px;
      box-shadow: 0 20px 35px -12px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    }
    .form-group { margin-bottom: 28px; }
    label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #1e293b;
    }
    .label-icon { font-size: 16px; }
    .required { color: #ef4444; margin-left: 4px; }
    .form-control {
      width: 100%;
      padding: 14px 18px;
      border: 2px solid #e2e8f0;
      border-radius: 24px;
      font-size: 15px;
      font-family: inherit;
      transition: 0.2s;
      background: #fefefe;
    }
    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .field-error { color: #dc2626; font-size: 13px; margin-top: 6px; margin-left: 12px; }
    .voice-input-wrapper { position: relative; }
    .voice-btn {
      position: absolute;
      right: 12px;
      bottom: 12px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 40px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 18px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      transition: 0.2s;
    }
    .voice-btn:hover:not(:disabled) { background: #eef2ff; border-color: #3b82f6; transform: scale(1.02); }
    .voice-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border: none;
      padding: 14px;
      border-radius: 40px;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
      transition: 0.2s;
    }
    .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 25px -8px #2563eb; }
    .submit-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
    .toast-success, .toast-error {
      margin-top: 16px;
      padding: 12px;
      border-radius: 24px;
      text-align: center;
      font-weight: 500;
      animation: fadeIn 0.3s;
    }
    .toast-success { background: #dcfce7; color: #166534; }
    .toast-error { background: #fee2e2; color: #991b1b; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .history-toggle { text-align: center; margin: 32px 0 24px; }
    .history-btn {
      background: transparent;
      border: 1px solid #cbd5e1;
      padding: 10px 24px;
      border-radius: 40px;
      font-weight: 500;
      cursor: pointer;
      transition: 0.2s;
    }
    .history-btn:hover { background: #f1f5f9; border-color: #3b82f6; }
    .history-section h2 { font-size: 22px; margin-bottom: 20px; color: #0f172a; }
    .empty-state { text-align: center; padding: 48px; background: white; border-radius: 32px; }
    .empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
    .complaint-list { display: flex; flex-direction: column; gap: 20px; }
    .complaint-card {
      background: white;
      border-radius: 28px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      transition: 0.2s;
    }
    .complaint-card:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    .complaint-id { font-family: monospace; font-weight: 700; color: #475569; }
    .status-badge {
      padding: 4px 12px;
      border-radius: 40px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status-badge.PENDING { background: #fff7ed; color: #ea580c; }
    .status-badge.RESOLVED { background: #ecfdf5; color: #059669; }
    .status-badge.REJECTED { background: #fef2f2; color: #dc2626; }
    .card-body { padding: 20px; }
    .card-body h3 { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
    .card-body p { color: #334155; line-height: 1.5; margin-bottom: 12px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 16px; }
    .response-block {
      margin-top: 16px;
      padding: 14px;
      background: #eef2ff;
      border-radius: 20px;
      border-left: 4px solid #3b82f6;
    }
  `]
})
export class ClientComplaintListComponent implements OnInit {
  myComplaints: Complaint[] = [];
  claimId!: number;
  newTitle = '';
  newDescription = '';
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  submitted = false;
  showHistory = false;
  voiceSupported = !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;

  constructor(
    private complaintService: ComplaintService,
    private route: ActivatedRoute,
    private speechService: SpeechRecognitionService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('claimId');
    if (!idParam) {
      this.errorMessage = '❌ Claim not specified. Please go back to the previous page.';
      return;
    }
    this.claimId = +idParam;
    if (isNaN(this.claimId)) {
      this.errorMessage = '❌ Invalid claim identifier.';
      return;
    }
    this.loadComplaints();
  }

  loadComplaints(): void {
    if (!this.claimId) return;
    this.complaintService.getComplaintsByClaimId(this.claimId).subscribe({
      next: (data) => (this.myComplaints = data || []),
      error: (err) => console.error('Error loading history', err)
    });
  }

  submitComplaint(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (!this.newTitle || !this.newDescription) {
      return;
    }

    this.isSubmitting = true;

    this.complaintService.createComplaint({
      title: this.newTitle,
      description: this.newDescription,
      claimId: this.claimId
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = '✅ Complaint sent successfully!';
        this.newTitle = '';
        this.newDescription = '';
        this.submitted = false;
        this.loadComplaints();
        setTimeout(() => (this.successMessage = ''), 4000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = '❌ Error sending complaint. ' + (err.error?.message || 'Check your connection.');
        console.error(err);
        setTimeout(() => (this.errorMessage = ''), 5000);
      }
    });
  }

  startVoiceInput(): void {
    this.speechService.startListening().subscribe({
      next: (text: string) => {
        this.newDescription = this.newDescription ? this.newDescription + ' ' + text : text;
      },
      error: (err: any) => console.error('Voice error', err)
    });
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'RESOLVED': return 'Resolved';
      case 'REJECTED': return 'Rejected';
      default: return 'Pending';
    }
  }
}