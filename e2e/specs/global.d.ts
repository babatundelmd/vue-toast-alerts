import type { Toaster } from '../../src/useToast';

declare global {
  interface Window {
    toast: Toaster;
    toastReady: boolean;
  }
}

export {};
