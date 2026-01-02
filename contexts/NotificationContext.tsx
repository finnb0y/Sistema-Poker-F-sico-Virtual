import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import Notification, { NotificationProps } from '../components/Notification';
import ConfirmDialog, { ConfirmDialogProps } from '../components/ConfirmDialog';

// Constants for notification positioning
const NOTIFICATION_TOP_OFFSET = 24; // pixels from top
const NOTIFICATION_SPACING = 80; // vertical spacing between notifications

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationProps['type']) => void;
  showConfirm: (options: Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'>) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationState {
  message: string;
  type: NotificationProps['type'];
  id: number;
}

interface ConfirmState {
  config: Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'>;
  resolve: (value: boolean) => void;
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState | null>(null);
  const nextIdRef = useRef(0); // Use ref instead of state for ID generation

  const showNotification = useCallback((message: string, type: NotificationProps['type'] = 'info') => {
    const id = nextIdRef.current;
    nextIdRef.current += 1;
    setNotifications(prev => [...prev, { message, type, id }]);
  }, []); // No dependencies needed since we use ref

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showConfirm = useCallback((options: Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({ config: options, resolve });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmDialog) {
      confirmDialog.resolve(true);
      setConfirmDialog(null);
    }
  }, [confirmDialog]);

  const handleCancel = useCallback(() => {
    if (confirmDialog) {
      confirmDialog.resolve(false);
      setConfirmDialog(null);
    }
  }, [confirmDialog]);

  return (
    <NotificationContext.Provider value={{ showNotification, showConfirm }}>
      {children}
      
      {/* Render notifications */}
      {notifications.map((notification, index) => (
        <div 
          key={notification.id} 
          style={{ 
            position: 'fixed', 
            top: `${NOTIFICATION_TOP_OFFSET + index * NOTIFICATION_SPACING}px`, 
            left: '50%',
            zIndex: 9999 
          }}
        >
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
      
      {/* Render confirm dialog */}
      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog.config}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
