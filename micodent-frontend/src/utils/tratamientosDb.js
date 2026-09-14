export const TRATAMIENTOS_DB = [
  // DIAGNÓSTICOS INICIALES
  { id: '1', categoria: 'Diagnósticos Iniciales', nombre: 'Caries Esmalte / Dentina', tipo: 'cara' },
  { id: '2', categoria: 'Diagnósticos Iniciales', nombre: 'Pulpitis Reversible', tipo: 'diente' },
  { id: '3', categoria: 'Diagnósticos Iniciales', nombre: 'Pulpitis Irreversible', tipo: 'diente' },
  { id: '4', categoria: 'Diagnósticos Iniciales', nombre: 'Absceso Apical', tipo: 'diente' },
  { id: '5', categoria: 'Diagnósticos Iniciales', nombre: 'Absceso Apical c/fístula', tipo: 'diente' },
  { id: '6', categoria: 'Diagnósticos Iniciales', nombre: 'Necrosis Pulpar', tipo: 'diente' },
  { id: '7', categoria: 'Diagnósticos Iniciales', nombre: 'Diente Ausente Edentulismo Parcial', tipo: 'diente', visual: 'tachado' },
  { id: '8', categoria: 'Diagnósticos Iniciales', nombre: 'Diente Ausente Edentulismo Total', tipo: 'arcada', visual: 'tachado' },
  { id: '9', categoria: 'Diagnósticos Iniciales', nombre: 'Diente en Erupción', tipo: 'diente' },
  { id: '10', categoria: 'Diagnósticos Iniciales', nombre: 'Diente Ectópico', tipo: 'diente' },
  { id: '11', categoria: 'Diagnósticos Iniciales', nombre: 'Diente con giroversión', tipo: 'diente', visual: 'giroversion' },
  { id: '12', categoria: 'Diagnósticos Iniciales', nombre: 'Diente Impactado', tipo: 'diente' },
  { id: '13', categoria: 'Diagnósticos Iniciales', nombre: 'Diente Retenido', tipo: 'diente' },
  // CIRUGÍAS
  { id: '14', categoria: 'Cirugías', nombre: 'Extracción Dental Simple', tipo: 'diente', visual: 'tachado' },
  { id: '15', categoria: 'Cirugías', nombre: 'Extracción Dental Remanente radicular', tipo: 'diente', visual: 'tachado' },
  { id: '16', categoria: 'Cirugías', nombre: 'Extracción / cirugía 3ra Molar Impactada', tipo: 'diente', visual: 'tachado' },
  { id: '17', categoria: 'Cirugías', nombre: 'Extracción Canino Retenido', tipo: 'diente', visual: 'tachado' },
  { id: '18', categoria: 'Cirugías', nombre: 'Extracción Dental Ectópica', tipo: 'diente', visual: 'tachado' },
  { id: '19', categoria: 'Cirugías', nombre: 'Gingivoplastia', tipo: 'diente' },
  { id: '20', categoria: 'Cirugías', nombre: 'Gingivectomía', tipo: 'diente' },
  { id: '21', categoria: 'Cirugías', nombre: 'Frenectomía', tipo: 'diente' },
  { id: '22', categoria: 'Cirugías', nombre: 'Osteotomía / Remodelación Ósea', tipo: 'diente' },
  // RESTAURACIONES
  { id: '23', categoria: 'Restauraciones', nombre: 'Restauración Dental Simple', tipo: 'cara' },
  { id: '24', categoria: 'Restauraciones', nombre: 'Restauración Dental Compuesta', tipo: 'cara' },
  // ENDODONCIAS
  { id: '25', categoria: 'Endodoncias', nombre: 'Endodoncia Unirradicular', tipo: 'diente', visual: 'linea_vertical' },
  { id: '26', categoria: 'Endodoncias', nombre: 'Endodoncia Multirradicular', tipo: 'diente', visual: 'linea_vertical' },
  // PRÓTESIS TOTAL
  { id: '27', categoria: 'Prótesis Total', nombre: 'Prótesis Total - Ivoclar', tipo: 'arcada', visual: 'fondo' },
  { id: '28', categoria: 'Prótesis Total', nombre: 'Prótesis Total - Ortolux', tipo: 'arcada', visual: 'fondo' },
  { id: '29', categoria: 'Prótesis Total', nombre: 'Prótesis Total - Olímpico', tipo: 'arcada', visual: 'fondo' },
  // PRÓTESIS PARCIAL REMOVIBLE
  { id: '30', categoria: 'Prótesis Parcial Removible', nombre: 'PPR Base Metálica - Ivoclar', tipo: 'arcada', visual: 'fondo' },
  { id: '31', categoria: 'Prótesis Parcial Removible', nombre: 'PPR Base Metálica - Ortolux', tipo: 'arcada', visual: 'fondo' },
  { id: '32', categoria: 'Prótesis Parcial Removible', nombre: 'PPR Base Metálica - Olímpico', tipo: 'arcada', visual: 'fondo' },
  { id: '33', categoria: 'Prótesis Parcial Removible', nombre: 'PPR Base Acrílico - Ivoclar', tipo: 'arcada', visual: 'fondo' },
  { id: '34', categoria: 'Prótesis Parcial Removible', nombre: 'PPR Base Acrílico - Ortolux', tipo: 'arcada', visual: 'fondo' },
  { id: '35', categoria: 'Prótesis Parcial Removible', nombre: 'PPR Base Acrílico - Olímpico', tipo: 'arcada', visual: 'fondo' },
  // PRÓTESIS FIJA
  { id: '36', categoria: 'Prótesis Fija', nombre: 'Prótesis Fija - Zirconia', tipo: 'diente', visual: 'circulo' },
  { id: '37', categoria: 'Prótesis Fija', nombre: 'Prótesis Fija - Porcelana', tipo: 'diente', visual: 'circulo' },
  { id: '38', categoria: 'Prótesis Fija', nombre: 'Prótesis Fija - Ivocron', tipo: 'diente', visual: 'circulo' },
  { id: '39', categoria: 'Prótesis Fija', nombre: 'Prótesis Fija - Acrílico', tipo: 'diente', visual: 'circulo' },
  { id: '40', categoria: 'Prótesis Fija', nombre: 'Prótesis Fija - Tipo fenestrado', tipo: 'diente', visual: 'circulo' },
  { id: '41', categoria: 'Prótesis Fija', nombre: 'Prótesis Fija - Oro', tipo: 'diente', visual: 'circulo' },
  { id: '42', categoria: 'Prótesis Fija', nombre: 'Prótesis Fija - CrCo', tipo: 'diente', visual: 'circulo' },
  // PERNOS
  { id: '43', categoria: 'Pernos', nombre: 'Perno - Fibra de Vidrio', tipo: 'diente' },
  { id: '44', categoria: 'Pernos', nombre: 'Perno - Metálico', tipo: 'diente' },
];