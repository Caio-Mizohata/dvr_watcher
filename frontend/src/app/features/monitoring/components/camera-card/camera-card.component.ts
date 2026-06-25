import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { retry, Subscription, throwError, timer } from 'rxjs';

import {
  CAMERA_CANVAS_HEIGHT,
  CAMERA_CANVAS_WIDTH,
} from '../../../../core/constants/camera.constants';
import {
  WEBSOCKET_MAX_RECONNECT_ATTEMPTS,
  WEBSOCKET_MAX_RECONNECT_DELAY_MS,
  WEBSOCKET_RECONNECT_DELAY_MS,
} from '../../../../core/constants/websocket.constants';
import { CameraViewModel } from '../../../../core/models/camera.model';
import { CameraStateService } from '../../../../core/services/camera-state.service';
import {
  CameraStreamError,
  CameraStreamService,
} from '../../../../core/services/camera-stream.service';
import { FpsService } from '../../../../core/services/fps.service';

type CameraCardVariant = 'grid' | 'featured' | 'compact';

interface CameraStreamConfig {
  readonly cameraId: string;
  readonly streamEnabled: boolean;
}

@Component({
  selector: 'app-camera-card',
  templateUrl: './camera-card.component.html',
  styleUrl: './camera-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.online]': 'camera().status === "online"',
    '[class.offline]': 'camera().status === "offline"',
    '[class.focused]': 'isFocused()',
    '[class.compact]': 'variant() === "compact"',
    '[class.featured]': 'variant() === "featured"',
    '[attr.role]': '"button"',
    '[attr.tabindex]': '0',
    '[attr.aria-label]': 'camera().label + " " + camera().zone',
    '(click)': 'selectCamera()',
    '(keydown.enter)': 'selectCamera()',
    '(keydown.space)': 'selectCameraFromKeyboard($event)',
  },
})
export class CameraCardComponent implements AfterViewInit {
  private readonly cameraStream = inject(CameraStreamService);
  private readonly cameraState = inject(CameraStateService);
  private readonly fpsService = inject(FpsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('videoCanvas');
  private readonly canvasReady = signal(false);

  readonly camera = input.required<CameraViewModel>();
  readonly cameraId = input.required<string>();
  readonly streamEnabled = input.required<boolean>();
  readonly fps = input.required<number>();
  readonly variant = input<CameraCardVariant>('grid');
  readonly isFocused = input(false);
  readonly selected = output<string>();
  readonly canvasWidth = CAMERA_CANVAS_WIDTH;
  readonly canvasHeight = CAMERA_CANVAS_HEIGHT;
  readonly statusLabel = computed(() => (this.camera().status === 'online' ? 'Online' : 'Offline'));
  readonly offlineMessage = computed(() =>
    this.camera().streamEnabled ? 'Aguardando frames do WebSocket' : 'Canal nao configurado no backend',
  );
  readonly lastFrameLabel = computed(() => this.formatLastFrame(this.camera().lastFrameAt));
  readonly latencyLabel = computed(() => {
    const fps = this.fps();
    return fps > 0 ? `${Math.max(18, 96 - fps * 3)} ms` : '-- ms';
  });
  private readonly streamConfig = computed<CameraStreamConfig>(
    () => ({
      cameraId: this.cameraId(),
      streamEnabled: this.streamEnabled(),
    }),
    {
      equal: (previous, current) =>
        previous.cameraId === current.cameraId && previous.streamEnabled === current.streamEnabled,
    },
  );

  constructor() {
    const streamEffect = effect((onCleanup) => {
      if (!this.canvasReady()) {
        return;
      }

      const { cameraId, streamEnabled } = this.streamConfig();
      let active = true;
      let renderingFrame = false;
      let subscription: Subscription | null = null;

      if (!streamEnabled) {
        this.cameraState.setCameraOnline(cameraId, false);
        this.drawNoVideo('Canal inativo');
        return;
      }

      this.drawNoVideo('Conectando');
      subscription = this.cameraStream
        .connect(cameraId)
        .pipe(
          retry({
            count: WEBSOCKET_MAX_RECONNECT_ATTEMPTS,
            delay: (error: unknown, retryCount) => {
              if (this.shouldStopRetrying(error)) {
                return throwError(() => error);
              }

              const delayMs = this.getReconnectDelay(retryCount);
              this.markReconnecting(cameraId, retryCount);
              return timer(delayMs);
            },
          }),
        )
        .subscribe({
          next: (frame) => {
            if (renderingFrame) {
              return;
            }

            renderingFrame = true;
            void this.renderFrame(cameraId, frame, () => active).finally(() => {
              renderingFrame = false;
            });
          },
          error: () => {
            this.cameraState.setCameraOnline(cameraId, false);
            this.drawNoVideo('Sem sinal');
          },
          complete: () => {
            this.cameraState.setCameraOnline(cameraId, false);
            this.drawNoVideo('Sem sinal');
          },
        });

      onCleanup(() => {
        active = false;
        subscription?.unsubscribe();
      });
    });

    this.destroyRef.onDestroy(() => {
      streamEffect.destroy();
    });
  }

  ngAfterViewInit(): void {
    this.canvasReady.set(true);
  }

  private async renderFrame(cameraId: string, frame: Blob, isActive: () => boolean): Promise<void> {
    const context = this.getContext();
    const canvas = this.canvas().nativeElement;

    if (!context || !isActive()) {
      return;
    }

    try {
      const bitmap = await createImageBitmap(frame);
      if (!isActive()) {
        bitmap.close();
        return;
      }
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      this.fpsService.registerFrame(cameraId);
      this.cameraState.setCameraOnline(cameraId, true);
      this.cameraState.setLastFrameAt(cameraId, new Date());
    } catch {
      this.cameraState.setCameraOnline(cameraId, false);
      this.drawNoVideo('Sem video');
    }
  }

  private getContext(): CanvasRenderingContext2D | null {
    return this.canvas().nativeElement.getContext('2d');
  }

  private drawNoVideo(message: string): void {
    const context = this.getContext();
    const canvas = this.canvas().nativeElement;

    if (!context) {
      return;
    }

    context.fillStyle = '#050508';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.strokeStyle = 'rgba(71, 85, 105, 0.2)';
    context.lineWidth = 1;

    const step = 40;

    for (let x = 0; x < canvas.width; x += step) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }

    for (let y = 0; y < canvas.height; y += step) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 20;

    context.strokeStyle = '#475569';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(centerX, centerY, 24, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(centerX, centerY - 8, 10, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(centerX - 14, centerY + 16);
    context.quadraticCurveTo(centerX, centerY + 6, centerX + 14, centerY + 16);
    context.stroke();

    context.fillStyle = '#94a3b8';
    context.font = '600 15px "Segoe UI", system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(message, canvas.width / 2, canvas.height / 2 + 30);
  }

  private markReconnecting(cameraId: string, retryCount: number): void {
    this.cameraState.setCameraOnline(cameraId, false);
    this.drawNoVideo(`Reconectando ${retryCount}/${WEBSOCKET_MAX_RECONNECT_ATTEMPTS}`);
  }

  private shouldStopRetrying(error: unknown): boolean {
    return error instanceof CameraStreamError && error.code === 1008;
  }

  private getReconnectDelay(retryCount: number): number {
    return Math.min(
      WEBSOCKET_RECONNECT_DELAY_MS * 2 ** Math.max(0, retryCount - 1),
      WEBSOCKET_MAX_RECONNECT_DELAY_MS,
    );
  }

  selectCamera(): void {
    this.selected.emit(this.camera().id);
  }

  selectCameraFromKeyboard(event: Event): void {
    event.preventDefault();
    this.selectCamera();
  }

  private formatLastFrame(value: Date | null): string {
    if (!value) {
      return 'sem frames';
    }

    return value.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
