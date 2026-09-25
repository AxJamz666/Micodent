const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { baselineKind } = require('../../scripts/migrate-s1a');
const legacy = ['antecedentes_medicos', 'apoderados', 'auditoria_financiera', 'auditoria_historias',
  'auditoria_pacientes', 'centros_referencia', 'citas', 'consultas', 'consultas_adendas',
  'firmas_consentimiento', 'gastos_clinica', 'historias_clinicas', 'odontograma_adendas',
  'odontograma_items', 'ordenes_radiografia', 'pacientes', 'pagos', 'pagos_laboratorio',
  'penalidades_doctor', 'radiografias', 'recetas', 'trabajos_laboratorio', 'triaje', 'usuarios'];
const sql = ['001_hotfix_finanzas.sql', '002_pos.sql'].map(file =>
  fs.readFileSync(path.join(__dirname, '../../migrations', file), 'utf8')).join('\n');
const financial = [...sql.matchAll(/CREATE (?:TABLE IF NOT EXISTS|OR REPLACE VIEW) (\w+)/g)].map(m => m[1]);

test('S1-A accepts the complete original schema and the complete RC4 schema', () => {
  assert.equal(baselineKind(legacy), 'legacy');
  assert.equal(baselineKind([...financial, ...legacy].reverse()), 'rc4');
});

test('S1-A rejects missing, substituted, partial and unknown database objects', () => {
  for (const names of [legacy.slice(1), [...legacy.slice(1), 'unknown'],
    [...legacy, financial[0]], [...legacy, ...financial.slice(1)],
    [...legacy, ...financial, 'extra'], [...legacy, 'seguridad_sesiones']]) {
    assert.throws(() => baselineKind(names), /UNEXPECTED_OR_PARTIALLY_MIGRATED_SCHEMA/);
  }
});
