import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-dialog">
      <div class="dialog-header" [ngClass]="type">
        <div class="dialog-icon">{{ icon }}</div>
        <h2>{{ title }}</h2>
      </div>
      <div class="dialog-content">
        <p>{{ message }}</p>
      </div>
      <div class="dialog-actions">
        <button class="btn-cancel" (click)="onCancel()">Cancel</button>
        <button class="btn-confirm" (click)="onConfirm()">Confirm</button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-dialog {
      min-width: 350px;
      max-width: 450px;
      background: white;
      border-radius: 16px;
      overflow: hidden;
    }
    .dialog-header {
      padding: 20px;
      text-align: center;
    }
    .dialog-header.warning {
      background: linear-gradient(135deg, #ff9800, #f57c00);
      color: white;
    }
    .dialog-header.danger {
      background: linear-gradient(135deg, #f44336, #d32f2f);
      color: white;
    }
    .dialog-header.success {
      background: linear-gradient(135deg, #4caf50, #388e3c);
      color: white;
    }
    .dialog-icon {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
    }
    .dialog-content {
      padding: 24px;
      text-align: center;
      color: #333;
    }
    .dialog-content p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #eee;
    }
    .btn-cancel, .btn-confirm {
      padding: 8px 20px;
      border-radius: 25px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-cancel {
      background: #f5f5f5;
      border: none;
      color: #666;
    }
    .btn-cancel:hover {
      background: #e0e0e0;
    }
    .btn-confirm {
      background: #f44336;
      border: none;
      color: white;
    }
    .btn-confirm:hover {
      background: #d32f2f;
      transform: translateY(-2px);
    }
  `]
})
export class ConfirmDialogComponent {
  title: string = 'Confirmation';
  message: string = 'Are you sure you want to proceed with this action?';
  type: 'warning' | 'danger' | 'success' = 'warning';
  icon: string = '⚠️';

  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.title = data?.title || 'Confirmation';
    this.message = data?.message || 'Are you sure you want to proceed with this action?';
    this.type = data?.type || 'warning';
    this.icon = data?.icon || '⚠️';
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}