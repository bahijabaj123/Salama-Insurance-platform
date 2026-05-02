import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClaimService } from '../../../core/services/claim.service';
import { Claim } from '../../../core/models/claim.model';

interface FraudRule {
  id: number;
  code: string;
  name: string;
  description: string;
  weight: number;
}

interface FraudAlert {
  claimId: number;
  claimReference: string;
  region: string;
  clientName: string;
  fraudScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  triggeredRules: FraudRule[];
  status: 'PENDING' | 'REVIEWED' | 'CONFIRMED' | 'REJECTED';
  date: Date;
}

@Component({
  selector: 'app-fraud-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatTabsModule,
    MatTooltipModule
  ],
  template: `
    <div class="fraud-dashboard">
      <div class="dashboard-header">
        <h1>🛡️ Anti-fraud</h1>
        <button mat-raised-button color="primary" (click)="refreshData()">
          <mat-icon>refresh</mat-icon> Analyze claims
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <mat-card class="stat-card critical">
          <div class="stat-icon"><mat-icon>warning</mat-icon></div>
          <div class="stat-value">{{ criticalCount }}</div>
          <div class="stat-label">Critical</div>
        </mat-card>
        <mat-card class="stat-card high">
          <div class="stat-icon"><mat-icon>error</mat-icon></div>
          <div class="stat-value">{{ highCount }}</div>
          <div class="stat-label">High</div>
        </mat-card>
        <mat-card class="stat-card medium">
          <div class="stat-icon"><mat-icon>info</mat-icon></div>
          <div class="stat-value">{{ mediumCount }}</div>
          <div class="stat-label">Medium</div>
        </mat-card>
        <mat-card class="stat-card total">
          <div class="stat-icon"><mat-icon>assignment</mat-icon></div>
          <div class="stat-value">{{ totalAnalyzed }}</div>
          <div class="stat-label">Analyzed</div>
        </mat-card>
      </div>

      <!-- Detection rules -->
      <mat-card class="rules-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>gavel</mat-icon>
          <mat-card-title>Fraud detection rules</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="rules-grid">
            <div *ngFor="let rule of fraudRules" class="rule-item">
              <div class="rule-code">{{ rule.code }}</div>
              <div class="rule-name">{{ rule.name }}</div>
              <div class="rule-desc">{{ rule.description }}</div>
              <div class="rule-weight">Weight: {{ rule.weight }}</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Fraud alerts -->
      <mat-card class="alerts-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>notifications_active</mat-icon>
          <mat-card-title>Fraud alerts</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="filters">
            <mat-chip-listbox>
              <mat-chip-option [selected]="filterStatus === 'ALL'" (click)="filterStatus = 'ALL'">All</mat-chip-option>
              <mat-chip-option [selected]="filterStatus === 'PENDING'" (click)="filterStatus = 'PENDING'">Pending</mat-chip-option>
              <mat-chip-option [selected]="filterStatus === 'CONFIRMED'" (click)="filterStatus = 'CONFIRMED'">Confirmed</mat-chip-option>
              <mat-chip-option [selected]="filterStatus === 'REJECTED'" (click)="filterStatus = 'REJECTED'">Rejected</mat-chip-option>
            </mat-chip-listbox>
          </div>

          <div class="alerts-table">
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Region</th>
                  <th>Score</th>
                  <th>Triggered rules</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let alert of filteredAlerts">
                  <td class="ref">{{ alert.claimReference }}</td>
                  <td>{{ alert.region }}</td>
                  <td>
                    <div class="score-badge" [class.critical]="alert.riskLevel === 'CRITICAL'"
                         [class.high]="alert.riskLevel === 'HIGH'"
                         [class.medium]="alert.riskLevel === 'MEDIUM'">
                      {{ alert.fraudScore }}%
                    </div>
                  </td>
                  <td>
                    <div class="rules-triggered">
                      <span *ngFor="let rule of alert.triggeredRules" class="rule-tag">
                        {{ rule.code }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" [class.pending]="alert.status === 'PENDING'"
                          [class.confirmed]="alert.status === 'CONFIRMED'"
                          [class.rejected]="alert.status === 'REJECTED'">
                      {{ getStatusLabel(alert.status) }}
                    </span>
                  </td>
                  <td class="actions">
                    <button mat-icon-button color="primary" (click)="viewClaim(alert.claimId)" matTooltip="View claim">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" *ngIf="alert.status === 'PENDING'" (click)="confirmFraud(alert)" matTooltip="Confirm fraud">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                    <button mat-icon-button *ngIf="alert.status === 'PENDING'" (click)="rejectFraud(alert)" matTooltip="Dismiss alert">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </td>
                </tr>
                <tr *ngIf="filteredAlerts.length === 0">
                  <td colspan="6" class="empty-state">No fraud alerts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .fraud-dashboard {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 24px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      border-left: 4px solid;
    }

    .stat-card.critical { border-left-color: #A32D2D; }
    .stat-card.high { border-left-color: #FF8C00; }
    .stat-card.medium { border-left-color: #FFC107; }
    .stat-card.total { border-left-color: #185FA5; }

    .stat-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-right: 16px;
      color: #666;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
    }

    .rules-card, .alerts-card {
      margin-bottom: 24px;
    }

    .rules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .rule-item {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 8px;
      border-left: 3px solid #185FA5;
    }

    .rule-code {
      font-family: monospace;
      font-weight: bold;
      color: #185FA5;
      font-size: 12px;
    }

    .rule-name {
      font-weight: 600;
      margin: 4px 0;
    }

    .rule-desc {
      font-size: 11px;
      color: #666;
    }

    .rule-weight {
      font-size: 10px;
      margin-top: 4px;
      color: #FF8C00;
    }

    .filters {
      margin-bottom: 16px;
    }

    .alerts-table {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    th {
      background: #f8f9fa;
      font-weight: 600;
      font-size: 12px;
    }

    .ref {
      font-family: monospace;
      font-weight: 600;
      color: #185FA5;
    }

    .score-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .score-badge.critical { background: #A32D2D; color: white; }
    .score-badge.high { background: #FF8C00; color: white; }
    .score-badge.medium { background: #FFC107; color: #333; }

    .rules-triggered {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .rule-tag {
      background: #e0e0e0;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-family: monospace;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }

    .status-badge.pending { background: #FFC107; color: #333; }
    .status-badge.confirmed { background: #A32D2D; color: white; }
    .status-badge.rejected { background: #3B6D11; color: white; }

    .actions {
      display: flex;
      gap: 8px;
    }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class FraudDashboardComponent implements OnInit {
  claims: Claim[] = [];
  fraudAlerts: FraudAlert[] = [];
  filterStatus: string = 'ALL';
  
  criticalCount = 0;
  highCount = 0;
  mediumCount = 0;
  totalAnalyzed = 0;

  fraudRules: FraudRule[] = [
    { id: 1, code: 'FR-001', name: 'Same driver', description: 'Same driver involved in multiple claims', weight: 25 },
    { id: 2, code: 'FR-002', name: 'Same location', description: 'Multiple claims at the same place in a short time', weight: 20 },
    { id: 3, code: 'FR-003', name: 'Late reporting', description: 'Claim reported more than 7 days after the accident', weight: 15 },
    { id: 4, code: 'FR-004', name: 'Missing witnesses', description: 'No witnesses declared', weight: 10 },
    { id: 5, code: 'FR-005', name: 'Incomplete documents', description: 'Supporting documents missing', weight: 15 },
    { id: 6, code: 'FR-006', name: 'Contradictions', description: 'Contradictory information in the declaration', weight: 30 },
    { id: 7, code: 'FR-007', name: 'Excessive value', description: 'Damage estimate unusually high', weight: 20 },
    { id: 8, code: 'FR-008', name: 'Repetition', description: 'Same garage or same expert flagged as suspicious', weight: 25 }
  ];

  constructor(
    private claimService: ClaimService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    this.claimService.getAllClaims().subscribe(claims => {
      this.claims = claims;
      this.analyzeFraud();
    });
  }

  analyzeFraud(): void {
    this.fraudAlerts = [];
    
    this.claims.forEach(claim => {
      const triggeredRules: FraudRule[] = [];
      let fraudScore = 0;
      
      // Règle 1: Urgence score très élevé
      if (claim.urgencyScore && claim.urgencyScore > 85) {
        triggeredRules.push(this.fraudRules[0]);
        fraudScore += 25;
      }
      
      // Règle 2: Notes suspectes
      if (claim.notes) {
        const n = claim.notes.toLowerCase();
        if (n.includes('contradiction') || n.includes('incohérence') || n.includes('inconsistency')) {
          triggeredRules.push(this.fraudRules[5]);
          fraudScore += 30;
        }
      }
      
      // Règle 3: Sinistre récent avec notes
      if (claim.notes && claim.notes.length > 200) {
        triggeredRules.push(this.fraudRules[4]);
        fraudScore += 15;
      }
      
      // Règle 4: Pas d'expert assigné depuis longtemps
      if (!claim.expert && claim.openingDate) {
        const daysOpen = (new Date().getTime() - new Date(claim.openingDate).getTime()) / (1000 * 3600 * 24);
        if (daysOpen > 7) {
          triggeredRules.push(this.fraudRules[2]);
          fraudScore += 15;
        }
      }
      
      // Règle 5: Région à risque
      const highRiskRegions = ['Tunis Centre', 'Ben Arous', 'Ariana'];
      if (claim.region && highRiskRegions.includes(claim.region)) {
        triggeredRules.push(this.fraudRules[1]);
        fraudScore += 10;
      }
      
      // Déterminer le niveau de risque
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (fraudScore >= 60) riskLevel = 'CRITICAL';
      else if (fraudScore >= 40) riskLevel = 'HIGH';
      else if (fraudScore >= 20) riskLevel = 'MEDIUM';
      
      // Créer l'alerte si score > 0
      if (fraudScore > 0) {
        this.fraudAlerts.push({
          claimId: claim.id,
          claimReference: claim.reference,
          region: claim.region || 'N/A',
          clientName: 'Client',
          fraudScore: fraudScore,
          riskLevel: riskLevel,
          triggeredRules: triggeredRules,
          status: 'PENDING',
          date: new Date()
        });
      }
    });
    
    // Trier par score décroissant
    this.fraudAlerts.sort((a, b) => b.fraudScore - a.fraudScore);
    
    // Calculer les statistiques
    this.criticalCount = this.fraudAlerts.filter(a => a.riskLevel === 'CRITICAL').length;
    this.highCount = this.fraudAlerts.filter(a => a.riskLevel === 'HIGH').length;
    this.mediumCount = this.fraudAlerts.filter(a => a.riskLevel === 'MEDIUM').length;
    this.totalAnalyzed = this.claims.length;
  }

  get filteredAlerts(): FraudAlert[] {
    if (this.filterStatus === 'ALL') return this.fraudAlerts;
    return this.fraudAlerts.filter(a => a.status === this.filterStatus);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'PENDING': 'Pending',
      'REVIEWED': 'Reviewed',
      'CONFIRMED': 'Confirmed',
      'REJECTED': 'Rejected'
    };
    return labels[status] || status;
  }

  viewClaim(claimId: number): void {
    this.router.navigate(['/assureur/claims', claimId]);
  }

  confirmFraud(alert: FraudAlert): void {
    alert.status = 'CONFIRMED';
    alert.riskLevel = 'CRITICAL';
    this.updateCounts();
  }

  rejectFraud(alert: FraudAlert): void {
    alert.status = 'REJECTED';
    this.updateCounts();
  }

  updateCounts(): void {
    this.criticalCount = this.fraudAlerts.filter(a => a.riskLevel === 'CRITICAL' && a.status !== 'REJECTED').length;
    this.highCount = this.fraudAlerts.filter(a => a.riskLevel === 'HIGH' && a.status !== 'REJECTED').length;
    this.mediumCount = this.fraudAlerts.filter(a => a.riskLevel === 'MEDIUM' && a.status !== 'REJECTED').length;
  }

  refreshData(): void {
    this.loadClaims();
  }
}