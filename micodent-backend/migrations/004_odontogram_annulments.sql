CREATE TABLE odontograma_anulaciones (
  odontograma_item_id BIGINT NOT NULL,
  motivo TEXT NOT NULL,
  anulada_por VARCHAR(50) NOT NULL,
  anulada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (odontograma_item_id),
  CONSTRAINT fk_odonto_anulacion_item FOREIGN KEY (odontograma_item_id)
    REFERENCES odontograma_items (id) ON DELETE RESTRICT,
  CONSTRAINT fk_odonto_anulacion_usuario FOREIGN KEY (anulada_por)
    REFERENCES usuarios (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
