import React from 'react';

export interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  title, 
  message, 
  confirmText = 'Confirmar', 
  cancelText = 'Cancelar',
  onConfirm, 
  onCancel,
  type = 'warning'
}) => {
  const typeStyles = {
    danger: {
      bg: 'bg-red-500/10 border-red-500/30',
      titleColor: 'text-red-400',
      confirmBg: 'bg-red-600 hover:bg-red-500'
    },
    warning: {
      bg: 'bg-yellow-500/10 border-yellow-500/30',
      titleColor: 'text-yellow-400',
      confirmBg: 'bg-yellow-600 hover:bg-yellow-500'
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      titleColor: 'text-blue-400',
      confirmBg: 'bg-blue-600 hover:bg-blue-500'
    }
  };

  const styles = typeStyles[type];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className={`relative glass p-8 rounded-[32px] border ${styles.bg} shadow-2xl max-w-md w-full animate-scale-in`}>
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-black mb-3 ${styles.titleColor}`}>
            {title}
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            {message}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-widest"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${styles.confirmBg} text-white font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-widest shadow-xl`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
