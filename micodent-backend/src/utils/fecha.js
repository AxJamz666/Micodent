// Retorna fecha en formato YYYY-MM-DD en zona horaria de Lima (UTC-5)
const fechaLima = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });

// Retorna hora en formato HH:MM:SS en zona horaria de Lima
const horaLima = () =>
  new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/Lima',
    hour12:   false,
    hour:     '2-digit',
    minute:   '2-digit',
    second:   '2-digit',
  });

// Retorna solo HH:MM
const horaLimaCorta = () =>
  new Date().toLocaleTimeString('en-US', {
    timeZone: 'America/Lima',
    hour12:   false,
    hour:     '2-digit',
    minute:   '2-digit',
  });

module.exports = { fechaLima, horaLima, horaLimaCorta };