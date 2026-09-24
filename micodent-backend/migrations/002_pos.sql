-- Additive: never recalculate existing payments or overwrite the current rate.
CREATE TABLE IF NOT EXISTS finanzas_configuracion (
  id TINYINT NOT NULL PRIMARY KEY,
  recargo_pos_porcentaje DECIMAL(5,2) NOT NULL,
  revision INT NOT NULL DEFAULT 1,
  CONSTRAINT ck_config_pos CHECK (recargo_pos_porcentaje BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO finanzas_configuracion(id,recargo_pos_porcentaje,revision) VALUES(1,4.00,1);

CREATE TABLE IF NOT EXISTS finanzas_pago_pos (
  pago_id BIGINT NOT NULL PRIMARY KEY,
  porcentaje DECIMAL(5,2) NOT NULL,
  revision INT NOT NULL,
  CONSTRAINT fk_pos_pago FOREIGN KEY (pago_id) REFERENCES pagos(id),
  CONSTRAINT ck_pago_pos CHECK (porcentaje BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
