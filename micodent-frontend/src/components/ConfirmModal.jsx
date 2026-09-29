import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  busy = false,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const config = {
    danger: {
      icon: <Trash2 size={20} />,
      iconBg: 'text-red-700',
      btn: 'bg-red-700 hover:bg-red-800',
    },
    warning: {
      icon: <AlertTriangle size={20} />,
      iconBg: 'text-amber-700',
      btn: 'bg-amber-700 hover:bg-amber-800',
    },
    reset: {
      icon: <RotateCcw size={20} />,
      iconBg: 'text-clinical-600',
      btn: 'bg-clinical-600 hover:bg-clinical-700',
    },
  };

  const { icon, iconBg, btn } = config[type] || config.danger;

  return (
    <div className="dialog-overlay fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/50 p-4">
      <div
        role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 id="confirm-modal-title" className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-800"><span className={iconBg}>{icon}</span>{title}</h3>
          <p className="mb-6 text-sm leading-relaxed text-slate-600">{message}</p>
          <div className="flex w-full justify-end gap-2">
            <button
              onClick={onCancel}
              disabled={busy}
              className="ui-button-secondary"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              className={`inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${btn}`}
            >
              {busy ? 'Guardando...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
