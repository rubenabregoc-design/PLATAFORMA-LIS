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
