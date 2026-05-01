import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

import { AccidentLocationPick, AccidentLocationPickerComponent } from '../../components/accident-location-picker/accident-location-picker';
import { buildFullExpertiseReportPayload } from '../../data/full-expertise-report.template';
import { DommageLine, ExpertiseReport, MainOeuvreLine, PieceJointeLine } from '../../models/expertise-report.model';
import { Expert } from '../../models/expert.model';
import { RapportExpertiseChatService } from '../../services/rapport-expertise-chat.service';

const EXPERT_SIGNATURE_STORAGE_KEY = 'salama.expertise.signature.png.v1';
const EXPERTS_HTTP_TIMEOUT_MS = 15000;

@Component({
  selector: 'app-rapport-expertise-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AccidentLocationPickerComponent],
  templateUrl: './rapport-expertise-form.component.html',
  styleUrl: './rapport-expertise-form.component.scss'
})
export class RapportExpertiseFormComponent implements OnInit, OnDestroy {
  experts = signal<Expert[]>([]);
  loadingExperts = signal(true);
  submitLoading = signal(false);
  error = signal('');
  successMessage = signal('');
  createdReportId = signal<number | null>(null);
  aiAnalysisLoading = signal(false);
  aiAnalysisError = signal('');
  aiAnalysisText = signal('');
  aiAnalysisSource = signal('');
  aiImagePreviewUrl = signal<string | null>(null);
  private aiPreviewObjectUrl: string | null = null;

  expertId: number | null = null;
  tiersDossier = '';
  vehiculeExpertiseCible = 'Assure';
  circonstance = '';
  expertPhotosText = '';

  readonly energies = ['ESSENCE', 'DIESEL', 'HYBRIDE', 'ELECTRIQUE', 'GPL'] as const;
  readonly etatsVehicule = ['BON', 'ASSEZ_BON', 'MOYEN', 'MAUVAIS', 'EPAVE'] as const;
  readonly statutsRapport = ['DRAFT', 'SUBMITTED', 'EN_COURS', 'TERMINE', 'VALIDE', 'REJETE', 'ANNULE'] as const;
  readonly typesMainOeuvre = ['TOLERIE', 'MECANIQUE', 'ELECTRICITE', 'PEINTURE'] as const;
  readonly typesPiece = ['COPIE', 'RECU', 'PHOTO', 'FACTURE', 'AUTRE'] as const;

  report: ExpertiseReport = {};
  dommages: DommageLine[] = [];
  mainsOeuvre: MainOeuvreLine[] = [];
  piecesJointes: PieceJointeLine[] = [];

  @ViewChild('sigCanvas') private sigCanvasRef?: ElementRef<HTMLCanvasElement>;
  private sigCtx: CanvasRenderingContext2D | null = null;
  private sigDrawing = false;

  constructor(
    private rapportService: RapportExpertiseChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.report = { ...buildFullExpertiseReportPayload() } as ExpertiseReport;
    this.dommages = Array.from({ length: 3 }, () => this.emptyDommage());
    this.mainsOeuvre = this.typesMainOeuvre.map((typeTravail) => ({ typeTravail, montant: '', tauxTva: '19', description: '' }));
    this.piecesJointes = this.typesPiece.map((typeDocument) => ({ typeDocument, nombre: 0 }));

    this.rapportService
      .getExperts()
      .pipe(
        timeout(EXPERTS_HTTP_TIMEOUT_MS),
        catchError(() => {
          this.error.set('Impossible de charger les experts (timeout ou serveur indisponible).');
          return of([] as Expert[]);
        }),
        finalize(() => {
          this.loadingExperts.set(false);
          setTimeout(() => this.initSignatureCanvas(), 0);
        }),
      )
      .subscribe({
        next: (list) => {
          this.experts.set(list ?? []);
          const first = (list ?? []).find((e) => e.status === 'ACTIVE') ?? list?.[0];
          if (first?.idExpert != null) this.expertId = first.idExpert;
        },
      });
  }

  ngOnDestroy(): void {
    this.revokeAiPreview();
  }

  private emptyDommage(): DommageLine {
    return { designation: '', pointChoc: '', montant: '', tauxTva: '19', estOccasion: false, quantite: 1 };
  }

  addDommageRow(): void {
    this.dommages.push(this.emptyDommage());
  }

  removeDommageRow(i: number): void {
    if (this.dommages.length > 1) this.dommages.splice(i, 1);
  }

  onCancel(): void {
    void this.router.navigateByUrl('/expert/chat');
  }

  onAccidentLocationPick(v: AccidentLocationPick | null): void {
    if (!v) {
      delete this.report.accidentLatitude;
      delete this.report.accidentLongitude;
      this.report.accidentLocationLabel = undefined;
      return;
    }
    this.report.accidentLatitude = v.lat;
    this.report.accidentLongitude = v.lng;
    this.report.accidentLocationLabel = v.label;
  }

  onSubmit(): void {
    this.error.set('');
    this.createdReportId.set(null);
    if (this.expertId == null) {
      this.error.set('Selectionnez un expert responsable du rapport.');
      return;
    }
    this.submitLoading.set(true);
    const payload = this.buildApiPayload();
    this.rapportService.createReport(this.expertId, payload).subscribe({
      next: (created) => {
        this.submitLoading.set(false);
        const reportId = created?.idRapport ?? null;
        this.createdReportId.set(reportId);
        this.successMessage.set(reportId != null ? `Rapport cree avec succes (ID ${reportId}).` : 'Rapport cree avec succes.');
      },
      error: () => {
        this.submitLoading.set(false);
        this.error.set('Echec de la creation du rapport.');
      }
    });
  }

  downloadReportPdf(reportId: number | null): void {
    if (reportId == null) return;
    this.rapportService.downloadExpertReportPdf(reportId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `rapport-expertise-${reportId}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.error.set('Rapport cree, mais telechargement PDF impossible pour le moment.');
      }
    });
  }

  photoUrls(): string[] {
    return this.expertPhotosText.split(/\r?\n/).map((s) => s.trim()).filter((s) => /^https?:\/\/.+/i.test(s));
  }

  analyzePhotoUrl(url: string): void {
    this.aiAnalysisLoading.set(true);
    this.aiAnalysisError.set('');
    this.aiAnalysisText.set('');
    this.aiAnalysisSource.set(url);
    this.rapportService.analyzeAccidentImageByUrl(url).subscribe({
      next: (r) => {
        this.aiAnalysisLoading.set(false);
        if (r.success && r.analysis) this.aiAnalysisText.set(r.analysis.trim());
        else this.aiAnalysisError.set(r.errorMessage || 'Analyse indisponible.');
      },
      error: (err) => {
        this.aiAnalysisLoading.set(false);
        this.aiAnalysisError.set(this.formatAiHttpError(err));
      }
    });
  }

  onAiFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.aiAnalysisLoading.set(true);
    this.aiAnalysisError.set('');
    this.aiAnalysisText.set('');
    this.aiAnalysisSource.set(file.name);
    this.setAiPreviewFromFile(file);
    this.rapportService.analyzeAccidentImageUpload(file).subscribe({
      next: (r) => {
        this.aiAnalysisLoading.set(false);
        if (r.success && r.analysis) this.aiAnalysisText.set(r.analysis.trim());
        else this.aiAnalysisError.set(r.errorMessage || 'Analyse indisponible.');
        input.value = '';
      },
      error: (err) => {
        this.aiAnalysisLoading.set(false);
        this.aiAnalysisError.set(this.formatAiHttpError(err));
        input.value = '';
      }
    });
  }

  aiDiagnosticComment(): string {
    return this.aiAnalysisError() ? this.aiAnalysisError() : 'Choisissez une image ou une URL pour lancer l’analyse IA.';
  }

  insertAiIntoNatureDegats(): void {
    const block = this.aiAnalysisText();
    if (!block) return;
    const existing = this.report.natureDegats?.trim();
    const sep = existing ? '\n\n--- Analyse automatique (IA) ---\n' : '';
    this.report.natureDegats = (existing ?? '') + sep + block;
  }

  private formatAiHttpError(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 0) {
      return 'Connexion refusee vers le backend.';
    }
    return 'Erreur reseau ou serveur.';
  }

  private revokeAiPreview(): void {
    if (this.aiPreviewObjectUrl) {
      URL.revokeObjectURL(this.aiPreviewObjectUrl);
      this.aiPreviewObjectUrl = null;
    }
    this.aiImagePreviewUrl.set(null);
  }

  private setAiPreviewFromFile(file: File): void {
    this.revokeAiPreview();
    this.aiPreviewObjectUrl = URL.createObjectURL(file);
    this.aiImagePreviewUrl.set(this.aiPreviewObjectUrl);
  }

  private buildApiPayload(): Record<string, unknown> {
    const r = { ...this.report };
    const base: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      if (v !== '' && v != null) base[k] = v;
    }
    const photos = this.expertPhotosText.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    if (photos.length) base['expertPhotos'] = photos;
    const dommages = this.dommages.filter((d) => d.designation?.trim());
    if (dommages.length) base['dommages'] = dommages;
    const mainsOeuvre = this.mainsOeuvre.filter((m) => m.typeTravail && m.montant != null && m.montant !== '');
    if (mainsOeuvre.length) base['mainsOeuvre'] = mainsOeuvre;
    const piecesJointes = this.piecesJointes.filter((p) => (p.nombre ?? 0) > 0);
    if (piecesJointes.length) base['piecesJointes'] = piecesJointes;
    return base;
  }

  private initSignatureCanvas(): void {
    const canvas = this.sigCanvasRef?.nativeElement;
    if (!canvas) return;
    canvas.width = 600;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.sigCtx = ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2.5;
    this.loadSignatureFromLocalStorage();
  }

  onSigPointerDown(e: PointerEvent): void {
    if (!this.sigCtx || !this.sigCanvasRef) return;
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    this.sigDrawing = true;
    const { x, y } = this.sigClientToCanvas(e);
    this.sigCtx.beginPath();
    this.sigCtx.moveTo(x, y);
  }

  onSigPointerMove(e: PointerEvent): void {
    if (!this.sigDrawing || !this.sigCtx) return;
    e.preventDefault();
    const { x, y } = this.sigClientToCanvas(e);
    this.sigCtx.lineTo(x, y);
    this.sigCtx.stroke();
  }

  onSigPointerUp(e: PointerEvent): void {
    if (!this.sigDrawing) return;
    this.sigDrawing = false;
    try {
      (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
    } catch {}
    this.persistSignatureToLocalStorage();
  }

  clearExpertSignature(): void {
    if (!this.sigCtx || !this.sigCanvasRef) return;
    const c = this.sigCanvasRef.nativeElement;
    this.sigCtx.clearRect(0, 0, c.width, c.height);
    try {
      localStorage.removeItem(EXPERT_SIGNATURE_STORAGE_KEY);
    } catch {}
  }

  private sigClientToCanvas(e: PointerEvent): { x: number; y: number } {
    const canvas = this.sigCanvasRef!.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  }

  private persistSignatureToLocalStorage(): void {
    try {
      const canvas = this.sigCanvasRef?.nativeElement;
      if (!canvas) return;
      localStorage.setItem(EXPERT_SIGNATURE_STORAGE_KEY, canvas.toDataURL('image/png'));
    } catch {}
  }

  private loadSignatureFromLocalStorage(): void {
    try {
      const raw = localStorage.getItem(EXPERT_SIGNATURE_STORAGE_KEY);
      if (!raw?.startsWith('data:image') || !this.sigCtx || !this.sigCanvasRef) return;
      const img = new Image();
      img.onload = () => {
        if (!this.sigCtx || !this.sigCanvasRef) return;
        const c = this.sigCanvasRef.nativeElement;
        this.sigCtx.clearRect(0, 0, c.width, c.height);
        this.sigCtx.drawImage(img, 0, 0, c.width, c.height);
      };
      img.src = raw;
    } catch {}
  }
}
