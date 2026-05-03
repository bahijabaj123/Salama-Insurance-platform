import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import { ClaimService } from '../../../core/services/claim.service';
import { Claim } from '../../../core/models/claim.model';

interface DocumentItem {
  id: number;
  name: string;
  type: 'ASSURER_DOCUMENT' | 'CONSTAT';
  date: Date;
  size: string;
  claimReference: string;
  claimId: number;
  filePath?: string;
}

@Component({
  selector: 'app-client-documents',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatTabsModule
  ],
  template: `
    <div class="documents-container">
      <div class="header">
        <h1>📁 My Documents</h1>
        <p>Find here all your documents related to your claims</p>
      </div>

      <mat-tab-group animationDuration="0ms">
        <!-- Tab: All documents -->
        <mat-tab label="All documents">
          <div class="tab-content">
            <table mat-table [dataSource]="allDocuments" class="documents-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Document name</th>
                <td mat-cell *matCellDef="let doc">
                  <mat-icon class="doc-icon">{{ getFileIcon(doc.type) }}</mat-icon>
                  {{ doc.name }}
                </td>
              </ng-container>

              <ng-container matColumnDef="claim">
                <th mat-header-cell *matHeaderCellDef>Claim</th>
                <td mat-cell *matCellDef="let doc">{{ doc.claimReference }}</td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let doc">{{ doc.date | date:'dd/MM/yyyy' }}</td>
              </ng-container>

              <ng-container matColumnDef="size">
                <th mat-header-cell *matHeaderCellDef>Size</th>
                <td mat-cell *matCellDef="let doc">{{ doc.size }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let doc">
                  <button mat-icon-button color="primary" (click)="downloadDocument(doc)" matTooltip="Download">
                    <mat-icon>download</mat-icon>
                  </button>
                  <button mat-icon-button (click)="viewDocument(doc)" matTooltip="Preview">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div *ngIf="allDocuments.length === 0" class="empty-state">
              <mat-icon>folder_open</mat-icon>
              <p>No documents available</p>
              <p class="subtitle">Documents uploaded by the insurer will appear here</p>
            </div>
          </div>
        </mat-tab>

        <!-- Tab: Insurer documents (only real uploaded docs) -->
        <mat-tab label="🏢 Insurer documents">
          <div class="tab-content">
            <div *ngFor="let doc of assurerDocuments" class="document-card" (click)="viewDocument(doc)">
              <div class="doc-preview">
                <mat-icon>description</mat-icon>
              </div>
              <div class="doc-info">
                <div class="doc-title">{{ doc.name }}</div>
                <div class="doc-meta">Claim: {{ doc.claimReference }} • {{ doc.date | date:'dd/MM/yyyy' }}</div>
                <div class="doc-size" *ngIf="doc.size">{{ doc.size }}</div>
              </div>
              <button mat-raised-button color="primary" (click)="downloadDocument(doc); $event.stopPropagation()">
                <mat-icon>download</mat-icon> Download
              </button>
            </div>
            <div *ngIf="assurerDocuments.length === 0" class="empty-state">
              <mat-icon>business</mat-icon>
              <p>No insurer documents available</p>
              <p class="subtitle">The insurer will upload documents here (invoices, reports, etc.)</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .documents-container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    .header { margin-bottom: 24px; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; }
    .header p { margin: 0; color: #666; }
    .tab-content { padding: 20px 0; }
    .documents-table { width: 100%; }
    .doc-icon { margin-right: 8px; vertical-align: middle; }
    .document-card {
      display: flex; align-items: center; gap: 16px;
      padding: 16px; background: white; border: 1px solid #e0e0e0;
      border-radius: 12px; margin-bottom: 12px; cursor: pointer;
      transition: all 0.2s;
    }
    .document-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); transform: translateY(-2px); }
    .doc-preview { width: 48px; height: 48px; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .doc-preview mat-icon { font-size: 28px; color: #A32D2D; }
    .doc-info { flex: 1; }
    .doc-title { font-weight: 600; margin-bottom: 4px; }
    .doc-meta { font-size: 12px; color: #666; }
    .doc-size { font-size: 11px; color: #999; margin-top: 2px; }
    .empty-state { text-align: center; padding: 60px; color: #666; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.3; }
    .empty-state .subtitle { font-size: 12px; margin-top: 8px; }
  `]
})
export class ClientDocumentsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'claim', 'date', 'size', 'actions'];
  allDocuments: DocumentItem[] = [];
  assurerDocuments: DocumentItem[] = [];

  constructor(
    private authStorage: AuthStorageService,
    private claimService: ClaimService
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    const currentUser = this.authStorage.getUser();
    if (!currentUser) return;

    this.allDocuments = [];
    this.assurerDocuments = [];

    // ⭐ Only real documents, NO simulation
    this.claimService.getAllClaims().subscribe(claims => {
      const userClaims = claims.filter(c => c.client?.id === currentUser.id);
      
      userClaims.forEach(claim => {
        // Load real documents from backend
        this.loadClaimDocuments(claim);
      });
    });
  }

  loadClaimDocuments(claim: Claim): void {
    this.claimService.getClaimDocuments(claim.id).subscribe({
      next: (documents: any[]) => {
        documents.forEach(doc => {
          const docItem: DocumentItem = {
            id: doc.id,
            name: doc.fileName,
            type: doc.type === 'ASSURER_DOCUMENT' ? 'ASSURER_DOCUMENT' : 'CONSTAT',
            date: new Date(doc.uploadedAt),
            size: this.formatFileSize(doc.fileSize),
            claimReference: claim.reference,
            claimId: claim.id,
            filePath: doc.filePath
          };
          
          this.allDocuments.push(docItem);
          
          if (doc.type === 'ASSURER_DOCUMENT') {
            this.assurerDocuments.push(docItem);
          }
        });
        
        // Sort by date descending
        this.allDocuments.sort((a, b) => b.date.getTime() - a.date.getTime());
        this.assurerDocuments.sort((a, b) => b.date.getTime() - a.date.getTime());
      },
      error: (err) => console.error('Error loading documents for claim', claim.id, err)
    });
  }

  getFileIcon(type: string): string {
    switch (type) {
      case 'ASSURER_DOCUMENT': return 'business';
      case 'CONSTAT': return 'description';
      default: return 'insert_drive_file';
    }
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  downloadDocument(doc: DocumentItem): void {
    if (doc.id && doc.id > 0) {
      window.open(`http://localhost:8082/api/documents/download/${doc.id}`, '_blank');
    } else {
      alert(`📥 The document "${doc.name}" is not yet available for download.`);
    }
  }

  viewDocument(doc: DocumentItem): void {
    if (doc.id && doc.id > 0) {
      window.open(`http://localhost:8082/api/documents/view/${doc.id}`, '_blank');
    } else {
      alert(`👁️ Preview of "${doc.name}"\n\nDocument not available.`);
    }
  }
}



