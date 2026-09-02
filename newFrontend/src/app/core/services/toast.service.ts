import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastMessage[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  show(type: 'success' | 'warning' | 'error' | 'info', title: string, message: string, durationMs = 4000) {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast: ToastMessage = { id, type, title, message, durationMs };
    
    this.toastsSignal.update(toasts => [...toasts, newToast]);

    if (durationMs > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, durationMs);
    }
  }

  success(title: string, message: string, durationMs = 4000) {
    this.show('success', title, message, durationMs);
  }

  warning(title: string, message: string, durationMs = 5000) {
    this.show('warning', title, message, durationMs);
  }

  error(title: string, message: string, durationMs = 5000) {
    this.show('error', title, message, durationMs);
  }

  info(title: string, message: string, durationMs = 4000) {
    this.show('info', title, message, durationMs);
  }

  dismiss(id: string) {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }
}
