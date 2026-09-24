export async function printDocument(selector) {
  const area = document.querySelector(selector);
  if (!area) throw new Error('No se encontro el documento para imprimir.');
  let timeout;
  try {
    await Promise.race([
      Promise.all([
        document.fonts?.ready,
        ...Array.from(area.querySelectorAll('img'), async image => {
          await image.decode();
          if (!image.naturalWidth) throw new Error('Imagen no disponible.');
        }),
      ]),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Tiempo de carga agotado.')), 30000); }),
    ]);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    window.print();
  } catch {
    throw new Error('No se pudieron cargar todas las imagenes. Revisa el documento y vuelve a intentar imprimir.');
  } finally { clearTimeout(timeout); }
}
