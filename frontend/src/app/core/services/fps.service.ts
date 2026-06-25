import { DestroyRef, inject, Injectable, signal } from '@angular/core';

import { DEFAULT_CAMERAS } from '../constants/camera.constants';

function createFrameMap(): Record<string, number> {
  return DEFAULT_CAMERAS.reduce<Record<string, number>>((frames, camera) => {
    frames[camera.id] = 0;
    return frames;
  }, {});
}

@Injectable({ providedIn: 'root' })
export class FpsService {
  private readonly destroyRef = inject(DestroyRef);
  private frameCounts: Record<string, number> = createFrameMap();
  private readonly currentFpsById = signal<Record<string, number>>(createFrameMap());

  readonly fpsById = this.currentFpsById.asReadonly();

  constructor() {
    const intervalId = window.setInterval(() => {
      this.currentFpsById.set(this.frameCounts);
      this.frameCounts = createFrameMap();
    }, 1000);

    this.destroyRef.onDestroy(() => {
      window.clearInterval(intervalId);
    });
  }

  registerFrame(cameraId: string): void {
    this.frameCounts[cameraId] = (this.frameCounts[cameraId] ?? 0) + 1;
  }
}
