import { useEffect, useState } from 'react';

function DocumentImage({ source, alt, className }) {
  const [display, setDisplay] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      try {
        const w = image.naturalWidth, h = image.naturalHeight;
        if (!w || !h || w * h > 4000000) return;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, w, h).data;
        let left = w, right = -1, top = h, bottom = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (pixels[(y * w + x) * 4 + 3] > 0) {
            left = Math.min(left, x); right = Math.max(right, x);
            top = Math.min(top, y); bottom = Math.max(bottom, y);
          }
        }
        if (right < left || (left === 0 && top === 0 && right === w - 1 && bottom === h - 1)) return;
        // Crop only transparent padding for display; never change stored signatures.
        const cropped = document.createElement('canvas');
        cropped.width = right - left + 1; cropped.height = bottom - top + 1;
        cropped.getContext('2d').drawImage(canvas, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
        if (!cancelled) setDisplay({ source, url: cropped.toDataURL('image/png') });
      } catch { /* Cross-origin images retain their original representation. */ }
    };
    image.src = source;
    return () => { cancelled = true; };
  }, [source]);
  return <img src={display?.source === source ? display.url : source} alt={alt} className={className} />;
}

const FirmaMiniBlock = ({ firma, sello, nombre, subtitulo, label }) => (
  <div className="document-signature" data-signature-block>
    {firma && <DocumentImage source={firma} alt="Firma" className="document-signature-image" />}
    {sello ? <DocumentImage source={sello} alt="Sello" className="document-stamp-image" /> : (
      <div className="document-stamp-fallback" data-stamp-fallback>
        <p className="font-bold text-[10px] uppercase">{nombre}</p>
        {subtitulo && <p className="text-[9px] text-slate-500">{subtitulo}</p>}
        {label && <p className="text-[8px] text-slate-500 uppercase mt-1">{label}</p>}
      </div>
    )}
  </div>
);

export default FirmaMiniBlock;
