import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ComplaintService } from '../../complaint/complaint.service';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-client-new-complaint-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2>📝 Nouvelle réclamation</h2>
        <button class="close-btn" (click)="close()">✕</button>
      </div>
      
      <div class="dialog-body">
        <div class="info-message">
          <span class="info-icon">ℹ️</span>
          <p>Décrivez votre problème ou insatisfaction. Notre équipe vous répondra dans les plus brefs délais.</p>
        </div>

        <div class="form-group">
          <label>Titre <span class="required">*</span></label>
          <input 
            type="text" 
            [(ngModel)]="title" 
            placeholder="Ex: Problème de remboursement, Délai trop long..."
            class="form-control"
            [class.error]="titleError"
          >
          <small *ngIf="titleError" class="error-message">Le titre est requis</small>
        </div>

        <div class="form-group">
          <label>Description <span class="required">*</span></label>
          <textarea 
            [(ngModel)]="description" 
            placeholder="Décrivez votre problème en détail..."
            rows="5"
            class="form-control textarea"
            [class.error]="descriptionError"
          ></textarea>
          <div class="char-counter">
            <span [class.warning]="description.length > 500">{{ description.length }}</span> / 1000 caractères
          </div>
          <small *ngIf="descriptionError" class="error-message">La description est requise</small>
        </div>

        <div class="attachment-section" *ngIf="false">
          <label>Pièces jointes (optionnel)</label>
          <div class="upload-area">
            <span class="upload-icon">📎</span>
            <span>Glissez vos fichiers ici ou <span class="link">parcourir</span></span>
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button class="cancel-btn" (click)="close()">Annuler</button>
        <button class="submit-btn" (click)="submit()" [disabled]="!isValid()">
          📨 Envoyer ma réclamation
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 550px;
      max-width: 90vw;
      background: white;
      border-radius: 20px;
      overflow: hidden;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #1976d2, #1565c0);
      color: white;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
    }
    .close-btn {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 18px;
      cursor: pointer;
    }
    .dialog-body {
      padding: 24px;
    }
    .info-message {
      background: #e3f2fd;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
    .info-icon {
      font-size: 20px;
    }
    .info-message p {
      margin: 0;
      font-size: 13px;
      color: #1565c0;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #333;
    }
    .required {
      color: #f44336;
    }
    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 12px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s;
    }
    .form-control:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
    }
    .form-control.error {
      border-color: #f44336;
    }
    .textarea {
      resize: vertical;
    }
    .char-counter {
      text-align: right;
      font-size: 11px;
      color: #999;
      margin-top: 5px;
    }
    .char-counter .warning {
      color: #ff9800;
    }
    .error-message {
      display: block;
      color: #f44336;
      font-size: 11px;
      margin-top: 5px;
    }
    .attachment-section {
      margin-top: 20px;
    }
    .upload-area {
      border: 2px dashed #ddd;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      color: #999;
      cursor: pointer;
    }
    .upload-icon {
      font-size: 24px;
      display: block;
      margin-bottom: 8px;
    }
    .link {
      color: #1976d2;
      cursor: pointer;
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #eee;
      background: #fafafa;
    }
    .cancel-btn {
      background: #f5f5f5;
      border: none;
      padding: 10px 20px;
      border-radius: 30px;
      cursor: pointer;
    }
    .submit-btn {
      background: linear-gradient(135deg, #4caf50, #388e3c);
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 30px;
      cursor: pointer;
    }
    .submit-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  `]
})
export class ClientNewComplaintDialogComponent {
  title = '';
  description = '';
  titleError = false;
  descriptionError = false;

  constructor(
    private dialogRef: MatDialogRef<ClientNewComplaintDialogComponent>,
    private complaintService: ComplaintService,
  @Inject(MAT_DIALOG_DATA) public data: { claimId: number } 
  ) {}

  isValid(): boolean {
    this.titleError = !this.title.trim();
    this.descriptionError = !this.description.trim();
    return !this.titleError && !this.descriptionError;
  }

  submit(): void {
    if (!this.isValid()) return;
    
    this.complaintService.createComplaint({
      title: this.title,
      description: this.description,
        claimId: this.data.claimId
    }).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        console.error('Erreur', error);
        alert('Erreur lors de la création de la réclamation');
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}