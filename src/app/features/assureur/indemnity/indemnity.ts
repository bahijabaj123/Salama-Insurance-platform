import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-indemnity',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './indemnity.html',
  styleUrls: ['./indemnity.css']
})
export class IndemnityComponent implements OnInit {
  paymentData: any = null;
  isLoading = true;
  signatureData: string = '';
  errorMessage = '';
  claimId!: number;
  today = new Date();

  private readonly API_URL = 'http://localhost:8082/api/indemnities';

  @ViewChild('signatureCanvas') signatureCanvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private drawing = false;
  private canvasInitialized = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.claimId = +id;
      this.loadIndemnityData(this.claimId);
    } else {
      this.errorMessage = 'Identifiant du sinistre manquant';
      this.isLoading = false;
    }
  }

  loadIndemnityData(claimId: number): void {
    console.log('loadIndemnityData appelé pour claimId', claimId);
    this.isLoading = true;
    this.errorMessage = '';
    this.paymentData = null;
    this.cdr.detectChanges();

    this.http.post<any>(`${this.API_URL}/generate/${claimId}`, {}).subscribe({
      next: (data) => {
        console.log('Données reçues :', data);
        this.paymentData = data;
        this.isLoading = false;
        this.cdr.detectChanges();
        // Attendre que le DOM soit mis à jour avec le canvas
        setTimeout(() => this.initCanvas(), 100);
      },
      error: (err) => {
        console.error('Erreur API :', err);
        this.errorMessage = `Erreur ${err.status} : ${err.error?.message || err.message}`;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private initCanvas(): void {
    if (this.canvasInitialized) return;
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas) {
      console.warn('Canvas pas encore disponible');
      return;
    }

    // Dimensions fixes
    canvas.width = 500;
    canvas.height = 200;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.ctx.strokeStyle = 'black';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Événements souris
    canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));
    canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));

    // Événements tactiles
    canvas.addEventListener('touchstart', this.startDrawingTouch.bind(this));
    canvas.addEventListener('touchmove', this.drawTouch.bind(this));
    canvas.addEventListener('touchend', this.stopDrawing.bind(this));

    this.canvasInitialized = true;
    console.log('Canvas initialisé - signature prête');
  }

  private startDrawing(e: MouseEvent): void {
    this.drawing = true;
    const rect = this.signatureCanvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  private draw(e: MouseEvent): void {
    if (!this.drawing) return;
    const rect = this.signatureCanvasRef.nativeElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  private startDrawingTouch(e: TouchEvent): void {
    e.preventDefault();
    this.drawing = true;
    const rect = this.signatureCanvasRef.nativeElement.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  private drawTouch(e: TouchEvent): void {
    e.preventDefault();
    if (!this.drawing) return;
    const rect = this.signatureCanvasRef.nativeElement.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  private stopDrawing(): void {
    this.drawing = false;
    this.ctx.beginPath();
  }

  clearSignature(): void {
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas) return;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.signatureData = '';
  }

  saveSignature(): void {
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas || this.isCanvasEmpty(canvas)) {
      alert('Veuillez dessiner votre signature');
      return;
    }
    const fullDataUrl = canvas.toDataURL('image/png');
    this.signatureData = fullDataUrl.split(',')[1];
    alert('Signature numérique enregistrée');
  }

  private isCanvasEmpty(canvas: HTMLCanvasElement): boolean {
    const ctx = canvas.getContext('2d');
    if (!ctx) return true;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] !== 0) return false;
    }
    return true;
  }

  retry(): void {
    this.loadIndemnityData(this.claimId);
  }

  goBack(): void {
    this.router.navigate(['/claims']);
  }

  downloadPDF(): void {
    const id = this.paymentData?.idIndemnity ?? this.paymentData?.id;
    if (!id || !this.signatureData) {
      this.errorMessage = !id ? 'Identifiant manquant' : 'Veuillez d’abord valider votre signature';
      return;
    }

    this.http.post(
      `${this.API_URL}/${id}/pdf`,
      { signature: this.signatureData },
      { responseType: 'blob' }
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Quittance_Salama_${id}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Erreur lors du téléchargement du PDF';
      }
    });
  }
}
