export const generarSlotsHorario = () => {
  const slots = [];
  for (let h = 8; h < 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
};

export const horaAMinutos = (horaStr) => {
  const [h, m] = String(horaStr).split(':').map(Number);
  return h * 60 + m;
};

export const formatearHora12h = (horaStr) => {
  const [h, m] = String(horaStr).split(':').map(Number);
  const periodo = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${periodo}`;
};

export const ESTADO_CITA_CONFIG = {
  agendada:   { label: 'Agendada',   bg: 'bg-clinical-100', border: 'border-clinical-400', text: 'text-clinical-800' },
  atendida:   { label: 'Atendida',   bg: 'bg-green-100',    border: 'border-green-400',    text: 'text-green-800' },
  cancelada:  { label: 'Cancelada',  bg: 'bg-slate-100',    border: 'border-slate-300',    text: 'text-slate-400' },
  no_asistio: { label: 'No Asistió', bg: 'bg-red-100',      border: 'border-red-400',      text: 'text-red-700' },
};

// Formatea un objeto Date usando sus campos LOCALES (nunca pasa por UTC),
// para evitar el bug de que toISOString() puede mostrar el dia siguiente
// en horas de la noche, en zonas detras de UTC como Peru.
export const formatearFechaISO = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const obtenerLunesDeSemana = (fecha) => {
  const d = new Date(fecha);
  const dia = d.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(d);
  lunes.setDate(d.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
};

export const obtenerDiasDeSemana = (fecha) => {
  const lunes = obtenerLunesDeSemana(fecha);
  const dias = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    dias.push(d);
  }
  return dias;
};

export const obtenerDiasGrillaMes = (fecha) => {
  const primerDiaMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const ultimoDiaMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

  const inicioGrilla = obtenerLunesDeSemana(primerDiaMes);

  const diaSemanaUltimo = ultimoDiaMes.getDay();
  const diasHastaFinSemana = diaSemanaUltimo === 0 ? 0 : 7 - diaSemanaUltimo;
  const finGrilla = new Date(ultimoDiaMes);
  finGrilla.setDate(ultimoDiaMes.getDate() + diasHastaFinSemana);

  const dias = [];
  const cursor = new Date(inicioGrilla);
  while (cursor <= finGrilla) {
    dias.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
};

// Asigna un "carril" a cada cita de un mismo dia, para que las que se
// cruzan en horario (de distintos doctores) se dibujen una al lado de
// la otra en vez de una encima de otra, en las vistas Semana y Mes.
export const asignarCarriles = (citasDelDia) => {
  const ordenadas = [...citasDelDia].sort((a, b) => horaAMinutos(a.hora_inicio) - horaAMinutos(b.hora_inicio));
  const carriles = [];
  const resultado = [];

  ordenadas.forEach(cita => {
    const inicio = horaAMinutos(cita.hora_inicio);

    let carrilIndex = carriles.findIndex(carril => {
      const ultima = carril[carril.length - 1];
      const ultimaFin = horaAMinutos(ultima.hora_inicio) + ultima.duracion_minutos;
      return ultimaFin <= inicio;
    });

    if (carrilIndex === -1) {
      carrilIndex = carriles.length;
      carriles.push([]);
    }
    carriles[carrilIndex].push(cita);
    resultado.push({ ...cita, carril: carrilIndex });
  });

  const totalCarriles = carriles.length || 1;
  return resultado.map(c => ({ ...c, totalCarriles }));
};