import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthStorageService } from '../../../core/auth/auth-storage.service';
import { ClaimService } from '../../../core/services/claim.service';

interface DocumentItem {
  id: number;
  name: string;
  type: 'EXPERT_REPORT' | 'ASSURER_REPORT' | 'CONSTAT';
  date: Date;
  size: string;
  claimReference: string;
  claimId: number;
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
        <h1>📁 Mes documents</h1>
        <p>Retrouvez ici tous vos documents liés à vos sinistres</p>
      </div>

      <mat-tab-group animationDuration="0ms">
        <!-- Onglet Tous les documents -->
        <mat-tab label="Tous les documents">
          <div class="tab-content">
            <table mat-table [dataSource]="allDocuments" class="documents-table">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nom du document</th>
                <td mat-cell *matCellDef="let doc">
                  <mat-icon class="doc-icon">{{ getFileIcon(doc.type) }}</mat-icon>
                  {{ doc.name }}
                </td>
              </ng-container>

              <ng-container matColumnDef="claim">
                <th mat-header-cell *matHeaderCellDef>Sinistre</th>
                <td mat-cell *matCellDef="let doc">{{ doc.claimReference }}</td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let doc">{{ doc.date | date:'dd/MM/yyyy' }}</td>
              </ng-container>

              <ng-container matColumnDef="size">
                <th mat-header-cell *matHeaderCellDef>Taille</th>
                <td mat-cell *matCellDef="let doc">{{ doc.size }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let doc">
                  <button mat-icon-button color="primary" (click)="downloadDocument(doc)" matTooltip="Télécharger">
                    <mat-icon>download</mat-icon>
                  </button>
                  <button mat-icon-button (click)="viewDocument(doc)" matTooltip="Aperçu">
                    <mat-icon>visibility</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div *ngIf="allDocuments.length === 0" class="empty-state">
              <mat-icon>folder_open</mat-icon>
              <p>Aucun document disponible</p>
            </div>
          </div>
        </mat-tab>

        <!-- Onglet Rapports expert -->
        <mat-tab label="📋 Rapports expert">
          <div class="tab-content">
            <div *ngFor="let doc of expertReports" class="document-card" (click)="viewDocument(doc)">
              <div class="doc-preview">
                <mat-icon>picture_as_pdf</mat-icon>
              </div>
              <div class="doc-info">
                <div class="doc-title">{{ doc.name }}</div>
                <div class="doc-meta">Sinistre: {{ doc.claimReference }} • {{ doc.date | date:'dd/MM/yyyy' }}</div>
              </div>
              <button mat-raised-button color="primary" (click)="downloadDocument(doc); $event.stopPropagation()">
                <mat-icon>download</mat-icon> PDF
              </button>
            </div>
            <div *ngIf="expertReports.length === 0" class="empty-state">
              <mat-icon>description</mat-icon>
              <p>Aucun rapport d'expert disponible</p>
            </div>
          </div>
        </mat-tab>

        <!-- Onglet Documents assureur -->
        <mat-tab label="🏢 Documents assureur">
          <div class="tab-content">
            <div *ngFor="let doc of assurerReports" class="document-card" (click)="viewDocument(doc)">
              <div class="doc-preview">
                <mat-icon>description</mat-icon>
              </div>
              <div class="doc-info">
                <div class="doc-title">{{ doc.name }}</div>
                <div class="doc-meta">Sinistre: {{ doc.claimReference }} • {{ doc.date | date:'dd/MM/yyyy' }}</div>
              </div>
              <button mat-raised-button color="primary" (click)="downloadDocument(doc); $event.stopPropagation()">
                <mat-icon>download</mat-icon> PDF
              </button>
            </div>
            <div *ngIf="assurerReports.length === 0" class="empty-state">
              <mat-icon>business</mat-icon>
              <p>Aucun document de l'assureur disponible</p>
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
    .doc-preview mat-icon { font-size: 28px; width: 28px; height: 28px; color: #A32D2D; }
    .doc-info { flex: 1; }
    .doc-title { font-weight: 600; margin-bottom: 4px; }
    .doc-meta { font-size: 12px; color: #666; }
    .empty-state { text-align: center; padding: 60px; color: #666; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.3; }
  `]
})
export class ClientDocumentsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'claim', 'date', 'size', 'actions'];
  allDocuments: DocumentItem[] = [];
  expertReports: DocumentItem[] = [];
  assurerReports: DocumentItem[] = [];

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

    this.claimService.getAllClaims().subscribe(claims => {
      const userClaims = claims.filter(c => c.client?.id === currentUser.id);
      
      this.allDocuments = [];
      
      userClaims.forEach(claim => {
        // Constat amiable (toujours présent)
        this.allDocuments.push({
          id: this.allDocuments.length + 1,
          name: `Constat_amiable_${claim.reference}.pdf`,
          type: 'CONSTAT',
          date: new Date(claim.openingDate),
          size: '1.2 MB',
          claimReference: claim.reference,
          claimId: claim.id
        });
        
        // Rapport d'expertise (si expert assigné)
        if (claim.expert && claim.expert.firstName) {
          this.allDocuments.push({
            id: this.allDocuments.length + 1,
            name: `Rapport_expertise_${claim.reference}.pdf`,
            type: 'EXPERT_REPORT',
            date: new Date(claim.assignedDate || claim.openingDate),
            size: '2.5 MB',
            claimReference: claim.reference,
            claimId: claim.id
          });
        }
        
        // Rapport d'indemnisation (si sinistre clôturé)
        if (claim.status === 'CLOSED') {
          this.allDocuments.push({
            id: this.allDocuments.length + 1,
            name: `Indemnisation_${claim.reference}.pdf`,
            type: 'ASSURER_REPORT',
            date: new Date(claim.closingDate || claim.lastModifiedDate),
            size: '856 KB',
            claimReference: claim.reference,
            claimId: claim.id
          });
        }
      });
      
      this.expertReports = this.allDocuments.filter(d => d.type === 'EXPERT_REPORT');
      this.assurerReports = this.allDocuments.filter(d => d.type === 'ASSURER_REPORT');
    });
  }

  getFileIcon(type: string): string {
    switch (type) {
      case 'EXPERT_REPORT': return 'engineering';
      case 'ASSURER_REPORT': return 'business';
      case 'CONSTAT': return 'description';
      default: return 'insert_drive_file';
    }
  }

  downloadDocument(doc: DocumentItem): void {
    console.log('📥 Téléchargement:', doc.name);
    alert(`📥 Téléchargement de "${doc.name}"\n\nLe téléchargement commencera sous peu.`);
  }

  viewDocument(doc: DocumentItem): void {
    console.log('👁️ Aperçu:', doc.name);
    alert(`👁️ Aperçu de "${doc.name}"\n\nAffichage du document...`);
  }
}
