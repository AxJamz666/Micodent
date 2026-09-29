export const TOOTH_ROWS = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];

const validTeeth = new Set(TOOTH_ROWS.flat());

export function selectedRxTeeth(orden) {
  const normalize = (values) => new Set(
    (Array.isArray(values) ? values : [])
      .map(Number)
      .filter(value => Number.isInteger(value) && validTeeth.has(value))
  );
  const tomography = normalize(orden?.piezas_tomografia);
  const periapical = normalize(orden?.periapicales_piezas);
  return TOOTH_ROWS.flat().filter(number => tomography.has(number) || periapical.has(number))
    .map(number => ({
      number,
      type: tomography.has(number) && periapical.has(number) ? 'T/P' : tomography.has(number) ? 'T' : 'P',
    }));
}
