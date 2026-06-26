import { computed, Injectable, signal } from '@angular/core';

import { DEFAULT_CAMERAS } from '../constants/camera.constants';
import { CameraStatus } from '../models/camera-status.model';
import { CameraViewModel } from '../models/camera.model';

function createInitialStatus(): Record<string, CameraStatus> {
  return DEFAULT_CAMERAS.reduce<Record<string, CameraStatus>>((statuses, camera) => {
    statuses[camera.id] = 'offline';
    return statuses;
  }, {});
}

function createInitialLastFrameMap(): Record<string, Date | null> {
  return DEFAULT_CAMERAS.reduce<Record<string, Date | null>>((frames, camera) => {
    frames[camera.id] = null;
    return frames;
  }, {});
}

@Injectable({ providedIn: 'root' })
export class CameraStateService {
  private readonly statusesById = signal<Record<string, CameraStatus>>(createInitialStatus());
  private readonly lastFrameAtById = signal<Record<string, Date | null>>(createInitialLastFrameMap());

  readonly cameras = computed<readonly CameraViewModel[]>(() => {
    const statuses = this.statusesById();
    const lastFrames = this.lastFrameAtById();

    return DEFAULT_CAMERAS.map((camera) => ({
      ...camera,
      status: statuses[camera.id] ?? 'offline',
      lastFrameAt: lastFrames[camera.id] ?? null,
    }));
  });

  readonly totalCameras = computed(() => this.cameras().length);
  readonly onlineTotal = computed(
    () => this.cameras().filter((camera) => camera.status === 'online').length,
  );
  readonly offlineTotal = computed(() => this.totalCameras() - this.onlineTotal());
  readonly backendStatus = computed(() => (this.onlineTotal() > 0 ? 'online' : 'standby'));

  setCameraStatus(cameraId: string, status: CameraStatus): void {
    this.statusesById.update((statuses) => {
      if (statuses[cameraId] === status) {
        return statuses;
      }

      return {
        ...statuses,
        [cameraId]: status,
      };
    });
  }

  setCameraOnline(cameraId: string, online: boolean): void {
    this.setCameraStatus(cameraId, online ? 'online' : 'offline');
  }

  setLastFrameAt(cameraId: string, value: Date): void {
    this.lastFrameAtById.update((frames) => {
      const currentValue = frames[cameraId];

      if (currentValue && value.getTime() - currentValue.getTime() < 1000) {
        return frames;
      }

      return {...frames, [cameraId]: value};
    });
  }
}
