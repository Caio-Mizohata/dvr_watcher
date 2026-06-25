import { computed, Injectable, signal } from '@angular/core';

import { DEFAULT_CAMERAS } from '../constants/camera.constants';
import { LayoutMode } from '../models/layout-mode.model';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly currentLayoutMode = signal<LayoutMode>('grid-2x2');
  private readonly selectedCameraId = signal(DEFAULT_CAMERAS[0]?.id ?? '1');

  readonly layoutMode = this.currentLayoutMode.asReadonly();
  readonly focusedCameraId = this.selectedCameraId.asReadonly();
  readonly isFocusMode = computed(() => this.layoutMode() === 'focus-1x1');

  setLayoutMode(mode: LayoutMode): void {
    this.currentLayoutMode.set(mode);
  }

  focusCamera(cameraId: string): void {
    this.selectedCameraId.set(cameraId);
  }
}
