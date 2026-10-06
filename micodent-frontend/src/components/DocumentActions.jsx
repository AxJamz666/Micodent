import { History, RefreshCw, Printer, Lock } from 'lucide-react';

const DocumentActions = ({ hasHistory, canCorrect, onShowHistory, onCorrect, onPreview }) => (
  <div className="flex items-center gap-1.5 flex-shrink-0">
    {hasHistory && (
      <button onClick={onShowHistory} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Historial de correcciones">
        <History size={16}/>
      </button>
    )}
    {canCorrect && (
      <button onClick={onCorrect} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Corregir (anula esta y emite una nueva)">
        <RefreshCw size={16}/>
      </button>
    )}
    <button onClick={onPreview} className="p-2 text-slate-400 hover:text-clinical-600 hover:bg-clinical-50 rounded-lg transition-colors" title="Ver / Imprimir">
      <Printer size={16}/>
    </button>
    <Lock size={14} className="text-slate-400" />
  </div>
);

export default DocumentActions;

