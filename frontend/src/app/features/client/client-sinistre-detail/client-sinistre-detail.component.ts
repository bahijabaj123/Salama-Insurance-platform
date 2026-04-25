import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError, finalize } from 'rxjs/operators';
import { ClaimService } from '../../../core/services/claim.service';
import {
  Claim,
  ClaimStatus,
  FraudAnalysis,
  STATUS_LABELS,
} from '../../../core/models/claim.model';

interface UploadedFile {
  name: string;
  size: string;
  type: string;
  date: string;
  progress: number;
  done: boolean;
  error: boolean;
}

@Component({
  selector: 'app-client-sinistre-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="detail-page" *ngIf="!loadingClaim && !error && claim">

      <!-- ── BACK + HEADER ──────────────────────────────────────────────────── -->
      <div class="detail-header">
        <button class="back-btn" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          <span>Mes sinistres</span>
        </button>

        <div class="header-main">
          <div class="header-left">
            <h1 class="claim-ref">{{ claim.reference }}</h1>
            <div class="header-meta">
              <span class="status-pill" [style.background]="statusColor + '20'" [style.color]="statusColor">
                <span class="status-dot" [style.background]="statusColor"></span>
                {{ STATUS_LABELS[claim.status] }}
              </span>
              <span class="meta-item">
                <mat-icon>location_on</mat-icon>{{ claim.region || '—' }}
              </span>
              <span class="meta-item">
                <mat-icon>calendar_today</mat-icon>{{ claim.openingDate | date:'dd/MM/yyyy' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ── PROGRESS BAR GLOBALE ───────────────────────────────────────── -->
      <div class="progress-section">
        <div class="progress-label">
          <span>Avancement du dossier</span>
          <span class="progress-pct">{{ stepProgress() }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" [style.width.%]="stepProgress()"></div>
        </div>
      </div>

      <!-- ── TABS ───────────────────────────────────────────────────────── -->
      <mat-tab-group animationDuration="200ms" class="detail-tabs">

        <!-- ── ONGLET 1 : Suivi ─────────────────────────────────────────────── -->
        <mat-tab label="Suivi du dossier">
          <div class="tab-content">

            <!-- Timeline verticale -->
            <div class="timeline-card">
              <h3 class="section-title">Étapes de traitement</h3>

              <div class="timeline">
                <div *ngFor="let step of TIMELINE_STEPS; let i = index; let last = last"
                     class="tl-item" [class.tl-last]="last">

                  <div class="tl-left">
                    <div class="tl-circle" [ngClass]="'tc-' + stepState(step.key)">
                      <mat-icon>
                        {{ stepState(step.key) === 'done' ? 'check'
                         : stepState(step.key) === 'active' ? 'arrow_forward'
                         : 'schedule' }}
                      </mat-icon>
                    </div>
                    <div class="tl-connector" *ngIf="!last"
                         [class.tl-conn-done]="stepState(step.key) === 'done'">
                    </div>
                  </div>

                  <div class="tl-body" [class.tl-body-active]="stepState(step.key) === 'active'">
                    <div class="tl-step-title">{{ step.label }}</div>
                    <div class="tl-step-desc" *ngIf="stepState(step.key) !== 'pending'">
                      {{ step.desc }}
                    </div>
                    <div class="tl-step-date" *ngIf="stepDate(step.key)">
                      {{ stepDate(step.key) }}
                    </div>
                    <div class="tl-pending" *ngIf="stepState(step.key) === 'pending'">
                      En attente
                    </div>

                    <!-- Expert card dans timeline -->
                    <div class="expert-inline"
                         *ngIf="step.key === 'assigned' && claim.expert
                                && stepState(step.key) !== 'pending'">
                      <div class="exp-av">{{ expertInitials() }}</div>
                      <div class="exp-info">
                        <div class="exp-name">{{ expertName() }}</div>
                        <div class="exp-spec">
                          {{ claim.expert.specialty || 'Expert' }} ·
                          {{ claim.expert.interventionZone || claim.region }}
                        </div>
                        <div class="exp-perf" *ngIf="claim.expert.performanceScore">
                          Score : {{ claim.expert.performanceScore }}% · {{ claim.expert.activeClaims }} dossiers en cours
 
                        </div>
                      </div>
                    </div>

                    <!-- Urgence badge si active -->
                    <div class="urgency-badge"
                         *ngIf="stepState(step.key) === 'active' && claim.urgencyScore">
                      <span [class]="claim.urgencyScore > 70 ? 'urg-high' : claim.urgencyScore > 40 ? 'urg-mid' : 'urg-low'">
                        Urgence {{ claim.urgencyScore }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Info accident -->
            <div class="info-card" *ngIf="claim.accident">
              <h3 class="section-title">Détails de l'accident</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Lieu</span>
                  <span class="info-val">{{ claim.accident.location }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date</span>
                  <span class="info-val">{{ claim.accident.accidentDate | date:'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-item full">
                  <span class="info-label">Description</span>
                  <span class="info-val">{{ claim.accident.observations || '—' }}</span>
                </div>
              </div>
            </div>

          </div>
        </mat-tab>

        <!-- ── ONGLET 2 : Documents ──────────────────────────────────────────── -->
        <mat-tab label="Documents">
          <div class="tab-content">

            <!-- Zone drag & drop -->
            <div class="dropzone"
                 [class.drag-over]="isDragOver"
                 (dragover)="onDragOver($event)"
                 (dragleave)="onDragLeave($event)"
                 (drop)="onDrop($event)"
                 (click)="fileInput.click()">
              <input #fileInput type="file" multiple
                     accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                     (change)="onFileInput($event)"
                     style="display:none">
              <div class="dz-icon">
                <mat-icon>cloud_upload</mat-icon>
              </div>
              <div class="dz-title">Glissez vos fichiers ici</div>
              <div class="dz-sub">ou cliquez pour parcourir — PDF, JPG, PNG, DOC · Max 10MB</div>
              <div class="dz-types">
                <span>PDF</span><span>JPG</span><span>PNG</span><span>DOC</span>
              </div>
            </div>

            <!-- Liste des fichiers uploadés -->
            <div class="files-list" *ngIf="uploadedFiles.length > 0">
              <h4 class="files-title">Fichiers uploadés</h4>
              <div class="file-item" *ngFor="let f of uploadedFiles; let i = index">
                <div class="file-icon" [class.file-icon-pdf]="f.type === 'PDF'"
                                       [class.file-icon-img]="f.type === 'JPG' || f.type === 'PNG' || f.type === 'JPEG'">
                  <mat-icon>{{ fileIcon(f.type) }}</mat-icon>
                </div>
                <div class="file-info">
                  <div class="file-name">{{ f.name }}</div>
                  <div class="file-meta">{{ f.size }} · {{ f.date }}</div>
                  <div class="file-progress" *ngIf="!f.done">
                    <div class="fp-track">
                      <div class="fp-fill" [style.width.%]="f.progress"></div>
                    </div>
                    <span class="fp-pct">{{ f.progress }}%</span>
                  </div>
                </div>
                <div class="file-status">
                  <mat-icon class="done-icon" *ngIf="f.done">check_circle</mat-icon>
                  <mat-icon class="progress-icon" *ngIf="!f.done">hourglass_empty</mat-icon>
                </div>
                <button class="file-remove" (click)="removeFile(i)" matTooltip="Supprimer">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>

            <!-- Documents existants -->
            <div class="existing-docs" *ngIf="claim.accident?.photos?.length">
              <h4 class="files-title">Photos jointes à l'accident</h4>
              <div class="photo-grid">
                <div class="photo-thumb" *ngFor="let p of claim.accident!.photos">
                  <mat-icon>photo</mat-icon>
                  <span>Photo</span>
                </div>
              </div>
            </div>

          </div>
        </mat-tab>

        <!-- ── ONGLET 3 : Analyse fraude ─────────────────────────────────────── -->
        <mat-tab label="Analyse IA">
          <div class="tab-content">

            <div class="fraud-empty" *ngIf="!fraud && !loadingFraud">
              <mat-icon>shield</mat-icon>
              <p>Votre dossier n'a pas encore été analysé par notre IA</p>
            </div>

            <div class="fraud-panel" *ngIf="fraud">
              <!-- Score principal -->
              <div class="fraud-score-card" [ngClass]="fraudClass">
                <div class="fraud-num">{{ fraud.fraudScore }}%</div>
                <div>
                  <div class="fraud-level">Risque {{ fraudLabel }}</div>
                  <div class="fraud-desc">
                    <ng-container *ngIf="fraud.riskLevel === 'LOW'">
                      Votre dossier ne présente aucun indicateur suspect. Traitement automatique.
                    </ng-container>
                    <ng-container *ngIf="fraud.riskLevel === 'MEDIUM'">
                      Une vérification complémentaire est en cours par notre équipe.
                    </ng-container>
                    <ng-container *ngIf="fraud.riskLevel === 'HIGH'">
                      Votre dossier nécessite une investigation approfondie.
                    </ng-container>
                  </div>
                  <div class="fraud-date" *ngIf="fraud.analysisDate">
                    Analysé le {{ fraud.analysisDate | date:'dd/MM/yyyy' }}
                  </div>
                </div>
              </div>

              <!-- Jauge -->
              <div class="fraud-gauge">
                <div class="fg-track">
                  <div class="fg-low" style="width:40%">Faible</div>
                  <div class="fg-mid" style="width:30%">Moyen</div>
                  <div class="fg-high" style="width:30%">Élevé</div>
                </div>
                <div class="fg-pointer" [style.left.%]="fraud.fraudScore">
                  <div class="fg-needle"></div>
                </div>
              </div>

              <!-- Message rassurant si faible -->
              <div class="fraud-ok" *ngIf="fraud.riskLevel === 'LOW'">
                <mat-icon>verified</mat-icon>
                Votre dossier est conforme. L'indemnisation suivra le processus standard.
              </div>
            </div>

          </div>
        </mat-tab>

      </mat-tab-group>
    </div>

    <!-- ── LOADING ────────────────────────────────────────────────────────────── -->
    <div class="page-loading" *ngIf="loadingClaim">
      <mat-spinner diameter="48"></mat-spinner>
      <p>Chargement de votre dossier…</p>
    </div>

    <!-- ── ERREUR ─────────────────────────────────────────────────────────────── -->
    <div class="page-error" *ngIf="error && !loadingClaim">
      <mat-icon>error_outline</mat-icon>
      <p>{{ error }}</p>
      <button (click)="goBack()">Retour</button>
    </div>
  `,
  styles: [`
    $primary: #185FA5;
    $dark: #0C1B35;
    $surface: #F4F6FA;
    $border: #E2E6EA;
    $text: #1A2332;
    $muted: #6B7A8E;
    $radius: 8px;
    $radius-lg: 12px;

    .detail-page { padding: 24px 32px; max-width: 900px; margin: 0 auto; }

    .back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: none; border: none; font-size: 13px;
      color: $muted; cursor: pointer; padding: 0; margin-bottom: 16px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; }
      &:hover { color: $primary; }
    }
    .detail-header { margin-bottom: 8px; }
    .header-main { margin-bottom: 16px; }
    .claim-ref {
      font-family: 'Courier New', monospace; font-size: 22px;
      font-weight: 700; color: $text; margin: 0 0 8px;
    }
    .header-meta { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .status-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    .meta-item {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: $muted;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }

    .progress-section { margin-bottom: 24px; }
    .progress-label {
      display: flex; justify-content: space-between;
      font-size: 12px; color: $muted; margin-bottom: 6px;
    }
    .progress-pct { font-weight: 600; color: $primary; }
    .progress-track {
      height: 6px; background: #e8e8e8; border-radius: 3px; overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: $primary; border-radius: 3px;
      transition: width .8s cubic-bezier(.4,0,.2,1);
    }

    .detail-tabs {
      ::ng-deep .mat-mdc-tab-header {
        background: white; border-radius: $radius-lg $radius-lg 0 0;
        border: 1px solid $border; border-bottom: none;
      }
    }
    .tab-content { padding: 20px 0; }

    .timeline-card, .info-card {
      background: white; border: 1px solid $border;
      border-radius: $radius-lg; padding: 20px; margin-bottom: 16px;
    }
    .section-title {
      font-size: 14px; font-weight: 600; color: $text; margin: 0 0 18px;
      padding-bottom: 10px; border-bottom: 1px solid $border;
    }

    .tl-item { display: flex; gap: 14px; }
    .tl-left {
      display: flex; flex-direction: column;
      align-items: center; width: 28px; flex-shrink: 0;
    }
    .tl-circle {
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; z-index: 1;
      mat-icon { font-size: 14px; width: 14px; height: 14px; }
    }
    .tc-done { background: #3B6D11; color: white; }
    .tc-active {
      background: $primary; color: white;
      animation: glow-pulse 2s infinite;
    }
    .tc-pending { background: white; border: 2px solid $border; color: $muted; }

    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba($primary,.3); }
      50% { box-shadow: 0 0 0 8px rgba($primary,0); }
    }

    .tl-connector {
      width: 2px; flex: 1; background: $border;
      margin: 3px auto 0; min-height: 16px;
    }
    .tl-conn-done { background: #3B6D11; }

    .tl-body {
      padding-bottom: 22px; flex: 1;
      &.tl-body-active .tl-step-title { color: $primary; font-weight: 600; }
    }
    .tl-last .tl-body { padding-bottom: 0; }
    .tl-step-title { font-size: 14px; font-weight: 500; color: $text; }
    .tl-step-desc { font-size: 12px; color: $muted; margin-top: 2px; }
    .tl-step-date { font-size: 11px; color: $muted; margin-top: 3px; font-style: italic; }
    .tl-pending { font-size: 11px; color: lighten($muted, 20%); margin-top: 2px; font-style: italic; }

    .expert-inline {
      display: flex; align-items: center; gap: 12px;
      background: $surface; border-radius: $radius;
      border: 1px solid $border; padding: 10px 14px; margin-top: 10px;
    }
    .exp-av {
      width: 36px; height: 36px; border-radius: 50%;
      background: #E6F1FB; color: $primary;
      font-size: 13px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .exp-name { font-size: 13px; font-weight: 600; color: $text; }
    .exp-spec { font-size: 11px; color: $muted; margin-top: 1px; }
    .exp-perf { font-size: 10px; color: #3B6D11; margin-top: 3px; }

    .urgency-badge { margin-top: 8px; }
    .urg-high { background: #FCEBEB; color: #791F1F; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .urg-mid { background: #FAEEDA; color: #633806; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .urg-low { background: #EAF3DE; color: #27500A; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }

    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
      .full { grid-column: span 2; }
    }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .info-label { font-size: 11px; color: $muted; text-transform: uppercase; letter-spacing: .4px; }
    .info-val { font-size: 14px; color: $text; }

    .dropzone {
      border: 2px dashed $border; border-radius: $radius-lg;
      padding: 36px 24px; text-align: center; cursor: pointer;
      transition: all .2s; margin-bottom: 20px; background: white;
      &:hover, &.drag-over {
        border-color: $primary;
        background: rgba($primary,.03);
      }
    }
    .dz-icon mat-icon { font-size: 40px; width: 40px; height: 40px; color: $primary; opacity: .6; }
    .dz-title { font-size: 15px; font-weight: 500; color: $text; margin: 10px 0 4px; }
    .dz-sub { font-size: 12px; color: $muted; margin-bottom: 14px; }
    .dz-types {
      display: flex; gap: 6px; justify-content: center;
      span {
        background: $surface; border: 1px solid $border; border-radius: 4px;
        padding: 2px 8px; font-size: 10px; font-weight: 600; color: $muted;
      }
    }

    .files-title { font-size: 13px; font-weight: 600; color: $text; margin: 0 0 12px; }
    .file-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 14px; background: white; border: 1px solid $border;
      border-radius: $radius; margin-bottom: 8px;
    }
    .file-icon {
      width: 36px; height: 36px; border-radius: $radius;
      background: $surface; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: $muted; }
      &.file-icon-pdf mat-icon { color: #A32D2D; }
      &.file-icon-img mat-icon { color: #0F6E56; }
    }
    .file-info { flex: 1; min-width: 0; }
    .file-name { font-size: 13px; font-weight: 500; color: $text; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-meta { font-size: 11px; color: $muted; margin-top: 2px; }
    .file-progress { display: flex; align-items: center; gap: 8px; margin-top: 5px; }
    .fp-track { flex: 1; height: 3px; background: #e8e8e8; border-radius: 2px; overflow: hidden; }
    .fp-fill { height: 100%; background: $primary; border-radius: 2px; transition: width .3s; }
    .fp-pct { font-size: 10px; color: $muted; min-width: 28px; text-align: right; }
    .done-icon { color: #3B6D11; font-size: 20px; width: 20px; height: 20px; }
    .progress-icon { color: $muted; font-size: 18px; width: 18px; height: 18px; animation: spin 2s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .file-remove {
      background: none; border: none; cursor: pointer;
      color: $muted; padding: 4px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
      &:hover { color: #A32D2D; }
    }

    .photo-grid { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
    .photo-thumb {
      width: 80px; height: 80px; border-radius: $radius;
      border: 1px solid $border; background: $surface;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; font-size: 10px; color: $muted; cursor: pointer;
      mat-icon { font-size: 24px; width: 24px; height: 24px; color: $primary; opacity: .6; }
      &:hover { border-color: $primary; }
    }

    .fraud-empty {
      text-align: center; padding: 60px; color: $muted;
      mat-icon { font-size: 44px; width: 44px; height: 44px; opacity: .3; display: block; margin: 0 auto 12px; }
      p { margin: 0; font-size: 14px; }
    }
    .fraud-panel { max-width: 600px; }

    .fraud-score-card {
      display: flex; align-items: center; gap: 20px;
      padding: 20px; border-radius: $radius-lg; margin-bottom: 16px;
    }
    .fraud-num { font-size: 52px; font-weight: 800; line-height: 1; }
    .fraud-level { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .fraud-desc { font-size: 13px; opacity: .8; line-height: 1.5; max-width: 320px; }
    .fraud-date { font-size: 11px; opacity: .6; margin-top: 6px; }

    .fraud-low { background: #EAF3DE; color: #27500A; }
    .fraud-medium { background: #FAEEDA; color: #633806; }
    .fraud-high { background: #FCEBEB; color: #791F1F; }

    .fraud-gauge { position: relative; margin-bottom: 20px; }
    .fg-track {
      display: flex; height: 10px; border-radius: 5px; overflow: hidden;
    }
    .fg-low { background: #EAF3DE; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #27500A; font-weight: 600; }
    .fg-mid { background: #FAEEDA; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #633806; font-weight: 600; }
    .fg-high { background: #FCEBEB; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #791F1F; font-weight: 600; }
    .fg-pointer { position: absolute; top: -3px; transform: translateX(-50%); }
    .fg-needle { width: 3px; height: 16px; background: $text; border-radius: 2px; }

    .fraud-ok {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 16px; background: #EAF3DE; border-radius: $radius;
      font-size: 13px; color: #27500A; font-weight: 500;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #3B6D11; }
    }

    .page-loading, .page-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 60vh; gap: 16px;
      color: $muted; text-align: center;
      p { margin: 0; font-size: 14px; }
      mat-icon { font-size: 44px; width: 44px; height: 44px; opacity: .4; }
      button {
        border: 1px solid $border; background: white; border-radius: $radius;
        padding: 8px 18px; cursor: pointer; font-size: 13px; color: $text;
        &:hover { background: $surface; }
      }
    }
  `]
})
export class ClientSinistreDetailComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  // ── Data ──────────────────────────────────────────────────────────────────
  claim?: Claim;
  fraud?: FraudAnalysis;

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingClaim = true;
  loadingFraud = false;
  error = '';

  // ── Upload ────────────────────────────────────────────────────────────────
  uploadedFiles: UploadedFile[] = [];
  isDragOver = false;
  MAX_SIZE_MB = 10;

  // ── Constantes ────────────────────────────────────────────────────────────
  readonly STATUS_LABELS = STATUS_LABELS;
  readonly ClaimStatus = ClaimStatus;

  readonly TIMELINE_STEPS = [
    { key: 'declared', label: 'Constat déclaré', desc: 'Votre constat a été enregistré' },
    { key: 'opened', label: 'Sinistre ouvert', desc: 'Votre dossier a été créé' },
    { key: 'assigned', label: 'Expert assigné', desc: 'Un expert va analyser votre cas' },
    { key: 'expertise', label: "Expertise en cours", desc: "L'expert analyse votre dossier" },
    { key: 'closed', label: 'Indemnisation', desc: 'Dossier clôturé et indemnisé' },
  ];

  readonly STATUS_COLOR: Record<ClaimStatus, string> = {
    [ClaimStatus.OPENED]: '#185FA5',
    [ClaimStatus.ASSIGNED_TO_EXPERT]: '#FF8C00',
    [ClaimStatus.UNDER_EXPERTISE]: '#0F6E56',
    [ClaimStatus.CLOSED]: '#3B6D11',
    [ClaimStatus.REJECTED]: '#A32D2D',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private claimService: ClaimService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef 
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id']);
    if (id > 0) {
      this.loadClaim(id);
    } else {
      this.loadingClaim = false;
      this.error = 'Identifiant invalide';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Chargement ────────────────────────────────────────────────────────────

  loadClaim(id: number): void {
    console.log('1. Début chargement');
    this.loadingClaim = true;
    this.cdr.detectChanges();  // ← FORCER LA DETECTION
    
    this.claimService.getClaimById(id).subscribe({
      next: (c) => {
        console.log('2. Sinistre reçu:', c);
        this.claim = c;
        this.loadingClaim = false;
        this.error = '';
        this.cdr.detectChanges();  // ← FORCER LA DETECTION
        console.log('3. loadingClaim = false');
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error = err.message;
        this.loadingClaim = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ── Timeline helpers ──────────────────────────────────────────────────────

  stepState(stepKey: string): 'done' | 'active' | 'pending' {
    if (!this.claim) return 'pending';
    const order: string[] = ['declared', 'opened', 'assigned', 'expertise', 'closed'];
    const map: Record<ClaimStatus, string> = {
      [ClaimStatus.OPENED]: 'opened',
      [ClaimStatus.ASSIGNED_TO_EXPERT]: 'assigned',
      [ClaimStatus.UNDER_EXPERTISE]: 'expertise',
      [ClaimStatus.CLOSED]: 'closed',
      [ClaimStatus.REJECTED]: 'closed',
    };
    const cur = order.indexOf(map[this.claim.status] ?? 'opened');
    const idx = order.indexOf(stepKey);
    if (idx < cur) return 'done';
    if (idx === cur) return 'active';
    return 'pending';
  }

  stepProgress(): number {
    if (!this.claim) return 0;
    const map: Record<ClaimStatus, number> = {
      [ClaimStatus.OPENED]: 20,
      [ClaimStatus.ASSIGNED_TO_EXPERT]: 45,
      [ClaimStatus.UNDER_EXPERTISE]: 65,
      [ClaimStatus.CLOSED]: 100,
      [ClaimStatus.REJECTED]: 100,
    };
    return map[this.claim.status] ?? 0;
  }

  stepDate(stepKey: string): string {
    if (!this.claim) return '';
    if (stepKey === 'declared' || stepKey === 'opened') {
      return new Date(this.claim.openingDate)
        .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (stepKey === 'assigned' && this.claim.assignedDate) {
      return new Date(this.claim.assignedDate)
        .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }
    return '';
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.processFiles(Array.from(input.files));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = Array.from(event.dataTransfer?.files ?? []);
    this.processFiles(files);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragOver = true; }
  onDragLeave(event: DragEvent): void { this.isDragOver = false; }

  private processFiles(files: File[]): void {
    files.forEach(file => {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > this.MAX_SIZE_MB) {
        this.notify(`${file.name} dépasse ${this.MAX_SIZE_MB}MB`, 'error');
        return;
      }

      const entry: UploadedFile = {
        name: file.name,
        size: sizeMB < 1 ? `${Math.round(file.size / 1024)} KB` : `${sizeMB.toFixed(1)} MB`,
        type: file.name.split('.').pop()?.toUpperCase() ?? 'FILE',
        date: new Date().toLocaleDateString('fr-FR'),
        progress: 0,
        done: false,
        error: false,
      };
      this.uploadedFiles.unshift(entry);
      this.simulateUpload(entry, file);
    });
  }

  private simulateUpload(entry: UploadedFile, file: File): void {
    // Simulation — à remplacer par this.claimService.uploadDocument(claimId, formData)
    const interval = setInterval(() => {
      entry.progress += Math.floor(Math.random() * 20) + 10;
      if (entry.progress >= 100) {
        entry.progress = 100;
        entry.done = true;
        clearInterval(interval);
        this.notify(`${file.name} uploadé avec succès`, 'success');
      }
    }, 300);
  }

  removeFile(i: number): void {
    this.uploadedFiles.splice(i, 1);
  }

  fileIcon(type: string): string {
    const m: Record<string, string> = {
      PDF: 'picture_as_pdf', JPG: 'image', JPEG: 'image',
      PNG: 'image', DOC: 'description', DOCX: 'description',
    };
    return m[type] ?? 'attach_file';
  }

  // ── Fraude ────────────────────────────────────────────────────────────────

  get fraudLabel(): string {
    if (!this.fraud) return '';
    const map: Record<string, string> = { LOW: 'Faible', MEDIUM: 'Moyen', HIGH: 'Élevé' };
    return map[this.fraud.riskLevel] ?? '';
  }

  get fraudClass(): string {
    if (!this.fraud) return '';
    return `fraud-${this.fraud.riskLevel.toLowerCase()}`;
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  goBack(): void { this.router.navigate(['/client/sinistres']); }

  get statusColor(): string {
    return this.claim ? (this.STATUS_COLOR[this.claim.status] ?? '#888') : '#888';
  }

  expertName(): string {
    if (!this.claim?.expert) return '';
    return `${this.claim.expert.firstName} ${this.claim.expert.lastName}`;
  }

  expertInitials(): string {
    if (!this.claim?.expert) return '?';
    return `${this.claim.expert.firstName[0]}${this.claim.expert.lastName[0]}`.toUpperCase();
  }

  private notify(msg: string, type: 'success' | 'error'): void {
    this.snackBar.open(msg, '×', {
      duration: 4000,
      panelClass: [`snack-${type}`],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}