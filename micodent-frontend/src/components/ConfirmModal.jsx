import React from 'react';
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const config = {
    danger: {
      icon: <Trash2 size={30} />,
      iconBg: 'bg-red-100 text-red-600',
      btn: 'bg-red-500 hover:bg-red-600 shadow-red-200',
    },
    warning: {
      icon: <AlertTriangle size={30} />,
      iconBg: 'bg-orange-100 text-orange-600',
      btn: 'bg-orange-500 hover:bg-orange-600 shadow-orange-200',
    },
    reset: {
      icon: <RotateCcw size={30} />,
      iconBg: 'bg-amber-100 text-amber-600',
      btn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
    },
  };

  const { icon, iconBg, btn } = config[type] || config.danger;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`p-5 rounded-2xl mb-5 ${iconBg}`}>{icon}</div>
          <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">{message}</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-3.5 text-white rounded-2xl font-bold transition-all shadow-lg ${btn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;