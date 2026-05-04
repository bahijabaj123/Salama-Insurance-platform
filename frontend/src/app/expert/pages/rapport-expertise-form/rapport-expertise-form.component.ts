import {
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  afterNextRender,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

import { AccidentLocationPick, AccidentLocationPickerComponent } from '../../components/accident-location-picker/accident-location-picker';
import { buildFullExpertiseReportPayload } from '../../data/full-expertise-report.template';
import {
  EXPERTISE_PREFILL_NAV_STATE_KEY,
  VEHICLE_CHOICE_STORAGE_KEY,
  type ExpertisePrefillPayload,
} from '../../data/vehicle-selection.catalog';
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
  /** Message informatif (ex. texte généré localement quand l’IA ne répond pas). */
  aiAnalysisInfo = signal('');
  aiAnalysisText = signal('');
  aiAnalysisSource = signal('');
  /** True si le bloc d’analyse affiché provient du repli local (pas du backend). */
  aiAnalysisOfflineFallback = signal(false);
  aiImagePreviewUrl = signal<string | null>(null);
  private aiPreviewObjectUrl: string | null = null;

  expertId: number | null = null;
  tiersDossier = '';
  vehiculeExpertiseCible = 'Insured';
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
    private router: Router,
    private readonly injector: Injector,
  ) {}

  ngOnInit(): void {
    this.report = { ...buildFullExpertiseReportPayload() } as ExpertiseReport;
    this.consumePrefillFromSession();
    this.mainsOeuvre = this.typesMainOeuvre.map((typeTravail) => ({ typeTravail, montant: '', tauxTva: '19', description: '' }));
    this.piecesJointes = this.typesPiece.map((typeDocument) => ({ typeDocument, nombre: 0 }));

    this.rapportService
      .getExperts()
      .pipe(
        timeout(EXPERTS_HTTP_TIMEOUT_MS),
        catchError(() => {
          this.error.set('Could not load experts (timeout or server unavailable).');
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

  /**
   * Préremplit véhicule + lignes Fournitures + nature des dégâts après le parcours
   * (état de navigation en priorité pour application immédiate au chargement du rapport).
   */
  private consumePrefillFromSession(): void {
    const defaultDommages = (): DommageLine[] => Array.from({ length: 3 }, () => this.emptyDommage());
    const defaultNature = 'To be completed after on-site inspection.';

    let o: Record<string, unknown> | null = null;
    let didConsumePrefill = false;

    try {
      if (typeof history !== 'undefined' && history.state) {
        const nav = (history.state as Record<string, unknown>)[EXPERTISE_PREFILL_NAV_STATE_KEY];
        if (nav && typeof nav === 'object' && typeof (nav as ExpertisePrefillPayload).vehiculeType === 'string') {
          o = nav as Record<string, unknown>;
        }
      }
      if (!o) {
        const raw = sessionStorage.getItem(VEHICLE_CHOICE_STORAGE_KEY);
        if (!raw) {
          this.dommages = defaultDommages();
          return;
        }
        o = JSON.parse(raw) as Record<string, unknown>;
      }

      if (typeof o['vehiculeType'] !== 'string' || !o['vehiculeType'].trim()) {
        this.dommages = defaultDommages();
        return;
      }
      didConsumePrefill = true;

      this.report.vehiculeType = o['vehiculeType'].trim();
      if (typeof o['vehiculeMarque'] === 'string' && o['vehiculeMarque'].trim()) {
        this.report.vehiculeMarque = o['vehiculeMarque'].trim();
      }
      if (typeof o['vehiculeGenre'] === 'string' && o['vehiculeGenre'].trim()) {
        this.report.vehiculeGenre = o['vehiculeGenre'].trim();
      }

      const damages = o['damages'];
      if (Array.isArray(damages) && damages.length > 0) {
        const viewEn: Record<string, string> = {
          avant: 'Front',
          droit: 'Right side',
          arriere: 'Rear',
          gauche: 'Left side',
        };
        const typeEn: Record<string, string> = { ENFONCE: 'Dented', RAYE: 'Scratched' };
        const linesNature: string[] = [];

        this.dommages = damages.map((d: unknown) => {
          const x = d as Record<string, unknown>;
          const partLabel = typeof x['partLabel'] === 'string' ? x['partLabel'] : '';
          const view = typeof x['view'] === 'string' ? x['view'] : '';
          const vLabel = viewEn[view] ?? view;
          const typesArr = Array.isArray(x['types']) ? (x['types'] as unknown[]) : [];
          const types = typesArr
            .map((t) => (typeof t === 'string' ? typeEn[t] ?? t : String(t)))
            .join(', ');
          const me = x['montantEstime'];
          const montantStr =
            typeof me === 'number' && Number.isFinite(me)
              ? String(Math.round(me))
              : typeof me === 'string' && me.trim()
                ? me.trim()
                : '';
          linesNature.push(
            `- ${vLabel} — ${partLabel}: ${types}${montantStr ? ` (${montantStr} EUR indicative incl. VAT)` : ''}`,
          );
          return {
            /** Colonne « Point » : zone / face */
            pointChoc: vLabel,
            /** Colonne « Designation » : pièce + types de dégât */
            designation: `${partLabel} — ${types}`,
            montant: montantStr,
            tauxTva: '19',
            estOccasion: false,
            quantite: 1,
          };
        });

        const blocNature = `Body diagram finding (guided entry):\n${linesNature.join('\n')}`;
        const nat = this.report.natureDegats?.trim() ?? '';
        if (!nat || nat === defaultNature) {
          this.report.natureDegats = blocNature;
        } else {
          this.report.natureDegats = `${nat}\n\n${blocNature}`;
        }
      } else {
        this.dommages = defaultDommages();
      }
    } catch {
      this.dommages = defaultDommages();
    } finally {
      if (didConsumePrefill) {
        try {
          sessionStorage.removeItem(VEHICLE_CHOICE_STORAGE_KEY);
        } catch {
          /* */
        }
        if (typeof history !== 'undefined' && history.state && EXPERTISE_PREFILL_NAV_STATE_KEY in history.state) {
          const st = { ...(history.state as Record<string, unknown>) };
          delete st[EXPERTISE_PREFILL_NAV_STATE_KEY];
          history.replaceState(st, '');
        }
      }
    }
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
      this.error.set('Select the expert responsible for the report.');
      return;
    }
    this.submitLoading.set(true);
    const payload = this.buildApiPayload();
    this.rapportService.createReport(this.expertId, payload).subscribe({
      next: (created) => {
        this.submitLoading.set(false);
        const reportId = this.extractCreatedReportId(created);
        this.createdReportId.set(reportId);
        this.successMessage.set(reportId != null ? `Report created successfully (ID ${reportId}).` : 'Report created successfully.');
      },
      error: (err: unknown) => {
        this.submitLoading.set(false);
        this.error.set(this.formatHttpApiError(err, 'Failed to create the report.'));
      }
    });
  }

  downloadReportPdf(reportId: number | null): void {
    if (reportId == null) return;
    this.error.set('');
    this.rapportService.downloadExpertReportPdf(reportId).subscribe({
      next: async (blob) => {
        if (!(await this.blobLooksLikePdf(blob))) {
          const hint = await this.tryReadBlobAsErrorMessage(blob);
          this.error.set(
            hint || `The server response is not a valid PDF for report ${reportId}.`,
          );
          return;
        }
        const filename = `expertise-report-${reportId}.pdf`;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.rel = 'noopener';
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        // Laisser le temps au navigateur d’enregistrer le fichier avant de révoquer l’URL
        setTimeout(() => URL.revokeObjectURL(url), 90_000);
      },
      error: (err: unknown) => {
        this.error.set(this.formatHttpApiError(err, 'PDF download failed.'));
      },
    });
  }

  /** ID renvoyé par le backend (idRapport ou id selon sérialisation). */
  private extractCreatedReportId(created: ExpertiseReport | null | undefined): number | null {
    if (!created || typeof created !== 'object') return null;
    const any = created as ExpertiseReport & { id?: number };
    const v = any.idRapport ?? any.id;
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private async blobLooksLikePdf(blob: Blob): Promise<boolean> {
    const head = await blob.slice(0, 5).arrayBuffer();
    const sig = new Uint8Array(head);
    const pdf = [0x25, 0x50, 0x44, 0x46]; // "%PDF"
    if (sig.length < 4) return false;
    for (let i = 0; i < 4; i++) {
      if (sig[i] !== pdf[i]) return false;
    }
    return true;
  }

  private async tryReadBlobAsErrorMessage(blob: Blob): Promise<string | null> {
    try {
      const t = await blob.text();
      const j = JSON.parse(t) as { message?: string; error?: string };
      return j.message || j.error || null;
    } catch {
      return null;
    }
  }

  photoUrls(): string[] {
    return this.expertPhotosText.split(/\r?\n/).map((s) => s.trim()).filter((s) => /^https?:\/\/.+/i.test(s));
  }

  analyzePhotoUrl(url: string): void {
    this.aiAnalysisLoading.set(true);
    this.aiAnalysisError.set('');
    this.aiAnalysisInfo.set('');
    this.aiAnalysisText.set('');
    this.aiAnalysisOfflineFallback.set(false);
    this.aiAnalysisSource.set(url);
    this.rapportService.analyzeAccidentImageByUrl(url).subscribe({
      next: (r) => {
        this.aiAnalysisLoading.set(false);
        if (r.success && r.analysis) {
          this.aiAnalysisText.set(r.analysis.trim());
          this.aiAnalysisOfflineFallback.set(false);
        } else {
          this.applyLocalImageAnalysisFallback(url, r.errorMessage || 'Analysis unavailable.');
        }
      },
      error: (err) => {
        this.aiAnalysisLoading.set(false);
        this.applyLocalImageAnalysisFallback(url, this.formatAiHttpError(err));
      }
    });
  }

  onAiFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.aiAnalysisLoading.set(true);
    this.aiAnalysisError.set('');
    this.aiAnalysisInfo.set('');
    this.aiAnalysisText.set('');
    this.aiAnalysisOfflineFallback.set(false);
    this.aiAnalysisSource.set(file.name);
    this.setAiPreviewFromFile(file);
    this.rapportService.analyzeAccidentImageUpload(file).subscribe({
      next: (r) => {
        this.aiAnalysisLoading.set(false);
        if (r.success && r.analysis) {
          this.aiAnalysisText.set(r.analysis.trim());
          this.aiAnalysisOfflineFallback.set(false);
        } else {
          this.applyLocalImageAnalysisFallback(file.name, r.errorMessage || 'Analysis unavailable.');
        }
        input.value = '';
      },
      error: (err) => {
        this.aiAnalysisLoading.set(false);
        this.applyLocalImageAnalysisFallback(file.name, this.formatAiHttpError(err));
        input.value = '';
      }
    });
  }

  /** Texte d’aide sous la zone IA (pas de doublon avec les bandeaux erreur / info). */
  aiIdleHint(): string {
    if (
      this.aiAnalysisLoading() ||
      this.aiAnalysisError() ||
      this.aiAnalysisInfo() ||
      this.aiAnalysisText()
    ) {
      return '';
    }
    return 'Choose an image or a URL to run AI analysis.';
  }

  insertAiIntoNatureDegats(): void {
    const block = this.aiAnalysisText();
    if (!block) return;
    const existing = this.report.natureDegats?.trim();
    const tag = this.aiAnalysisOfflineFallback()
      ? '--- Local draft (AI unavailable) ---'
      : '--- Automated analysis (AI) ---';
    const sep = existing ? `\n\n${tag}\n` : '';
    this.report.natureDegats = (existing ?? '') + sep + block;
  }

  /**
   * Quand le backend IA ne répond pas : remplit un texte de secours (style synthèse IA + état véhicule).
   */
  private applyLocalImageAnalysisFallback(sourceLabel: string, reason: string): void {
    this.aiAnalysisError.set('');
    this.aiAnalysisOfflineFallback.set(true);
    this.aiAnalysisInfo.set(
      `AI analysis unavailable (${reason}). A local comment was generated — validate after vehicle inspection.`,
    );
    this.aiAnalysisText.set(this.buildLocalExpertiseCommentary(sourceLabel));
  }

  private buildLocalExpertiseCommentary(sourceLabel: string): string {
    const ts = new Date().toLocaleString('en-US');
    return [
      '--- Summary (offline mode, auto-report style wording) ---',
      `From the photo « ${sourceLabel} », the shot documents a loss with visible damage on the exposed part of the vehicle. Images like this often suggest a front or front-side impact: deformation of bumper, hood, wings or lights, with possible effect on the engine bay or front axle depending on crash dynamics.`,
      '',
      'This paragraph is generated locally when the analysis service does not respond; it does not replace on-site expertise or workshop measurements.',
      '',
      '--- Vehicle condition (to be confirmed by the expert) ---',
      '• Front / front flank: check panel gaps, rails, radiator and lamp supports.',
      '• Mechanical: check leaks, engine/gearbox mounts, belts and peripheral components after impact.',
      '• Running gear: suspension, links, ball joints, wheels/tires — alignment should always be checked.',
      '• Passive safety: belts, airbags, connectors — note ECU faults if any.',
      '• Paint / body: extent of blend and refinish to quote in the estimate.',
      '',
      `Document: ${sourceLabel} — generated ${ts} (local fallback).`,
    ].join('\n');
  }

  private formatAiHttpError(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 0) {
      return 'Connection refused to the backend.';
    }
    return 'Network or server error.';
  }

  private formatHttpApiError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body && typeof body === 'object' && 'message' in body) {
        const m = (body as { message?: string }).message;
        if (m) return m;
      }
      if (typeof body === 'string' && body.length > 0 && body.length < 800) {
        return body;
      }
      if (err.status === 0) {
        return 'Could not reach the server. Check that the backend is running (port 8082).';
      }
      return `Server error (${err.status}).`;
    }
    return fallback;
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
    const sig = this.exportSignatureFromCanvas();
    if (sig) base['expertSignature'] = sig;
    return base;
  }

  private exportSignatureFromCanvas(): string | null {
    const canvas = this.sigCanvasRef?.nativeElement;
    if (!canvas || !this.sigCtx) return null;
    try {
      if (this.isSignatureCanvasBlank(canvas)) return null;
      return canvas.toDataURL('image/png');
    } catch {
      return null;
    }
  }

  private isSignatureCanvasBlank(canvas: HTMLCanvasElement): boolean {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 10) continue;
      if (r < 250 || g < 250 || b < 250) return false;
    }
    return true;
  }

  private sigCanvasInitAttempts = 0;

  private initSignatureCanvas(): void {
    const canvas = this.sigCanvasRef?.nativeElement;
    if (!canvas) {
      if (this.sigCanvasInitAttempts < 10) {
        this.sigCanvasInitAttempts++;
        setTimeout(() => this.initSignatureCanvas(), 50);
      }
      return;
    }
    this.sigCanvasInitAttempts = 0;
    // Éviter de réinitialiser si déjà prêt (ne pas effacer une signature en cours)
    if (this.sigCtx && canvas.width === 600 && canvas.height === 180) {
      return;
    }
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
