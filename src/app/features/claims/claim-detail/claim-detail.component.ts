import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClaimService } from '../../../core/services/claim.service';
import { EmailService } from '../../../core/services/email.service';
import { Claim, ClaimStatus, STATUS_LABELS, expertFullName } from '../../../core/models/claim.model';
import {  ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatChipsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './claim-detail.component.html',
  styleUrls: ['./claim-detail.component.scss']
})
export class ClaimDetailComponent implements OnInit {
  claim: Claim | null = null;
  loading = true;
  saving = false;
  showEmailModal = false;
  emailMessage = '';
  STATUS_LABELS = STATUS_LABELS;
  statusOptions = Object.values(ClaimStatus);
  
  editForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private claimService: ClaimService,
    private emailService: EmailService,
    private cdr: ChangeDetectorRef 

  ) {
    this.editForm = this.fb.group({
      status: ['', Validators.required],
      notes: [''],
      urgencyScore: [null, [Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.params['id'];
    console.log('=== CLAIM DETAIL INIT ===');
    console.log('ID param:', idParam);
    
    if (idParam) {
      const id = Number(idParam);
      console.log('ID converti en nombre:', id);
      
      if (!isNaN(id) && id > 0) {
        this.loadClaim(id);
      } else {
        console.error('ID invalide');
        this.loading = false;
        alert('ID de sinistre invalide');
      }
    } else {
      console.error('Aucun ID dans l\'URL');
      this.loading = false;
      alert('Aucun sinistre sélectionné');
    }
  }

  loadClaim(id: number): void {
    console.log('🔄 Chargement du sinistre ID:', id);
    this.loading = true;
    this.cdr.detectChanges(); 
    
    this.claimService.getClaimById(id).subscribe({
      next: (claim) => {
        console.log('✅ Sinistre reçu:', claim);
        console.log('Référence:', claim.reference);
        console.log('Statut:', claim.status);
        
        this.claim = claim;
        this.editForm.patchValue({
          status: claim.status,
          notes: claim.notes || '',
          urgencyScore: claim.urgencyScore || null
        });
        this.loading = false;
         this.cdr.detectChanges();
        console.log('✅ Chargement terminé');
      },
      error: (err) => {
        console.error('❌ Erreur chargement:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        this.loading = false;
        alert(`Erreur: ${err.status === 0 ? 'Backend inaccessible' : err.message}`);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/claims']);
  }

  saveChanges(): void {
    if (!this.claim || this.editForm.invalid) return;
    
    this.saving = true;
    this.claimService.updateClaim(this.claim.id, this.editForm.value).subscribe({
      next: (updated) => {
        this.claim = updated;
        this.saving = false;
        alert('✅ Sinistre mis à jour avec succès');
      },
      error: (err) => {
        console.error('Erreur mise à jour:', err);
        this.saving = false;
        alert('❌ Erreur lors de la mise à jour');
      }
    });
  }

  openEmailModal(): void {
    this.emailMessage = '';
    this.showEmailModal = true;
  }

  /*sendNotification(): void {
  if (!this.claim || !this.emailMessage) return;
  
  // Simulation d'envoi d'email (pas d'appel backend)
  const clientEmail = (this.claim as any).client?.email || 'client@salama.tn';
  
  console.log('📧 ===== SIMULATION ENVOI EMAIL =====');
  console.log('  👤 Client:', clientEmail);
  console.log('  📋 Sinistre:', this.claim.reference);
  console.log('  📝 Message:', this.emailMessage);
  console.log('====================================');
  
  // Afficher une alerte avec le message
  alert(`✅ SIMULATION: Email envoyé à ${clientEmail}\n\nSinistre: ${this.claim.reference}\n\nMessage: ${this.emailMessage}`);
  
  // Fermer la modale et vider le message
  this.showEmailModal = false;
  this.emailMessage = '';


}
*/

sendNotification(): void {
  if (!this.claim || !this.emailMessage) return;
  
  // Afficher dans la console (F12)
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    📧 SIMULATION EMAIL                      ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Sinistre:    ${this.claim.reference}`);
  console.log(`║  Statut:      ${this.claim.status}`);
  console.log(`║  Région:      ${this.claim.region}`);
  console.log(`║  Urgence:     ${this.claim.urgencyScore}%`);
  console.log(`║  ────────────────────────────────────────────────────────── ║`);
  console.log(`║  Message:     ${this.emailMessage}`);
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Afficher une alerte simple
  alert(`✅ Simulation: Notification préparée pour le sinistre ${this.claim.reference}\n\nMessage: ${this.emailMessage}\n\n📋 Voir console (F12) pour plus de détails`);
  
  // Fermer la modale
  this.showEmailModal = false;
  this.emailMessage = '';
}


  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'OPENED': '#185FA5',
      'ASSIGNED_TO_EXPERT': '#FF8C00',
      'UNDER_EXPERTISE': '#17a2b8',
      'CLOSED': '#3B6D11',
      'REJECTED': '#A32D2D'
    };
    return colors[status] || '#6c757d';
  }

  getUrgencyClass(score: number | undefined): string {
    const s = score || 0;
    if (s > 70) return 'high';
    if (s > 40) return 'medium';
    return 'low';
  }

  getExpertName(): string {
    return this.claim?.expert ? expertFullName(this.claim.expert) : 'Non assigné';
  }

exportToPDF(claimId: number): void {
  this.claimService.downloadPdf(claimId);
}
}