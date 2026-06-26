import { CameraStatus } from './camera-status.model';

export interface CameraDefinition {
  readonly id: string;
  readonly label: string;
  readonly zone: string;
  readonly streamEnabled: boolean;
}

export interface CameraViewModel extends CameraDefinition {
  readonly status: CameraStatus;
  readonly lastFrameAt: Date | null;
}
