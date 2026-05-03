import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as faceapi from 'face-api.js';
import { Expert, EXPERT_STATUSES, INTERVENTION_ZONES } from '../../models/expert.model';
import { ExpertService } from '../../services/expert.service';

type FaceApiModule = typeof import('face-api.js');

@Component({
  selector: 'app-create-expert',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './create-expert.component.html',
  styleUrl: './create-expert.component.scss'
})
export class CreateExpertComponent implements OnInit, OnDestroy {
  @ViewChild('cameraVideo') cameraVideo?: ElementRef<HTMLVideoElement>;
  @ViewChild('cameraOverlay') cameraOverlay?: ElementRef<HTMLCanvasElement>;

  isEditMode = false;
  expertId: number | null = null;
  loading = signal(false);
  submitLoading = signal(false);
  error = signal('');
  successMessage = signal('');
  cameraOpen = signal(false);
  cameraLoading = signal(false);
  photoDataUrl = signal<string | null>(null);
  modelReady = signal(false);
  faceDetected = signal(false);
  isMatch = signal<boolean | null>(null);
  similarityPercent = signal<number | null>(null);
  faceIdentity = signal<string | null>(null);
  faceError = signal('');

  private mediaStream: MediaStream | null = null;
  private faceapiLib: FaceApiModule | null = null;
  private referenceDescriptor: Float32Array | null = null;
  private detectionRafId: number | null = null;
  private detectionBusy = false;
  private lastFaceSeenAt = 0;
  private readonly modelUrl = 'https://justadudewhohacks.github.io/face-api.js/models';
  private readonly matchThreshold = 0.62;

  interventionZones = INTERVENTION_ZONES;
  expertStatuses = EXPERT_STATUSES;

  expert: Expert = {
    lastName: '',
    firstName: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    fax: '',
    specialty: '',
    status: 'ACTIVE',
    interventionZone: undefined,
    registrationDate: new Date().toISOString().split('T')[0],
    yearsOfExperience: 0,
    currentWorkload: 0,
    available: true,
    performanceScore: 100,
    activeClaims: 0,
    maxWorkload: 10
  };

  constructor(
    private expertService: ExpertService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.expertId = +id;
      this.loadExpert(this.expertId);
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  loadExpert(id: number): void {
    this.loading.set(true);
    this.expertService.getById(id).subscribe({
      next: (data) => {
        this.expert = data;
        this.photoDataUrl.set(this.resolvePhotoFromExpert(data));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Expert not found.');
        this.loading.set(false);
      }
    });
  }

  onSubmit(): void {
    this.error.set('');
    this.submitLoading.set(true);
    this.syncPhotoToExpert();

    const action = this.isEditMode && this.expertId
      ? this.expertService.update(this.expertId, this.expert)
      : this.expertService.create(this.expert);

    action.subscribe({
      next: () => {
        this.submitLoading.set(false);
        this.successMessage.set(this.isEditMode ? 'Expert updated successfully.' : 'Expert created successfully.');
        setTimeout(() => this.router.navigate(['/expert/dashboard']), 1200);
      },
      error: (err) => {
        this.submitLoading.set(false);
        this.error.set(err.error?.message || 'Something went wrong. Check the information you entered.');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/expert/dashboard']);
  }

  getInitials(): string {
    const f = (this.expert.firstName || 'E')[0].toUpperCase();
    const l = (this.expert.lastName || 'X')[0].toUpperCase();
    return `${f}${l}`;
  }

  onPhotoFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.error.set('Please select a valid image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result as string;
      this.setPhoto(imageData);
      await this.buildReferenceFromDataUrl(imageData);
    };
    reader.onerror = () => this.error.set('Could not read the selected image.');
    reader.readAsDataURL(file);
    input.value = '';
  }

  async openCamera(): Promise<void> {
    this.error.set('');
    this.faceError.set('');
    this.cameraLoading.set(true);
    this.cameraOpen.set(true);

    try {
      await this.ensureModelsLoaded();
      if (!this.modelReady()) {
        this.cameraLoading.set(false);
        this.cameraOpen.set(false);
        return;
      }
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.cameraLoading.set(false);
      setTimeout(() => {
        const video = this.cameraVideo?.nativeElement;
        if (!video || !this.mediaStream) return;
        video.srcObject = this.mediaStream;
        void video.play();
        this.startDetectionLoop();
      }, 0);
    } catch {
      this.cameraLoading.set(false);
      this.cameraOpen.set(false);
      this.error.set('Camera access denied or unavailable.');
    }
  }

  capturePhoto(): void {
    const video = this.cameraVideo?.nativeElement;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    this.setPhoto(dataUrl);
    void this.buildReferenceFromDataUrl(dataUrl);
  }

  closeCamera(): void {
    this.stopCamera();
    this.cameraOpen.set(false);
    this.cameraLoading.set(false);
  }

  clearPhoto(): void {
    this.setPhoto(null);
    this.referenceDescriptor = null;
    this.faceIdentity.set(null);
    this.isMatch.set(null);
    this.similarityPercent.set(null);
  }

  private stopCamera(): void {
    if (this.detectionRafId !== null) {
      cancelAnimationFrame(this.detectionRafId);
      this.detectionRafId = null;
    }
    this.detectionBusy = false;
    this.clearOverlay();

    if (!this.mediaStream) return;
    this.mediaStream.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
    this.faceDetected.set(false);
    this.lastFaceSeenAt = 0;
  }

  private setPhoto(dataUrl: string | null): void {
    this.photoDataUrl.set(dataUrl);
    this.expert.photo = dataUrl || undefined;
    this.expert.photoUrl = dataUrl || undefined;
    this.expert.avatar = dataUrl || undefined;
  }

  private resolvePhotoFromExpert(expert: Expert): string | null {
    const candidate = expert.photo || expert.photoUrl || expert.avatar;
    if (!candidate || !candidate.trim()) return null;
    const trimmed = candidate.trim();
    if (
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('blob:') ||
      trimmed.startsWith('/')
    ) {
      return trimmed;
    }
    return `data:image/jpeg;base64,${trimmed}`;
  }

  private syncPhotoToExpert(): void {
    const photo = this.photoDataUrl();
    this.expert.photo = photo || undefined;
    this.expert.photoUrl = photo || undefined;
    this.expert.avatar = photo || undefined;
  }

  private async ensureModelsLoaded(): Promise<void> {
    if (this.modelReady()) return;
    try {
if (!this.faceapiLib) {
  this.faceapiLib = await import('face-api.js');
}
      const faceapi = this.faceapiLib;
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(this.modelUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(this.modelUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(this.modelUrl)
      ]);
      this.modelReady.set(true);
    } catch {
      this.faceError.set('Failed to load AI models.');
      this.modelReady.set(false);
    }
  }

  private async buildReferenceFromDataUrl(imageSrc: string): Promise<void> {
    await this.ensureModelsLoaded();
    if (!this.modelReady() || !this.faceapiLib) return;
    try {
      const img = new Image();
      img.src = imageSrc;
      await img.decode();
      const result = await this.detectWithRetry(img, this.faceapiLib);
      if (!result) {
        this.referenceDescriptor = null;
        this.faceIdentity.set(null);
        this.faceError.set('No face detected in the reference photo.');
        return;
      }
      this.referenceDescriptor = result.descriptor;
      this.faceIdentity.set(this.generateFaceIdentity(result.descriptor));
      this.faceError.set('');
    } catch {
      this.faceError.set('Could not analyze the reference photo.');
    }
  }

  private startDetectionLoop(): void {
    const loop = async () => {
      if (!this.cameraOpen()) return;
      if (this.detectionBusy) {
        this.detectionRafId = requestAnimationFrame(loop);
        return;
      }
      this.detectionBusy = true;
      try {
        await this.detectFromVideoFrame();
      } finally {
        this.detectionBusy = false;
        this.detectionRafId = requestAnimationFrame(loop);
      }
    };
    this.detectionRafId = requestAnimationFrame(loop);
  }

  private async detectFromVideoFrame(): Promise<void> {
    const video = this.cameraVideo?.nativeElement;
    const canvas = this.cameraOverlay?.nativeElement;
    const faceapi = this.faceapiLib;
    if (!video || !canvas || !faceapi) return;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const detection = await this.detectWithRetry(video, faceapi);
    if (!detection) {
      this.clearOverlay();
      if (Date.now() - this.lastFaceSeenAt > 1200) {
        this.faceDetected.set(false);
        this.isMatch.set(null);
        this.similarityPercent.set(null);
      }
      return;
    }

    this.faceDetected.set(true);
    this.lastFaceSeenAt = Date.now();
    const resized = faceapi.resizeResults(detection as never, {
      width: video.videoWidth,
      height: video.videoHeight
    });
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceLandmarks(canvas, resized);
    }

    if (!this.referenceDescriptor) {
      this.isMatch.set(null);
      this.similarityPercent.set(null);
      return;
    }
    const dist = faceapi.euclideanDistance(this.referenceDescriptor, detection.descriptor);
    const similarity = Math.max(0, Math.min(100, (1 - dist) * 100));
    this.similarityPercent.set(Number(similarity.toFixed(1)));
    this.isMatch.set(dist <= this.matchThreshold);
  }

  private async detectWithRetry(input: HTMLVideoElement | HTMLImageElement, faceapi: FaceApiModule): Promise<any | undefined> {
    const options = [
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.2 }),
      new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.18 }),
      new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.25 })
    ];
    for (const option of options) {
      const result = await faceapi.detectSingleFace(input, option).withFaceLandmarks().withFaceDescriptor();
      if (result) return result;
    }
    return undefined;
  }

  private clearOverlay(): void {
    const canvas = this.cameraOverlay?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }

  private generateFaceIdentity(descriptor: Float32Array): string {
    const sample = Array.from(descriptor.slice(0, 8))
      .map((value) => Math.abs(Math.round(value * 10000)).toString(16).padStart(4, '0'))
      .join('')
      .slice(0, 10)
      .toUpperCase();
    return `FACE-${sample}`;
  }
}
