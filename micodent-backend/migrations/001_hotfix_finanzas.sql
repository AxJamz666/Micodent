-- Incremental. Run on a verified copy first; never import the original dump.
-- Existing payments and their commissions remain unchanged.
CREATE TABLE IF NOT EXISTS finanzas_version (
  version VARCHAR(30) NOT NULL PRIMARY KEY,
  completada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finanzas_costos (
  consulta_id BIGINT NOT NULL PRIMARY KEY,
  otros_costos DECIMAL(10,2) NOT NULL DEFAULT 0,
  origen VARCHAR(30) NOT NULL,
  CONSTRAINT fk_fin_cost_consulta FOREIGN KEY (consulta_id) REFERENCES consultas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finanzas_pagos (
  pago_id BIGINT NOT NULL PRIMARY KEY,
  doctor_id VARCHAR(50) NULL,
  porcentaje DECIMAL(5,2) NULL,
  costo_aplicado DECIMAL(10,2) NOT NULL,
  base_comisionable DECIMAL(10,2) NOT NULL,
  margen_clinica DECIMAL(10,2) NOT NULL,
  regla VARCHAR(30) NOT NULL,
  anulado TINYINT NOT NULL DEFAULT 0,
  anulado_por VARCHAR(50) NULL,
  anulado_en DATETIME NULL,
  motivo_anulacion VARCHAR(500) NULL,
  CONSTRAINT fk_fin_pago FOREIGN KEY (pago_id) REFERENCES pagos(id),
  CONSTRAINT fk_fin_doctor FOREIGN KEY (doctor_id) REFERENCES usuarios(id),
  CONSTRAINT fk_fin_anulador FOREIGN KEY (anulado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finanzas_peticiones (
  usuario_id VARCHAR(50) NOT NULL,
  clave VARCHAR(80) NOT NULL,
  huella CHAR(64) NOT NULL,
  respuesta JSON NULL,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(usuario_id, clave),
  CONSTRAINT fk_fin_peticion_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW pagos_vigentes AS
SELECT p.* FROM pagos p LEFT JOIN finanzas_pagos f ON f.pago_id = p.id
WHERE COALESCE(f.anulado, 0) = 0;
