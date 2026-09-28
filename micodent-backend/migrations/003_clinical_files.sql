CREATE TABLE radiografias_anulaciones (
  radiografia_id BIGINT NOT NULL PRIMARY KEY,
  anulada_por VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  anulada_en DATETIME NOT NULL,
  restaurada_por VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  restaurada_en DATETIME NULL,
  INDEX idx_anulaciones_activa (restaurada_en),
  CONSTRAINT fk_anulaciones_radiografia FOREIGN KEY (radiografia_id)
    REFERENCES radiografias(id) ON DELETE RESTRICT,
  CONSTRAINT fk_anulaciones_usuario FOREIGN KEY (anulada_por)
    REFERENCES usuarios(id) ON DELETE SET NULL,
  CONSTRAINT fk_restauraciones_usuario FOREIGN KEY (restaurada_por)
    REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
