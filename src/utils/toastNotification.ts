export interface ToastEventDetail {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const notifyToast = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration = 3500
) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<ToastEventDetail>('lis-global-toast', {
        detail: { message, type, duration }
      })
    );
  }
};

notifyToast.success = (message: string, duration = 3500) => notifyToast(message, 'success', duration);
notifyToast.error = (message: string, duration = 3500) => notifyToast(message, 'error', duration);
notifyToast.warning = (message: string, duration = 3500) => notifyToast(message, 'warning', duration);
notifyToast.info = (message: string, duration = 3500) => notifyToast(message, 'info', duration);
