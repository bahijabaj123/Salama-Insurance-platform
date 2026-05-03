import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ClaimService } from '../../../core/services/claim.service';
import { EmailService } from '../../../core/services/email.service';
import { Claim, ClaimStatus, STATUS_LABELS, expertFullName } from '../../../core/models/claim.model';
import { ChangeDetectorRef } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';

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
    MatTooltipModule,
    MatProgressBarModule,
    MatDividerModule
  ],
  templateUrl: './claim-detail.component.html',
  styleUrls: ['./claim-detail.component.scss']
})
export class ClaimDetailComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  
  claim: Claim | null = null;
  loading = true;
  saving = false;
  showEmailModal = false;
  sendingNotification = false;
  emailMessage = '';
  STATUS_LABELS = STATUS_LABELS;
  statusOptions = Object.values(ClaimStatus);
  
  // Upload properties
  uploading = false;
  uploadProgress = 0;
  selectedFile: File | null = null;
  
  editForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private claimService: ClaimService,
    private emailService: EmailService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
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
    
    this.claimService.getClaimById(id).subscribe({
      next: (claim) => {
        console.log('🔍 Clés de l\'objet claim:', Object.keys(claim));
        console.log('🔍 Expert (minuscule):', claim.expert);
        console.log('🔍 Expert (majuscule):', (claim as any).Expert);
        
        if ((claim as any).Expert && !claim.expert) {
          (claim as any).expert = (claim as any).Expert;
        }
        
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
        this.loading = false;
        alert(`Erreur: ${err.status === 0 ? 'Backend inaccessible' : err.message}`);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/assureur/claims']);
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

  sendNotificationToClient(message: string): void {
    if (!this.claim) {
      console.error('❌ Aucun sinistre chargé');
      this.notificationService.show('Erreur', 'Aucun sinistre sélectionné', 'error', 3000);
      return;
    }

    const clientEmail = (this.claim as any).client?.email;
    const clientName = (this.claim as any).client?.fullName || 'Client';
    const claimRef = this.claim.reference;

    if (!clientEmail) {
      console.warn('⚠️ Aucun email client trouvé');
      this.notificationService.show('Information manquante', `Le sinistre ${claimRef} n'a pas d'email client associé`, 'warning', 4000);
      return;
    }

    this.sendingNotification = true;

    this.emailService.sendClientNotification({
      to: clientEmail,
      subject: `Mise à jour de votre sinistre ${claimRef}`,
      message: message,
      claimId: this.claim.id,
      claimReference: claimRef,
      clientName: clientName
    }).subscribe({
      next: () => {
        console.log('✅ Email envoyé avec succès');
        this.notificationService.show('✅ Notification envoyée', `Email envoyé à ${clientEmail} pour le sinistre ${claimRef}`, 'success', 5000);
        this.showEmailModal = false;
        this.emailMessage = '';
        this.sendingNotification = false;
      },
      error: (err) => {
        console.error('❌ Erreur envoi email:', err);
        this.notificationService.show('Erreur d\'envoi', `Impossible d'envoyer l'email`, 'error', 5000);
        this.sendingNotification = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.uploadFinalInvoice();
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.selectedFile = event.dataTransfer.files[0];
      this.uploadFinalInvoice();
    }
  }

  uploadFinalInvoice(): void {
    if (!this.selectedFile || !this.claim) return;
    
    if (this.selectedFile.type !== 'application/pdf') {
      this.notificationService.show('Erreur', 'Seuls les fichiers PDF sont acceptés', 'error', 3000);
      return;
    }
    
    this.uploading = true;
    this.uploadProgress = 0;
    
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    
    const interval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 200);
    
    this.claimService.uploadFinalInvoice(this.claim.id, formData).subscribe({
      next: (response: any) => {
        clearInterval(interval);
        this.uploadProgress = 100;
        
        if (this.claim) {
          this.claim.status = response.status;
        }
        
        this.notificationService.show(
          '✅ Sinistre clôturé',
          response.message || `La facture a été uploadée avec succès.`,
          'success',
          5000
        );
        
        setTimeout(() => {
          this.uploading = false;
          this.uploadProgress = 0;
          this.selectedFile = null;
          this.loadClaim(this.claim!.id);
        }, 1000);
      },
      error: (err) => {
        clearInterval(interval);
        console.error('Erreur upload:', err);
        if (err.status === 200) {
          this.notificationService.show('⚠️ Document uploadé', "Le document a été uploadé mais la réponse n'a pas pu être lue.", 'warning', 5000);
          this.uploading = false;
          this.uploadProgress = 0;
          this.selectedFile = null;
          this.loadClaim(this.claim!.id);
        } else {
          this.notificationService.show('Erreur', "Échec de l'upload de la facture", 'error', 3000);
          this.uploading = false;
          this.uploadProgress = 0;
        }
      }
    });
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
