import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { CameraViewModel } from '../../../../core/models/camera.model';
import { CameraStateService } from '../../../../core/services/camera-state.service';
import { FpsService } from '../../../../core/services/fps.service';
import { LayoutService } from '../../../../core/services/layout.service';
import { CameraCardComponent } from '../camera-card/camera-card.component';

@Component({
  selector: 'app-camera-grid',
  imports: [CameraCardComponent],
  templateUrl: './camera-grid.component.html',
  styleUrl: './camera-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.is-focus]': 'layoutMode() === "focus-1x1"',
  },
})
export class CameraGridComponent {
  private readonly cameraState = inject(CameraStateService);
  private readonly fpsService = inject(FpsService);
  private readonly layoutService = inject(LayoutService);

  readonly cameras = this.cameraState.cameras;
  readonly fpsById = this.fpsService.fpsById;
  readonly layoutMode = this.layoutService.layoutMode;
  readonly focusedCameraId = this.layoutService.focusedCameraId;
  readonly focusedCamera = computed<CameraViewModel>(() => {
    const fallback = this.cameras()[0];

    if (!fallback) {
      throw new Error('No camera definitions available');
    }

    return this.cameras().find((camera) => camera.id === this.focusedCameraId()) ?? fallback;
  });
  readonly secondaryCameras = computed<readonly CameraViewModel[]>(() =>
    this.cameras().filter((camera) => camera.id !== this.focusedCameraId()),
  );

  focusCamera(cameraId: string): void {
    this.layoutService.focusCamera(cameraId);
  }
}
