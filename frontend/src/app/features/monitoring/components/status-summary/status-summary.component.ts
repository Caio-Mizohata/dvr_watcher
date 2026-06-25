import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { WEBSOCKET_BACKEND_PORT } from '../../../../core/constants/websocket.constants';
import { CameraStateService } from '../../../../core/services/camera-state.service';

interface SummaryCard {
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly tone: 'neutral' | 'success' | 'danger' | 'info';
}

@Component({
  selector: 'app-status-summary',
  templateUrl: './status-summary.component.html',
  styleUrl: './status-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusSummaryComponent {
  private readonly cameraState = inject(CameraStateService);

  readonly summaryCards = computed<readonly SummaryCard[]>(() => [
    {
      label: 'Total de cameras',
      value: this.cameraState.totalCameras().toString(),
      detail: 'malha CCTV local',
      tone: 'neutral',
    },
    {
      label: 'Online',
      value: this.cameraState.onlineTotal().toString(),
      detail: 'streams recebendo frames',
      tone: 'success',
    },
    {
      label: 'Offline',
      value: this.cameraState.offlineTotal().toString(),
      detail: 'sem sinal ativo',
      tone: this.cameraState.offlineTotal() > 0 ? 'danger' : 'neutral',
    },
    {
      label: 'Backend',
      value: `:${WEBSOCKET_BACKEND_PORT}`,
      detail: 'FastAPI WebSocket',
      tone: this.cameraState.backendStatus() === 'online' ? 'success' : 'info',
    },
  ]);
}
