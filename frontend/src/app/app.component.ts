import { Component, AfterViewInit, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AccidentService } from './services/accident.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'my-app';
  @ViewChild('carViewer')    carViewerRef!:  ElementRef<HTMLDivElement>;
  @ViewChild('sketchCanvas') sketchCanvasRef!: ElementRef<HTMLCanvasElement>;

  currentDamageType = '';
  damages: any[] = [];
  selectedPart: any = null;
  selectedObject: THREE.Mesh | null = null;
  uploadedPhotos: string[] = [];
  currentAccidentId: number | null = null;
  damagedZones: number[] = [];
  circumstancesA: string[] = [];
  circumstancesB: string[] = [];
  stats: any = null;
  statsLoaded = false;
  activePeriod = '30j';
  currentYear = new Date().getFullYear();
  recentConstats: any[] = [];

  // Croquis
  sketchBase64: string | null = null;
  selectedTool = 'pen';
  drawColor = '#1a1a2e';
  lineWidth = 3;
  private drawing = false;
  private lastX = 0;
  private lastY = 0;
  private snapshot: ImageData | null = null;
  private ctx!: CanvasRenderingContext2D;
  cars: { x: number; y: number; type: string; label: string; rotation: number }[] = [];
  pedestrians: { x: number; y: number; label: string; rotation: number }[] = [];
  impacts: { x: number; y: number }[] = [];
  private draggedItem: any = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  
circumstancesOptions = [
  { code: 'STATIONNAIT',                label: 'Stationnait' },                                          // 1
  { code: 'QUITTAIT_STATIONNEMENT',     label: 'Quittait un stationnement' },                            // 2
  { code: 'PRENAIT_STATIONNEMENT',      label: 'Prenait un stationnement' },                             // 3 ✅
  { code: 'SORTAIT_PARKING',            label: "Sortait d'un parking, d'un lieu privé, chemin de terre" }, // 4
  { code: 'SENGAGEAIT_PARKING',         label: "S'engageait dans un parking, lieu privé, chemin de terre" }, // 5 ✅
  { code: 'ARRET_CIRCULATION',          label: 'Arrêt de circulation' },                                 // 6 ✅
  { code: 'FROTTEMENT_SANS_CHANGEMENT', label: 'Frottement sans changement de file' },                   // 7 ✅
  { code: 'HEURTAIT_ARRIERE',           label: "Heurtait par l'arrière, même sens, même file" },         // 8
  { code: 'MEME_SENS_FILE_DIFFERENTE',  label: 'Roulait dans le même sens, file différente' },           // 9 ✅
  { code: 'CHANGAIT_FILE',              label: 'Changeait de file' },                                    // 10
  { code: 'DOUBLAIT',                   label: 'Doublait' },                                             // 11
  { code: 'TOURNANT_DROITE',            label: 'Virait à droite' },                                      // 12
  { code: 'TOURNANT_GAUCHE',            label: 'Virait à gauche' },                                      // 13
  { code: 'RECULAIT',                   label: 'Reculait' },                                             // 14
  { code: 'EMPIETAIT_SENS_INVERSE',     label: 'Empiétait sur la chaussée en sens inverse' },            // 15
  { code: 'VENAIT_DROITE_CARREFOUR',    label: 'Venait de droite dans un carrefour' },                   // 16 ✅
  { code: 'NON_RESPECT_PRIORITE',       label: "N'avait pas observé le signal de priorité" },            // 17
];

  private partToZoneId: { [key: string]: number } = {
    'Carrosserie': 0, 'Capot': 2, 'Coffre': 6,
    'Pare-chocs avant': 1, 'Pare-chocs arrière': 7,
    'Phare gauche': 3, 'Phare droit': 4,
    'Feu arrière gauche': 8, 'Feu arrière droit': 9,
    'Toit': 10, 'Roue 1 Droit': 11, 'Roue 2 Gauche': 12,
    'Roue 3 Droit': 13, 'Roue 4 Gauche': 14
  };

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private carGroup!: THREE.Group;
  private signatureA: string | null = null;
  private signatureB: string | null = null;
  private monthlyChart: any = null;
  private donutChart: any = null;
  private typeChart: any = null;
  private circChart: any = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private accidentService: AccidentService
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.initPhotoSlots();
        this.initThreeJS();
        this.initSignatureCanvas('a');
        this.initSignatureCanvas('b');
        this.initSketchCanvas();
      }, 0);
    }
  }

  // =============================================
  // CROQUIS
  // =============================================

  initSketchCanvas(): void {
    const canvas = this.sketchCanvasRef?.nativeElement;
    if (!canvas) return;
    canvas.width  = 900;
    canvas.height = 500;
    this.ctx = canvas.getContext('2d')!;
    this.drawGrid();
  }

  drawGrid(): void {
    const canvas = this.sketchCanvasRef.nativeElement;
    const ctx = this.ctx;
    const w = canvas.width, h = canvas.height;

    // Fond papier
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Grille (style constat papier)
    ctx.strokeStyle = '#b8ccd8';
    ctx.lineWidth = 0.5;
    const step = 26;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Trottoirs
    ctx.fillStyle = '#d4dde5';
    ctx.fillRect(0,       0,       w,         h/2 - 46);
    ctx.fillRect(0,       h/2+46,  w,         h-(h/2+46));
    ctx.fillRect(0,       0,       w/2 - 46,  h);
    ctx.fillRect(w/2+46,  0,       w-(w/2+46),h);

    // Routes
    ctx.fillStyle = '#e8eef3';
    ctx.fillRect(0,       h/2-46,  w,  92);
    ctx.fillRect(w/2-46,  0,       92, h);

    // Centre
    ctx.fillStyle = '#d4dde5';
    ctx.fillRect(w/2-46, h/2-46, 92, 92);

    // Bords route
    ctx.strokeStyle = '#8fa0ae';
    ctx.lineWidth = 1.5;
    const segs = [
      [0, h/2-46, w/2-46, h/2-46], [w/2+46, h/2-46, w, h/2-46],
      [0, h/2+46, w/2-46, h/2+46], [w/2+46, h/2+46, w, h/2+46],
      [w/2-46, 0, w/2-46, h/2-46], [w/2+46, 0, w/2+46, h/2-46],
      [w/2-46, h/2+46, w/2-46, h], [w/2+46, h/2+46, w/2+46, h]
    ];
    segs.forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });

    // Lignes centrales jaunes
    ctx.strokeStyle = '#d4970a';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([14, 12]);
    [[0, h/2, w/2-46, h/2], [w/2+46, h/2, w, h/2],
     [w/2, 0, w/2, h/2-46], [w/2, h/2+46, w/2, h]]
    .forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });
    ctx.setLineDash([]);

    // Passages piétons
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(w/2-46 + i*10, h/2-58, 7, 12);
      ctx.fillRect(w/2-46 + i*10, h/2+46, 7, 12);
      ctx.fillRect(w/2-58, h/2-46 + i*10, 12, 7);
      ctx.fillRect(w/2+46, h/2-46 + i*10, 12, 7);
    }

    // Label officiel
    ctx.fillStyle = '#4a5568';
    ctx.font = '600 12px sans-serif';
    ctx.fillText('13   croquis de l\'accident', 14, 16);
  }

  setTool(tool: string): void { this.selectedTool = tool; }
clearCanvas(): void {
    this.cars = []; 
    this.pedestrians = []; 
    this.impacts = [];
    this.signs = []; 
    this.drawGrid(); 
    this.sketchBase64 = null;
}

  private getXY(e: MouseEvent) {
    const canvas = this.sketchCanvasRef.nativeElement;
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width  / r.width),
      y: (e.clientY - r.top)  * (canvas.height / r.height)
    };
  }

  startDraw(e: MouseEvent): void {
    this.drawing = true;
    const { x, y } = this.getXY(e);
    this.lastX = x; this.lastY = y;
    const c = this.sketchCanvasRef.nativeElement;
    this.snapshot = this.ctx.getImageData(0, 0, c.width, c.height);
    if (this.selectedTool === 'pen' || this.selectedTool === 'eraser') {
      this.ctx.beginPath(); this.ctx.moveTo(x, y);
    }
  }

  draw(e: MouseEvent): void {
    if (!this.drawing) return;
    const { x, y } = this.getXY(e);
    const ctx = this.ctx;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    if (this.selectedTool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = this.lineWidth * 3;
      ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y);
    } else if (this.selectedTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = this.drawColor;
      ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y);
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.putImageData(this.snapshot!, 0, 0);
      ctx.strokeStyle = this.drawColor;
      ctx.fillStyle   = this.drawColor;
      ctx.beginPath();
      if (this.selectedTool === 'line') {
        ctx.moveTo(this.lastX, this.lastY); ctx.lineTo(x, y); ctx.stroke();
      } else if (this.selectedTool === 'rect') {
        ctx.strokeRect(this.lastX, this.lastY, x - this.lastX, y - this.lastY);
      } else if (this.selectedTool === 'arrow') {
        this.drawArrow(ctx, this.lastX, this.lastY, x, y);
      }
    }
  }

  endDraw(): void {
  if (!this.drawing) return;
  this.drawing = false;
  this.captureFullSketch();
}

captureFullSketch(): void {
  const canvas = this.sketchCanvasRef.nativeElement;
  const area = canvas.parentElement!; // .sketch-area
  
  // Créer un canvas temporaire de même taille
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  
  // Copier le canvas principal
  tempCtx.drawImage(canvas, 0, 0);
  
  const scaleX = canvas.width  / area.offsetWidth;
  const scaleY = canvas.height / area.offsetHeight;
  
  // Dessiner les véhicules
  this.cars.forEach(car => {
    tempCtx.save();
    const cx = car.x * scaleX + 30;
    const cy = car.y * scaleY + 14;
    tempCtx.translate(cx, cy);
    tempCtx.rotate((car.rotation * Math.PI) / 180);
    
    const colorMap: any = { A: '#1d4ed8', B: '#15803d', moto: '#7c3aed' };
    const bgMap:    any = { A: '#dbeafe', B: '#dcfce7', moto: '#ede9fe' };
    
    // Fond pill
    tempCtx.fillStyle = bgMap[car.type];
    tempCtx.strokeStyle = colorMap[car.type];
    tempCtx.lineWidth = 2;
    this.roundRect(tempCtx, -30, -12, 60, 24, 12);
    tempCtx.fill(); tempCtx.stroke();
    
    // Texte
    tempCtx.fillStyle = colorMap[car.type];
    tempCtx.font = 'bold 11px sans-serif';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(car.label, 0, 0);
    tempCtx.restore();
  });
  
  // Dessiner les piétons
  this.pedestrians.forEach(ped => {
    tempCtx.save();
    const cx = ped.x * scaleX + 24;
    const cy = ped.y * scaleY + 12;
    tempCtx.translate(cx, cy);
    tempCtx.rotate(((ped.rotation || 0) * Math.PI) / 180);
    
    tempCtx.fillStyle = '#fef3c7';
    tempCtx.strokeStyle = '#b45309';
    tempCtx.lineWidth = 2;
    this.roundRect(tempCtx, -24, -12, 48, 24, 12);
    tempCtx.fill(); tempCtx.stroke();
    
    tempCtx.fillStyle = '#b45309';
    tempCtx.font = 'bold 11px sans-serif';
    tempCtx.textAlign = 'center';
    tempCtx.textBaseline = 'middle';
    tempCtx.fillText(ped.label, 0, 0);
    tempCtx.restore();
  });
  
  // Dessiner les impacts
  this.impacts.forEach(imp => {
    tempCtx.save();
    const cx = imp.x * scaleX + 6;
    const cy = imp.y * scaleY + 6;
    
    // Carré rouge
    tempCtx.fillStyle = '#dc2626';
    tempCtx.strokeStyle = '#991b1b';
    tempCtx.lineWidth = 1.5;
    this.roundRect(tempCtx, cx - 8, cy - 8, 16, 16, 3);
    tempCtx.fill(); tempCtx.stroke();
    
    // Croix
    tempCtx.strokeStyle = '#fff';
    tempCtx.lineWidth = 2;
    tempCtx.beginPath();
    tempCtx.moveTo(cx - 4, cy); tempCtx.lineTo(cx + 4, cy);
    tempCtx.moveTo(cx, cy - 4); tempCtx.lineTo(cx, cy + 4);
    tempCtx.stroke();
    tempCtx.restore();
  });


// Dessiner les panneaux de signalisation
const area2 = canvas.parentElement!;
const scaleX2 = canvas.width  / area2.offsetWidth;
const scaleY2 = canvas.height / area2.offsetHeight;

this.signs.forEach(sign => {
    tempCtx.save();
    const cx = sign.x * scaleX2 + 22;
    const cy = sign.y * scaleY2 + 22;
    tempCtx.translate(cx, cy);
    tempCtx.rotate(((sign.rotation || 0) * Math.PI) / 180);

    if (sign.type === 'stop') {
        // Octogone rouge
        tempCtx.fillStyle = '#dc2626';
        tempCtx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4 - Math.PI / 8;
            const r = 20;
            i === 0 ? tempCtx.moveTo(r * Math.cos(angle), r * Math.sin(angle))
                    : tempCtx.lineTo(r * Math.cos(angle), r * Math.sin(angle));
        }
        tempCtx.closePath();
        tempCtx.fill();
        tempCtx.fillStyle = 'white';
        tempCtx.font = 'bold 9px Arial';
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText('STOP', 0, 0);

    } else if (sign.type === 'roundabout') {
        // Cercle bleu
        tempCtx.fillStyle = '#2563eb';
        tempCtx.beginPath();
        tempCtx.arc(0, 0, 20, 0, Math.PI * 2);
        tempCtx.fill();
        tempCtx.strokeStyle = 'white';
        tempCtx.lineWidth = 2;
        tempCtx.stroke();
        tempCtx.fillStyle = 'white';
        tempCtx.font = '16px Arial';
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText('↺', 0, 1);

    } else if (sign.type === 'traffic-light') {
        // Rectangle noir
        tempCtx.fillStyle = '#1a1a1a';
        this.roundRect(tempCtx, -12, -22, 24, 44, 4);
        tempCtx.fill();
        // Feux
        [['#ef4444', -12], ['#eab308', 0], ['#22c55e', 12]].forEach(([color, y]) => {
            tempCtx.fillStyle = color as string;
            tempCtx.beginPath();
            tempCtx.arc(0, y as number, 7, 0, Math.PI * 2);
            tempCtx.fill();
        });

    } else if (sign.type === 'priority') {
        // Triangle jaune
        tempCtx.fillStyle = '#f59e0b';
        tempCtx.beginPath();
        tempCtx.moveTo(0, -22);
        tempCtx.lineTo(22, 18);
        tempCtx.lineTo(-22, 18);
        tempCtx.closePath();
        tempCtx.fill();
        tempCtx.strokeStyle = 'white';
        tempCtx.lineWidth = 2;
        tempCtx.stroke();
        tempCtx.fillStyle = 'white';
        tempCtx.font = 'bold 14px Arial';
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText('!', 0, 4);

    } else if (sign.type === 'no-entry') {
        // Cercle rouge avec barre
        tempCtx.fillStyle = '#dc2626';
        tempCtx.beginPath();
        tempCtx.arc(0, 0, 20, 0, Math.PI * 2);
        tempCtx.fill();
        tempCtx.strokeStyle = 'white';
        tempCtx.lineWidth = 2;
        tempCtx.stroke();
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(-13, -4, 26, 8);
    }

    tempCtx.restore();
});

  this.sketchBase64 = tempCanvas.toDataURL('image/png');
}

private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, 
                  w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

  signs: { type: string; label: string; x: number; y: number; rotation?: number }[] = [];

 addSign(type: string, label: string) {
    this.signs.push({ type, label, x: 80, y: 80, rotation: 0 });
}

exportSketchWithOverlays(): string {
    const canvas = this.sketchCanvasRef.nativeElement; 
    const ctx = canvas.getContext('2d')!;
    
    this.signs.forEach(sign => {
        ctx.save();
        ctx.translate(sign.x + 30, sign.y + 15);
        ctx.rotate((sign.rotation || 0) * Math.PI / 180);
        
        const colors: any = {
            'stop': '#dc2626', 'roundabout': '#2563eb',
            'traffic-light': '#1a1a1a', 'priority': '#f59e0b', 'no-entry': '#7c3aed'
        };
        ctx.fillStyle = colors[sign.type] || '#333';
        ctx.fillRect(-30, -15, 60, 22);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(sign.label, 0, 0);
        ctx.restore();
    });
    
    return canvas.toDataURL('image/png');
}

  startDrawTouch(e: TouchEvent): void { e.preventDefault(); this.startDraw(e.touches[0] as any); }
  drawTouch(e: TouchEvent): void      { e.preventDefault(); this.draw(e.touches[0] as any); }

  private drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
    const angle = Math.atan2(y2-y1, x2-x1), hl = 18, ha = Math.PI/6;
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl*Math.cos(angle-ha), y2 - hl*Math.sin(angle-ha));
    ctx.lineTo(x2 - hl*Math.cos(angle+ha), y2 - hl*Math.sin(angle+ha));
    ctx.closePath(); ctx.fill();
  }

 addVehicle(type: 'A'|'B'|'moto', label: string): void {
  const c = this.sketchCanvasRef.nativeElement;
  this.cars.push({ 
    x: c.offsetWidth/2 + (Math.random()-.5)*120, 
    y: c.offsetHeight/2 + (Math.random()-.5)*80, 
    type, label, rotation: 0 
  });
}

addPedestrian(): void {
  const c = this.sketchCanvasRef.nativeElement;
  this.pedestrians.push({ 
    x: c.offsetWidth/2+(Math.random()-.5)*80, 
    y: c.offsetHeight/2+(Math.random()-.5)*60, 
    label: 'Piéton', rotation: 0 
  });
}

addImpact(): void {
  const c = this.sketchCanvasRef.nativeElement;
  this.impacts.push({ x: c.offsetWidth/2, y: c.offsetHeight/2 });
}
  startDrag(e: MouseEvent, item: any): void {
  if (e.button === 2) return; // clic droit géré par rotateItem
  e.preventDefault();
  this.draggedItem = item;
  this.dragOffsetX = e.clientX - item.x;
  this.dragOffsetY = e.clientY - item.y;
  window.addEventListener('mousemove', this.onDragMove);
  window.addEventListener('mouseup', this.stopDrag);
}

onDragMove = (e: MouseEvent): void => {
  if (!this.draggedItem) return;
  this.draggedItem.x = e.clientX - this.dragOffsetX;
  this.draggedItem.y = e.clientY - this.dragOffsetY;
};

rotateItem(e: MouseEvent, item: any): void {
  e.preventDefault();
  e.stopPropagation();
  item.rotation = ((item.rotation || 0) + 45) % 360;
}
  stopDrag = (): void => {
    this.draggedItem = null;
    window.removeEventListener('mousemove', this.onDragMove);
    window.removeEventListener('mouseup',   this.stopDrag);
    this.captureFullSketch(); // ← ajouter cette ligne

  };

  // =============================================
  // PHOTOS
  // =============================================

  initPhotoSlots(): void {
    const grid = document.getElementById('photos-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const slot = document.createElement('div');
      slot.className = 'photo-item';
      slot.textContent = `+ Ajouter photo ${i+1}`;
      slot.addEventListener('click', () => this.uploadPhoto(i));
      grid.appendChild(slot);
    }
  }

  uploadPhoto(idx: number): void {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        const url = ev.target.result;
        this.uploadedPhotos[idx] = url;
        const slot = document.getElementById('photos-grid')?.children[idx] as HTMLElement;
        if (slot) { slot.classList.add('has-photo'); slot.innerHTML = `<img src="${url}" alt="photo">`; }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  // =============================================
  // TABS
  // =============================================

  switchTab(tab: string): void {
    ['constat-tab','damage-tab','dashboard-tab'].forEach(id => document.getElementById(id)?.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const map: {[k:string]:number} = { constat:0, damage:1, dashboard:2 };
    document.getElementById(`${tab}-tab`)?.classList.add('active');
    document.querySelectorAll('.tab-btn')[map[tab]]?.classList.add('active');
  }

  // =============================================
  // DOMMAGES
  // =============================================

  setDamageType(type: string, e?: Event): void {
    this.currentDamageType = type;
    if (e?.target) {
      document.querySelectorAll('.damage-btn').forEach(b => b.classList.remove('active'));
      (e.target as HTMLElement).classList.add('active');
    }
  }  
   selectedDriver: 'A' | 'B' = 'A';
damagesA: any[] = [];
damagesB: any[] = [];

selectDriver(driver: 'A' | 'B'): void {
    this.selectedDriver = driver;
}
  

addDamage(): void {
    if (!this.selectedPart) { alert('Sélectionnez une pièce.'); return; }
    if (!this.currentDamageType) { alert('Sélectionnez un type de dommage.'); return; }
    const desc = (document.getElementById('damage-desc') as HTMLTextAreaElement)?.value;
    if (!desc) { alert('Entrez une description.'); return; }
    const cost = (document.getElementById('damage-cost') as HTMLInputElement)?.value;

    const damage = {
        part: this.selectedPart.name,
        type: this.currentDamageType,
        description: desc,
        cost: cost || 0,
        driver: this.selectedDriver,
        timestamp: new Date().toLocaleString()
    };

    if (this.selectedDriver === 'A') this.damagesA.push(damage);
    else this.damagesB.push(damage);
    this.damages = [...this.damagesA, ...this.damagesB];

    const z = this.partToZoneId[this.selectedPart.name];
    if (z !== undefined && !this.damagedZones.includes(z)) this.damagedZones.push(z);

    this.updateDamageList();
    (document.getElementById('damage-desc') as HTMLTextAreaElement).value = '';
    (document.getElementById('damage-cost') as HTMLInputElement).value = '';
}

updateDamageList(): void {
    this.renderDamageList('a', this.damagesA);
    this.renderDamageList('b', this.damagesB);
}

private renderDamageList(driver: 'a' | 'b', damages: any[]): void {
    const list = document.getElementById(`damage-list-${driver}`);
    if (!list) return;
    list.innerHTML = '';

    if (damages.length === 0) {
        list.innerHTML = '<p style="color:#94a3b8;font-size:12px;padding:8px;">Aucun dommage signalé</p>';
        return;
    }

    damages.forEach((d, i) => {
        const el = document.createElement('div');
        el.className = 'damage-entry';
        el.innerHTML = `
            <div class="damage-item-content">
                <strong>${d.part}</strong> — ${d.type}<br>
                <span style="color:#64748b">${d.description}</span><br>
                Coût : <strong>${d.cost} TND</strong>
            </div>
            <button class="damage-item-remove" data-driver="${driver}" data-index="${i}">×</button>
        `;
        list.appendChild(el);
    });

    list.querySelectorAll('.damage-item-remove').forEach(b => {
        b.addEventListener('click', (e) => {
            const btn = e.target as HTMLElement;
            const d = btn.getAttribute('data-driver') as 'a' | 'b';
            const i = parseInt(btn.getAttribute('data-index') || '0', 10);
            if (d === 'a') this.damagesA.splice(i, 1);
            else this.damagesB.splice(i, 1);
            this.damages = [...this.damagesA, ...this.damagesB];
            this.rebuildDamagedZones();
            this.updateDamageList();
        });
    });
}

private rebuildDamagedZones(): void {
    this.damagedZones = [];
    this.damages.forEach(d => {
        const z = this.partToZoneId[d.part];
        if (z !== undefined && !this.damagedZones.includes(z)) this.damagedZones.push(z);
    });
}

  // =============================================
  // CIRCONSTANCES
  // =============================================

  toggleCircumstance(driver: 'A'|'B', code: string, e: Event): void {
    const arr = driver==='A' ? this.circumstancesA : this.circumstancesB;
    const checked = (e.target as HTMLInputElement).checked;
    if (checked) arr.push(code);
    else { const i = arr.indexOf(code); if (i>-1) arr.splice(i,1); }
  }

  // =============================================
  // CONSTAT
  // =============================================

 getConstatData(): any {
  console.log('Sketch base64 length:', this.sketchBase64?.length ?? 'NULL'); // ← ajoute ça
  const g  = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value;
  const gc = (id: string) => (document.getElementById(id) as HTMLInputElement)?.checked;
  let t = g('accidentTime'); if (t?.length===5) t += ':00';
  return {
    accidentDate: g('accidentDate'), time: t, location: g('accidentLocation'),
    injuries: gc('chk-injuries'), propertyDamage: gc('chk-damage'),
    observations: (document.getElementById('observations') as HTMLTextAreaElement)?.value,
    status: 'EN_ATTENTE', sketch: this.sketchBase64,
    damagedZones: this.damagedZones, damages: this.damages,
    drivers: [
      { driverType:'DRIVER_A', name:g('a-name'), cin:g('a-cin'), address:g('a-address'), phoneNumber:g('a-phone'), licenseNumber:g('a-license'), insuranceCompany:g('a-insurance'), policyNumber:g('a-policy'), licensePlate:g('a-plate'), carMake:g('a-car'), signature:this.signatureA, circumstances:this.circumstancesA },
      { driverType:'DRIVER_B', name:g('b-name'), cin:g('b-cin'), address:g('b-address'), phoneNumber:g('b-phone'), licenseNumber:g('b-license'), insuranceCompany:g('b-insurance'), policyNumber:g('b-policy'), licensePlate:g('b-plate'), carMake:g('b-car'), signature:this.signatureB, circumstances:this.circumstancesB }
    ],
    photos: this.uploadedPhotos.filter(p=>p).map(p=>({url:p}))
  };
}
submitConstat(): void {
  this.captureFullSketch(); // force la capture avec labels
  
  setTimeout(() => { // laisser le temps au canvas de se mettre à jour
    this.accidentService.submitConstat(this.getConstatData()).subscribe({
      next: (r) => { this.currentAccidentId = r.id; alert('Constat soumis ! ID = '+r.id); },
      error: (e) => { console.error(e); alert('Erreur soumission constat.'); }
    });
  }, 100);

  }

  submitDamageReport(): void {
    if (!this.damages.length) { alert('Aucun dommage.'); return; }
    if (!this.currentAccidentId) { alert("Soumettez d'abord le constat."); return; }
    const total = this.damages.reduce((s, d) => s + parseFloat(d.cost || 0), 0);
    this.accidentService.submitDamageReport(this.currentAccidentId, this.damages).subscribe({
        next: () => alert(`Rapport soumis (A: ${this.damagesA.length}, B: ${this.damagesB.length} dommages, total: ${total} TND).`),
        error: (e) => { console.error(e); alert('Erreur soumission rapport.'); }
    });
}

  downloadPdf(id: number): void {
    const url = `http://localhost:8082/SalamaInsurance/api/accidents/${id}/pdf`;
    this.accidentService.validateAccident(id).subscribe({ next:()=>window.open(url,'_blank'), error:()=>window.open(url,'_blank') });
  }

  // =============================================
  // SIGNATURES
  // =============================================

  initSignatureCanvas(driver: 'a'|'b'): void {
    const canvas = document.getElementById(`signature-canvas-${driver}`) as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle='#1e40af'; ctx.lineWidth=2; ctx.lineCap='round';
    let drawing = false;
    canvas.addEventListener('mousedown', (e) => {
      drawing=true; ctx.beginPath();
      const r=canvas.getBoundingClientRect();
      ctx.moveTo(e.clientX-r.left, e.clientY-r.top);
    });
    canvas.addEventListener('mousemove', (e) => {
      if (!drawing) return;
      const r=canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX-r.left, e.clientY-r.top); ctx.stroke();
    });
    canvas.addEventListener('mouseup',    () => { drawing=false; if(driver==='a') this.signatureA=canvas.toDataURL(); else this.signatureB=canvas.toDataURL(); });
    canvas.addEventListener('mouseleave', () => { drawing=false; });
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); drawing=true; ctx.beginPath(); const r=canvas.getBoundingClientRect(); ctx.moveTo(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top); });
    canvas.addEventListener('touchmove',  (e) => { e.preventDefault(); if(!drawing)return; const r=canvas.getBoundingClientRect(); ctx.lineTo(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top); ctx.stroke(); });
    canvas.addEventListener('touchend',   () => { drawing=false; if(driver==='a') this.signatureA=canvas.toDataURL(); else this.signatureB=canvas.toDataURL(); });
  }

  clearSignature(driver: 'a'|'b'): void {
    const canvas = document.getElementById(`signature-canvas-${driver}`) as HTMLCanvasElement;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0,0,canvas.width,canvas.height);
    if (driver==='a') this.signatureA=null; else this.signatureB=null;
  }

  // =============================================
  // THREE.JS
  // =============================================

  private initThreeJS(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const container = this.carViewerRef?.nativeElement;
    if (!container) return;
    const width=container.clientWidth, height=340;
    if (width===0) { setTimeout(()=>this.initThreeJS(),200); return; }

    this.scene=new THREE.Scene(); this.scene.background=new THREE.Color(0x0a0a1a);
    this.camera=new THREE.PerspectiveCamera(45,width/height,0.1,1000);
    this.camera.position.set(5,2,5);
    this.renderer=new THREE.WebGLRenderer({antialias:true});
    this.renderer.setSize(width,height); this.renderer.shadowMap.enabled=true;
    container.appendChild(this.renderer.domElement);

    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.enableDamping=true; this.controls.maxPolarAngle=Math.PI/2;

    this.scene.add(new THREE.AmbientLight(0x404060));
    const dl=new THREE.DirectionalLight(0xffffff,1); dl.position.set(5,10,7); dl.castShadow=true; this.scene.add(dl);
    const gh=new THREE.GridHelper(10,20,0x4466ff,0x223366); gh.position.y=-0.5; this.scene.add(gh);

    this.carGroup=new THREE.Group();
    const add=(geo:THREE.BufferGeometry,mat:THREE.Material,x:number,y:number,z:number,name:string)=>{
      const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.userData={name}; m.castShadow=true; this.carGroup.add(m);
    };
    add(new THREE.BoxGeometry(2,.5,4),   new THREE.MeshStandardMaterial({color:0x3366ff,metalness:.3}), 0,.25,0,   'Carrosserie');
    add(new THREE.BoxGeometry(1.2,.4,1.5),new THREE.MeshStandardMaterial({color:0x2255dd}),             0,.7,-.2,  'Toit');
    add(new THREE.BoxGeometry(1.6,.3,1), new THREE.MeshStandardMaterial({color:0x3366ff}),              0,.4,1.5,  'Capot');
    add(new THREE.BoxGeometry(1.6,.3,1), new THREE.MeshStandardMaterial({color:0x3366ff}),              0,.4,-1.5, 'Coffre');
    const bm=new THREE.MeshStandardMaterial({color:0xcccccc});
    add(new THREE.BoxGeometry(1.8,.2,.3),bm,0,.2,2,  'Pare-chocs avant');
    add(new THREE.BoxGeometry(1.8,.2,.3),bm,0,.2,-2, 'Pare-chocs arrière');
    [[1,.2,1.2,'Roue 1 Droit'],[- 1,.2,1.2,'Roue 2 Gauche'],[1,.2,-1.2,'Roue 3 Droit'],[-1,.2,-1.2,'Roue 4 Gauche']]
    .forEach(([x,y,z,n]:any)=>{
      const t=new THREE.Mesh(new THREE.CylinderGeometry(.4,.4,.3,32),new THREE.MeshStandardMaterial({color:0x222222}));
      t.rotation.z=Math.PI/2; t.position.set(x,y,z); t.userData={name:n}; this.carGroup.add(t);
    });
    const lg=new THREE.SphereGeometry(.15,16);
    const hm=new THREE.MeshStandardMaterial({color:0xffffaa,emissive:0x442200});
    const tm=new THREE.MeshStandardMaterial({color:0xff4444,emissive:0x220000});
    [[-.8,.4,2,'Phare gauche',hm],[.8,.4,2,'Phare droit',hm],[-.8,.4,-2,'Feu arrière gauche',tm],[.8,.4,-2,'Feu arrière droit',tm]]
    .forEach(([x,y,z,n,mat]:any)=>{ const m=new THREE.Mesh(lg,mat); m.position.set(x,y,z); m.userData={name:n}; this.carGroup.add(m); });
    this.scene.add(this.carGroup);

    const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
    this.renderer.domElement.addEventListener('click',(e)=>{
      const r=this.renderer.domElement.getBoundingClientRect();
      mouse.x=((e.clientX-r.left)/r.width)*2-1; mouse.y=-((e.clientY-r.top)/r.height)*2+1;
      ray.setFromCamera(mouse,this.camera);
      const hits=ray.intersectObjects(this.carGroup.children,true);
      if (hits.length) {
        const hit=hits[0].object as THREE.Mesh;
        if (this.selectedObject) (this.selectedObject.material as THREE.MeshStandardMaterial).emissive?.setHex(0);
        (hit.material as THREE.MeshStandardMaterial).emissive=new THREE.Color(0x444444);
        this.selectedObject=hit; this.selectedPart=hit.userData;
        const el=document.getElementById('selected-part'); if(el) el.textContent=hit.userData['name']||'Pièce';
      }
    });
    const animate=()=>{ requestAnimationFrame(animate); this.controls.update(); this.renderer.render(this.scene,this.camera); };
    animate();
    window.addEventListener('resize',()=>{ const nw=container.clientWidth; this.camera.aspect=nw/height; this.camera.updateProjectionMatrix(); this.renderer.setSize(nw,height); });
  }

  // =============================================
  // DASHBOARD
  // =============================================

  loadDashboard(): void {
    this.switchTab('dashboard');
    if (!this.statsLoaded) {
        this.accidentService.getStats().subscribe({
            next: (data: any) => { 
                this.stats = data; 
                this.statsLoaded = true; 
                setTimeout(() => this.renderCharts(), 150); 
            },
            error: () => {
                this.stats = { totalAccidents:0,enAttente:0,valide:0,rejete:0,
                    parMois:{},parCirconstance:{},
                    percentResponsableA:0,percentResponsableB:0,percentPartage:0 };
                this.statsLoaded = true; 
                setTimeout(() => this.renderCharts(), 150);
            }
        });
    }

    // Charger les constats + rafraîchissement auto toutes les 30s
    this.refreshConstats();
    setInterval(() => this.refreshConstats(), 30000);
}

refreshConstats(): void {
    this.accidentService.getRecentConstats().subscribe({
        next: (data: any[]) => { 
            const oldCount = this.recentConstats.filter(c => c.status === 'EN_ATTENTE').length;
            this.recentConstats = data;
            const newCount = data.filter(c => c.status === 'EN_ATTENTE').length;

            // Notification sonore si nouveau constat
            if (newCount > oldCount) {
                this.playNotificationSound();
            }
        },
        error: () => { this.recentConstats = []; }
    });
}

playNotificationSound(): void {
    try {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
    } catch (e) {
        console.log('Son non disponible');
    }
}

  renderCharts(): void {
    [this.monthlyChart,this.donutChart,this.typeChart,this.circChart].forEach(c=>c?.destroy());
    this.renderMonthlyChart(); this.renderDonutChart(); this.renderTypeChart(); this.renderCircumstancesChart();
  }

  renderMonthlyChart(): void {
    const canvas=document.getElementById('chart-monthly') as HTMLCanvasElement;
    if (!canvas||!this.stats) return;
    const labels=this.stats.parMois?Object.keys(this.stats.parMois):['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû'];
    this.monthlyChart=new (window as any).Chart(canvas,{type:'bar',data:{labels,datasets:[{label:'Accidents',data:this.stats.parMois?Object.values(this.stats.parMois):[],backgroundColor:'#B5D4F4',borderColor:'#378ADD',borderWidth:1.5,borderRadius:5,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{color:'#94a3b8',font:{size:11}}},y:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{color:'#94a3b8',font:{size:11},stepSize:1},beginAtZero:true}}}});
  }

  renderDonutChart(): void {
    const canvas=document.getElementById('chart-donut') as HTMLCanvasElement;
    if (!canvas||!this.stats) return;
    this.donutChart=new (window as any).Chart(canvas,{type:'doughnut',data:{labels:['Validés','En attente','Rejetés'],datasets:[{data:[this.stats.valide,this.stats.enAttente,this.stats.rejete],backgroundColor:['#378ADD','#EF9F27','#E24B4A'],borderWidth:0,hoverOffset:6}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{display:false}}}});
  }

  renderTypeChart(): void {
    const canvas=document.getElementById('chart-type') as HTMLCanvasElement;
    if (!canvas) return;
    this.typeChart=new (window as any).Chart(canvas,{type:'line',data:{labels:['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû'],datasets:[{label:'Blessés',data:[0,0,0,1,0,0,0,0],borderColor:'#E24B4A',backgroundColor:'rgba(226,75,74,0.08)',fill:true,tension:0.4,pointRadius:3,borderWidth:2},{label:'Matériels',data:[0,0,1,3,0,0,0,0],borderColor:'#378ADD',backgroundColor:'rgba(55,138,221,0.08)',fill:true,tension:0.4,pointRadius:3,borderWidth:2,borderDash:[5,3]}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{color:'#94a3b8',font:{size:11}}},y:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{color:'#94a3b8',font:{size:11},stepSize:1},beginAtZero:true}}}});
  }

  renderCircumstancesChart(): void {
    const canvas=document.getElementById('chart-circumstances') as HTMLCanvasElement;
    if (!canvas||!this.stats) return;
    const raw=this.stats.parCirconstance||{};
    this.circChart=new (window as any).Chart(canvas,{type:'bar',indexAxis:'y',data:{labels:Object.keys(raw).map((k:string)=>k.replace(/_/g,' ')),datasets:[{label:'Occurrences',data:Object.values(raw) as number[],backgroundColor:['#185FA5','#378ADD','#85B7EB','#B5D4F4','#E6F1FB'],borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{color:'#94a3b8',font:{size:11}},beginAtZero:true},y:{grid:{display:false},ticks:{color:'#64748b',font:{size:12}}}}}});
  }

  selectedConstat: any = null;

viewConstat(c: any): void {
    this.selectedConstat = c;
}

closeConstat(): void {
    this.selectedConstat = null;
}

rejeterConstat(id: number): void {
    if (!confirm('Confirmer le rejet de ce constat ?')) return;
    this.accidentService.rejeterAccident(id).subscribe({
        next: () => {
            const c = this.recentConstats.find((x: any) => x.id === id);
            if (c) c.status = 'REJETE';
            if (this.selectedConstat?.id === id) this.selectedConstat.status = 'REJETE';
        },
        error: () => alert('Erreur lors du rejet.')
    });
}
searchConstat = '';

get filteredConstats(): any[] {
    if (!this.searchConstat.trim()) return this.recentConstats;
    const q = this.searchConstat.toLowerCase();
    return this.recentConstats.filter(c =>
        String(c.id).includes(q) ||
        (c.location?.toLowerCase().includes(q)) ||
        (c.driverAName?.toLowerCase().includes(q)) ||
        (c.driverBName?.toLowerCase().includes(q)) ||
        (c.accidentDate?.includes(q))
    );
}

// =============================================
// DASHBOARD ADMIN — AMÉLIORATIONS
// =============================================

get pendingCount(): number {
    return this.recentConstats.filter(c => c.status === 'EN_ATTENTE').length;
}

get todayDate(): string {
    return new Date().toLocaleDateString('fr-TN', { 
        weekday: 'long', year: 'numeric', 
        month: 'long', day: 'numeric' 
    });
}

validerConstat(id: number): void {
    if (!confirm('Confirmer la validation de ce constat ?')) return;
    this.accidentService.validateAccident(id).subscribe({
        next: () => {
            const c = this.recentConstats.find((x: any) => x.id === id);
            if (c) c.status = 'VALIDE';
            if (this.selectedConstat?.id === id) this.selectedConstat.status = 'VALIDE';
        },
        error: () => alert('Erreur lors de la validation.')
    });
}

telechargerPdf(id: number): void {
    const url = `http://localhost:8082/SalamaInsurance/api/accidents/${id}/pdf`;
    window.open(url, '_blank');
}


}