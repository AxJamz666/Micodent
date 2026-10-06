import { TOOTH_ROWS, selectedRxTeeth } from '../utils/rxTeeth';

export default function RxTeethPrint({ orden }) {
  const selected = selectedRxTeeth(orden);
  if (selected.length === 0) return null;

  const types = new Map(selected.map(tooth => [tooth.number, tooth.type]));
  return (
    <section className="rx-teeth-chart mb-5" aria-label="Odontograma de piezas solicitadas">
      <p className="text-xs font-black text-clinical-700 uppercase mb-1">Odontograma de piezas solicitadas</p>
      <p className="text-[10px] text-slate-600 mb-2">T: tomografía · P: periapical · T/P: ambas</p>
      <div className="rx-teeth-rows">
        {TOOTH_ROWS.map(row => (
          <div className="rx-teeth-row" key={row.join('-')}>
            {row.map(number => (
              <div
                key={number}
                className={`rx-tooth ${types.has(number) ? 'rx-tooth-selected' : ''}`}
                data-rx-piece={number}
                aria-label={'Pieza ' + number + (types.has(number) ? ': ' + types.get(number) : ': no solicitada')}
              >
                <span>{number}</span>
                <strong>{types.get(number) || ''}</strong>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
