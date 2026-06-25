import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LayoutMode } from '../../../../core/models/layout-mode.model';
import { CameraStateService } from '../../../../core/services/camera-state.service';
import { LayoutService } from '../../../../core/services/layout.service';

@Component({
  selector: 'app-monitoring-toolbar',
  templateUrl: './monitoring-toolbar.component.html',
  styleUrl: './monitoring-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringToolbarComponent {
  private readonly cameraState = inject(CameraStateService);
  private readonly layoutService = inject(LayoutService);

  readonly layoutMode = this.layoutService.layoutMode;
  readonly onlineTotal = this.cameraState.onlineTotal;
  readonly offlineTotal = this.cameraState.offlineTotal;
  readonly totalCameras = this.cameraState.totalCameras;

  setLayoutMode(mode: LayoutMode): void {
    this.layoutService.setLayoutMode(mode);
  }
}
