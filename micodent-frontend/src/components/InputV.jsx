import React from 'react';

const InputV = ({ label, placeholder, value, onChange, unit, format, type="text", required=true }) => {
  const handleChange = (e) => {
    let val = e.target.value || '';
    if (format === 'pa') val = val.replace(/[^0-9/]/g, '');
    else if (format === 'num') val = val.replace(/\D/g, '');
    else if (format === 'dec') val = val.replace(/[^0-9.]/g, '');
    onChange(val);
  };
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</label>
      <div className="relative">
        <input type={type} placeholder={placeholder} required={required} className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:border-clinical-500 bg-white font-medium ${unit ? 'pr-12' : ''}`} value={value} onChange={handleChange} />
        {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 select-none">{unit}</span>}
      </div>
    </div>
  );
};

export default InputV;

