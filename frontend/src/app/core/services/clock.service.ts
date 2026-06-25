import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly now = signal(new Date());

  readonly time = computed(() => this.formatTime(this.now()));

  constructor() {
    const intervalId = window.setInterval(() => {
      this.now.set(new Date());
    }, 1000);

    this.destroyRef.onDestroy(() => {
      window.clearInterval(intervalId);
    });
  }

  private formatTime(value: Date): string {
    const hours = value.getHours().toString().padStart(2, '0');
    const minutes = value.getMinutes().toString().padStart(2, '0');
    const seconds = value.getSeconds().toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  }
}
