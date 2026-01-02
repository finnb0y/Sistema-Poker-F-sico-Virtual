import React, { useEffect } from 'react';

export interface NotificationProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ 
  message, 
  type = 'info', 
  onClose, 
  autoClose = true,
  duration = 4000 
}) => {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const typeStyles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    success: 'bg-green-500/10 border-green-500/30 text-green-400',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    error: 'bg-red-500/10 border-red-500/30 text-red-400'
  };

  const iconMap = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  return (
    <div className="animate-slide-down" style={{ transform: 'translateX(-50%)' }}>
      <div className={`glass px-6 py-4 rounded-2xl border shadow-2xl ${typeStyles[type]} backdrop-blur-md max-w-md`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">{iconMap[type]}</span>
          <div className="flex-1">
            <p className="text-sm font-bold leading-relaxed">{message}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification;
