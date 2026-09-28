export default function OdontogramaAnulado({ registros = [] }) {
  if (!registros.length) return null;
  return (
    <details className="min-w-0 border-t border-slate-200 py-4" data-testid="odontograma-anulado">
      <summary className="cursor-pointer text-sm font-semibold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">
        Registros anulados ({registros.length})
      </summary>
      <ol className="mt-3 divide-y divide-slate-200">
        {registros.map(item => (
          <li key={item.id} className="py-4 text-sm text-slate-700 break-words [overflow-wrap:anywhere]">
            <p className="font-semibold">Pieza {item.pieza} · {item.estado_nombre || item.estado_codigo}</p>
            <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              <div><dt className="text-xs text-slate-500">Registro original</dt><dd>{item.registrado_por_nombre || item.registrado_por || 'Autor no disponible'} · {item.fecha_registro}</dd></div>
              <div><dt className="text-xs text-slate-500">Anulado por</dt><dd>{item.anulada_por_nombre || item.anulada_por} · {item.anulada_en}</dd></div>
              <div><dt className="text-xs text-slate-500">Superficie</dt><dd>{item.cara}</dd></div>
              <div><dt className="text-xs text-slate-500">Firma original</dt><dd>{item.firmado_en || 'Sin fecha registrada'}</dd></div>
              {item.notas && <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Notas originales</dt><dd className="whitespace-pre-wrap">{item.notas}</dd></div>}
              <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Motivo de anulación</dt><dd className="whitespace-pre-wrap">{item.anulacion_motivo}</dd></div>
            </dl>
            {(item.adendas || []).map(adenda => (
              <p key={adenda.id} className="mt-2 whitespace-pre-wrap">Corrección: {adenda.contenido} · {adenda.motivo} · {adenda.usuario_nombre} · {adenda.creado_en}</p>
            ))}
          </li>
        ))}
      </ol>
    </details>
  );
}
