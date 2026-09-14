import React from 'react';

const FirmaMiniBlock = ({ firma, sello, nombre, subtitulo }) => (
  <div className="flex flex-col items-center w-44">
    <div className="w-full h-10 flex items-end justify-center">
      {firma && <img src={firma} alt="Firma" className="max-h-full max-w-full object-contain" />}
    </div>
    {sello && (
      <div className="w-full h-14 flex items-center justify-center -mt-1">
        <img src={sello} alt="Sello" className="max-h-full max-w-full object-contain opacity-95" />
      </div>
    )}
    <div className="w-full border-t border-slate-400 pt-1 text-center mt-1">
      <p className="font-bold text-[10px] uppercase truncate">{nombre}</p>
      {subtitulo && <p className="text-[9px] text-slate-500">{subtitulo}</p>}
    </div>
  </div>
);

export default FirmaMiniBlock;