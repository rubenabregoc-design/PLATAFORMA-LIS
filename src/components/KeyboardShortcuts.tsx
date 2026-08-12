import { useEffect } from 'react';
import { useToast } from './Toast';

interface KeyboardShortcutsProps {
  onSearchPatient?: () => void;
  onConfirmOrder?: () => void;
  onSwitchTab?: (tab: string) => void;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onSearchPatient,
  onConfirmOrder,
  onSwitchTab
}) => {
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Search Patient
      if (e.key === 'F1') {
        e.preventDefault();
        onSearchPatient?.();
        toast('Modo Búsqueda Activado (F1)', 'info', 1000);
      }

      // Ctrl + Enter: Confirm Order
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        onConfirmOrder?.();
      }

      // Ctrl + 1, 2, 3: Switch Sub-Tabs
      if (e.ctrlKey && e.key === '1') {
        e.preventDefault();
        onSwitchTab?.('ADMISSION');
      }
      if (e.ctrlKey && e.key === '2') {
        e.preventDefault();
        onSwitchTab?.('MANAGEMENT');
      }
      if (e.ctrlKey && e.key === '3') {
        e.preventDefault();
        onSwitchTab?.('PRINT');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchPatient, onConfirmOrder, onSwitchTab, toast]);

  return null;
};
