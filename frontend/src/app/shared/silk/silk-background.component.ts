import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { Color, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector3, WebGLRenderer, Mesh } from 'three';

function hexToNormalizedRGB(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '').trim();
  return [
    Number.parseInt(cleaned.slice(0, 2), 16) / 255,
    Number.parseInt(cleaned.slice(2, 4), 16) / 255,
    Number.parseInt(cleaned.slice(4, 6), 16) / 255
  ];
}

const vertexShader = `
varying vec2 vUv;
varying vec3 vPosition;

void main() {
  vPosition = position;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform vec3  uColor;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uNoiseIntensity;

const float e = 2.71828182845904523536;

float noise(vec2 texCoord) {
  float G = e;
  vec2  r = (G * sin(G * texCoord));
  return fract(r.x * r.y * (1.0 + texCoord.x));
}

vec2 rotateUvs(vec2 uv, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2  rot = mat2(c, -s, s, c);
  return rot * uv;
}

void main() {
  float rnd        = noise(gl_FragCoord.xy);
  vec2  uv         = rotateUvs(vUv * uScale, uRotation);
  vec2  tex        = uv * uScale;
  float tOffset    = uSpeed * uTime;

  tex.y += 0.03 * sin(8.0 * tex.x - tOffset);

  float pattern = 0.6 +
                  0.4 * sin(5.0 * (tex.x + tex.y +
                                   cos(3.0 * tex.x + 5.0 * tex.y) +
                                   0.02 * tOffset) +
                           sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));

  vec4 col = vec4(uColor, 1.0) * vec4(pattern) - rnd / 15.0 * uNoiseIntensity;
  col.a = 1.0;
  gl_FragColor = col;
}
`;

@Component({
  selector: 'app-silk-background',
  standalone: true,
  template: `<canvas #canvas aria-hidden="true"></canvas>`,
  styleUrl: './silk-background.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SilkBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly zone = new NgZone({ shouldCoalesceEventChangeDetection: true });

  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: OrthographicCamera | null = null;
  private material: ShaderMaterial | null = null;
  private mesh: Mesh | null = null;

  private frameHandle: number | null = null;
  private lastNowMs: number | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private _speed = 5;
  private _scale = 1;
  private _color = '#7B7481';
  private _noiseIntensity = 1.5;
  private _rotation = 0;

  @Input() set speed(value: number) {
    this._speed = Number.isFinite(value) ? value : 5;
    if (this.material) this.material.uniforms['uSpeed'].value = this._speed;
  }
  get speed(): number {
    return this._speed;
  }

  @Input() set scale(value: number) {
    this._scale = Number.isFinite(value) ? value : 1;
    if (this.material) this.material.uniforms['uScale'].value = this._scale;
  }
  get scale(): number {
    return this._scale;
  }

  @Input() set color(value: string) {
    this._color = typeof value === 'string' && value.trim() ? value : '#7B7481';
    if (this.material) {
      const [r, g, b] = hexToNormalizedRGB(this._color);
      (this.material.uniforms['uColor'].value as Vector3).set(r, g, b);
    }
  }
  get color(): string {
    return this._color;
  }

  @Input() set noiseIntensity(value: number) {
    this._noiseIntensity = Number.isFinite(value) ? value : 1.5;
    if (this.material) this.material.uniforms['uNoiseIntensity'].value = this._noiseIntensity;
  }
  get noiseIntensity(): number {
    return this._noiseIntensity;
  }

  @Input() set rotation(value: number) {
    this._rotation = Number.isFinite(value) ? value : 0;
    if (this.material) this.material.uniforms['uRotation'].value = this._rotation;
  }
  get rotation(): number {
    return this._rotation;
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;

    this.zone.runOutsideAngular(() => {
      const renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio ?? 1, 2));

      const scene = new Scene();
      const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
      camera.position.z = 1;

      const [r, g, b] = hexToNormalizedRGB(this._color);
      const uniforms = {
        uSpeed: { value: this._speed },
        uScale: { value: this._scale },
        uNoiseIntensity: { value: this._noiseIntensity },
        uColor: { value: new Vector3(r, g, b) },
        uRotation: { value: this._rotation },
        uTime: { value: 0 }
      };

      const material = new ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader
      });

      const geometry = new PlaneGeometry(2, 2, 1, 1);
      const mesh = new Mesh(geometry, material);
      scene.add(mesh);

      this.renderer = renderer;
      this.scene = scene;
      this.camera = camera;
      this.material = material;
      this.mesh = mesh;

      this.observeResize();
      this.renderFrame(performance.now());
    });
  }

  ngOnDestroy(): void {
    if (this.frameHandle != null) {
      cancelAnimationFrame(this.frameHandle);
      this.frameHandle = null;
    }

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh = null;
    }
    this.material?.dispose();
    this.material = null;

    this.renderer?.dispose();
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }

  private observeResize(): void {
    const canvas = this.canvasRef.nativeElement;
    const host = canvas.parentElement ?? canvas;

    const applySize = () => {
      if (!this.renderer) return;
      const rect = host.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      this.renderer.setSize(width, height, false);
    };

    applySize();
    this.resizeObserver = new ResizeObserver(() => applySize());
    this.resizeObserver.observe(host);
  }

  private renderFrame = (nowMs: number) => {
    if (!this.renderer || !this.scene || !this.camera || !this.material) return;

    const last = this.lastNowMs ?? nowMs;
    const deltaSeconds = Math.min(0.1, Math.max(0, (nowMs - last) / 1000));
    this.lastNowMs = nowMs;

    this.material.uniforms['uTime'].value += 0.1 * deltaSeconds;
    this.renderer.render(this.scene, this.camera);

    this.frameHandle = requestAnimationFrame(this.renderFrame);
  };
}

