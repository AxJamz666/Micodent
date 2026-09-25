// Additive DEV-only migration. The runner verifies database identity and backup before DDL.
module.exports = {
  id: '001_s1a',
  statements: [
    `CREATE TABLE micodent_migrations (
      id VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
      checksum CHAR(64) CHARACTER SET ascii NOT NULL,
      applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB`,
    `ALTER TABLE usuarios ADD COLUMN auth_version INT UNSIGNED NOT NULL DEFAULT 0`,
    `CREATE TABLE seguridad_sesiones (
      token_hash BINARY(32) PRIMARY KEY,
      usuario_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
      auth_version INT UNSIGNED NOT NULL,
      expira_epoch BIGINT UNSIGNED NOT NULL,
      creada_en TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      revocada_en TIMESTAMP(3) NULL DEFAULT NULL,
      INDEX idx_sesiones_usuario (usuario_id, revocada_en),
      INDEX idx_sesiones_expira (expira_epoch),
      CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB`,
    `CREATE TABLE seguridad_eventos (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      accion VARCHAR(40) CHARACTER SET ascii NOT NULL,
      usuario_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
      objetivo_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
      creado_en TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      INDEX idx_eventos_usuario_fecha (usuario_id, creado_en),
      INDEX idx_eventos_fecha (creado_en)
    ) ENGINE=InnoDB`,
    `CREATE TABLE seguridad_intentos (
      \`key\` VARCHAR(255) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
      points INT NOT NULL DEFAULT 0,
      expire BIGINT UNSIGNED NULL,
      INDEX idx_intentos_expire (expire)
    ) ENGINE=InnoDB`
  ]
};
