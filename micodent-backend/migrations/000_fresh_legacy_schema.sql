-- Empty legacy schema only; no historical rows.
-- Source SHA-256: 4b3d69013dcc4621b5c0280086d59fc243743be286fe35a867833d13e6321dc9

CREATE TABLE `antecedentes_medicos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `motivo_consulta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'triajeData.motivo',
  `antecedentes_medicos` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'triajeData.antecedentesMedicos',
  `antecedentes_quirurgicos` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'triajeData.antecedentesQuirurgicos',
  `antecedentes_odontologicos` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'triajeData.antecedentesOdontologicos',
  `diagnostico` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'diagnosticoData.diagnostico',
  `plan_tratamiento` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'diagnosticoData.planTratamiento',
  `examen_clinico` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'diagnosticoData.examenClinico',
  `actualizado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `historia_id` (`historia_id`),
  CONSTRAINT `antecedentes_medicos_ibfk_1` FOREIGN KEY (`historia_id`) REFERENCES `historias_clinicas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `apoderados` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `paciente_id` bigint NOT NULL,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parentesco` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `celular` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `paciente_id` (`paciente_id`),
  CONSTRAINT `apoderados_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `auditoria_financiera` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `usuario_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modulo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detalle_json` json DEFAULT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `idx_auditoria_financiera_fecha` (`fecha` DESC,`hora` DESC),
  CONSTRAINT `auditoria_financiera_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `auditoria_historias` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `usuario_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_accion` date NOT NULL,
  `hora_accion` time NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `historia_id` (`historia_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `auditoria_historias_ibfk_1` FOREIGN KEY (`historia_id`) REFERENCES `historias_clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `auditoria_historias_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `auditoria_pacientes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `paciente_id` bigint NOT NULL,
  `usuario_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_accion` date NOT NULL,
  `hora_accion` time NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `paciente_id` (`paciente_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `auditoria_pacientes_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `auditoria_pacientes_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `centros_referencia` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sede` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `celular` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mapa_imagen_url` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `maps_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Enlace real de Google Maps, de respaldo',
  `activo` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `citas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `paciente_id` bigint DEFAULT NULL,
  `nombre_contacto` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `celular_contacto` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `motivo_consulta` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `doctor_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `duracion_minutos` int NOT NULL,
  `estado` enum('agendada','atendida','cancelada','no_asistio') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'agendada',
  `creado_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `paciente_id` (`paciente_id`),
  KEY `creado_por` (`creado_por`),
  KEY `idx_doctor_fecha` (`doctor_id`,`fecha`),
  CONSTRAINT `citas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `citas_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `citas_ibfk_3` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `consultas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'formNuevoTratamiento.descripcion',
  `costo_total` decimal(10,2) DEFAULT '0.00' COMMENT 'formNuevoTratamiento.costoTotal',
  `abono_inicial` decimal(10,2) DEFAULT '0.00' COMMENT 'formNuevoTratamiento.abonoInicial',
  `fecha_consulta` date NOT NULL COMMENT 'formNuevoTratamiento.fecha',
  `doctor_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pieza_referencia` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Opcional — diente o arcada relacionada',
  `cara_referencia` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Opcional — cara relacionada',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado_clinico` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Como encontro el doctor al paciente ese dia',
  `costo_laboratorio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `comision_porcentaje_aplicado` decimal(5,2) DEFAULT NULL COMMENT 'Copia del % del doctor al momento de guardar, no cambia si luego se edita el % del doctor',
  `tipo_comision` enum('rehabilitacion','endodoncia','estandar') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'estandar',
  `cantidad_radiografias` int DEFAULT '0',
  `ganancia_neta_clinica` decimal(10,2) GENERATED ALWAYS AS ((`costo_total` - `costo_laboratorio`)) STORED,
  `firmado_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'usuarios.id del doctor que firmo',
  `firmado_en` timestamp NULL DEFAULT NULL,
  `bloqueada` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = ya firmada, solo editable via adenda',
  PRIMARY KEY (`id`),
  KEY `historia_id` (`historia_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `consultas_ibfk_1` FOREIGN KEY (`historia_id`) REFERENCES `historias_clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consultas_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `consultas_adendas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `consulta_id` bigint NOT NULL,
  `usuario_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motivo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `consulta_id` (`consulta_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `consultas_adendas_ibfk_1` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consultas_adendas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `firmas_consentimiento` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `firma_paciente_data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Base64 PNG del canvas del paciente',
  `firma_doctor_data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Base64 PNG del canvas del doctor',
  `fecha_firma` date DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `historia_id` (`historia_id`),
  CONSTRAINT `firmas_consentimiento_ibfk_1` FOREIGN KEY (`historia_id`) REFERENCES `historias_clinicas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gastos_clinica` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `categoria` enum('luz','agua','internet','alquiler','materiales','sueldos','imprevistos') COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `estado` enum('activo','anulado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'activo',
  `fecha_pago` date NOT NULL,
  `mes_consumo` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registrado_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `registrado_por` (`registrado_por`),
  CONSTRAINT `gastos_clinica_ibfk_1` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `chk_mes_consumo_formato` CHECK (((`mes_consumo` is null) or regexp_like(`mes_consumo`,_utf8mb4'^[0-9]{4}-(0[1-9]|1[0-2])$')))
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `historias_clinicas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `paciente_id` bigint NOT NULL,
  `nro_historia` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` date NOT NULL,
  `hora_creacion` time NOT NULL,
  `creado_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activa` tinyint(1) DEFAULT '1',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `paciente_id` (`paciente_id`),
  UNIQUE KEY `nro_historia` (`nro_historia`),
  KEY `creado_por` (`creado_por`),
  CONSTRAINT `historias_clinicas_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `historias_clinicas_ibfk_2` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `odontograma_adendas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `odontograma_item_id` bigint NOT NULL,
  `usuario_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motivo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `odontograma_item_id` (`odontograma_item_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `odontograma_adendas_ibfk_1` FOREIGN KEY (`odontograma_item_id`) REFERENCES `odontograma_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `odontograma_adendas_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `odontograma_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `pieza` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Número FDI (11-85) o nombre de arcada completa',
  `cara` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'vestibular | lingual | mesial | distal | oclusal | Toda la pieza | Toda la arcada',
  `estado_codigo` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `registrado_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `firmado_en` timestamp NULL DEFAULT NULL,
  `bloqueada` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `historia_id` (`historia_id`),
  KEY `registrado_por` (`registrado_por`),
  CONSTRAINT `odontograma_items_ibfk_1` FOREIGN KEY (`historia_id`) REFERENCES `historias_clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `odontograma_items_ibfk_2` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ordenes_radiografia` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `doctor_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `centro_referencia_id` bigint DEFAULT NULL,
  `fecha` date NOT NULL,
  `tipo_solicitud` enum('rx_informe','todo_virtual') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'rx_informe',
  `motivo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `envio_virtual` enum('whatsapp','correo','ninguno') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ninguno',
  `extraorales` json DEFAULT NULL,
  `tomografias` json DEFAULT NULL,
  `piezas_tomografia` json DEFAULT NULL,
  `fotografias` json DEFAULT NULL,
  `intraorales` json DEFAULT NULL,
  `periapicales_piezas` json DEFAULT NULL,
  `modelos_estudio` json DEFAULT NULL,
  `firmado_en` timestamp NULL DEFAULT NULL,
  `bloqueada` tinyint NOT NULL DEFAULT '0',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `anulada` tinyint NOT NULL DEFAULT '0',
  `motivo_anulacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `anulada_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `anulada_en` timestamp NULL DEFAULT NULL,
  `reemplaza_a` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `historia_id` (`historia_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `centro_referencia_id` (`centro_referencia_id`),
  KEY `reemplaza_a` (`reemplaza_a`),
  KEY `anulada_por` (`anulada_por`),
  CONSTRAINT `ordenes_radiografia_ibfk_1` FOREIGN KEY (`historia_id`) REFERENCES `historias_clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ordenes_radiografia_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `ordenes_radiografia_ibfk_3` FOREIGN KEY (`centro_referencia_id`) REFERENCES `centros_referencia` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ordenes_radiografia_ibfk_4` FOREIGN KEY (`reemplaza_a`) REFERENCES `ordenes_radiografia` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ordenes_radiografia_ibfk_5` FOREIGN KEY (`anulada_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pacientes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dni` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombres` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sexo` enum('M','F') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_nacimiento` date NOT NULL,
  `domicilio` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `celular` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_registro` date NOT NULL,
  `hora_registro` time NOT NULL,
  `registrado_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`),
  KEY `registrado_por` (`registrado_por`),
  CONSTRAINT `pacientes_ibfk_1` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pagos` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `consulta_id` bigint NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` enum('Efectivo','Transferencia','Yape','Plin','Tarjeta') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Efectivo',
  `recargo_pos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `comision_generada` decimal(10,2) DEFAULT NULL,
  `fecha_pago` date NOT NULL,
  `hora_pago` time NOT NULL,
  `registrado_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `consulta_id` (`consulta_id`),
  KEY `registrado_por` (`registrado_por`),
  CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pagos_laboratorio` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `trabajo_laboratorio_id` bigint NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `fecha_pago` date NOT NULL,
  `registrado_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `trabajo_laboratorio_id` (`trabajo_laboratorio_id`),
  KEY `registrado_por` (`registrado_por`),
  CONSTRAINT `pagos_laboratorio_ibfk_1` FOREIGN KEY (`trabajo_laboratorio_id`) REFERENCES `trabajos_laboratorio` (`id`),
  CONSTRAINT `pagos_laboratorio_ibfk_2` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `penalidades_doctor` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `doctor_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `consulta_id` bigint DEFAULT NULL,
  `trabajo_laboratorio_id` bigint DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` date NOT NULL,
  `registrado_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `consulta_id` (`consulta_id`),
  KEY `trabajo_laboratorio_id` (`trabajo_laboratorio_id`),
  KEY `registrado_por` (`registrado_por`),
  CONSTRAINT `penalidades_doctor_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `penalidades_doctor_ibfk_2` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`),
  CONSTRAINT `penalidades_doctor_ibfk_3` FOREIGN KEY (`trabajo_laboratorio_id`) REFERENCES `trabajos_laboratorio` (`id`),
  CONSTRAINT `penalidades_doctor_ibfk_4` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `radiografias` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `tipo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'radiografia | foto_clinica',
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `url_archivo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ruta en servidor o bucket S3',
  `fecha_toma` date DEFAULT NULL,
  `subido_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `historia_id` (`historia_id`),
  KEY `subido_por` (`subido_por`),
  CONSTRAINT `radiografias_ibfk_1` FOREIGN KEY (`historia_id`) REFERENCES `historias_clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `radiografias_ibfk_2` FOREIGN KEY (`subido_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `recetas` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `consulta_id` bigint DEFAULT NULL,
  `doctor_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha` date NOT NULL,
  `rp` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Bloque libre bajo Rp: igual al recetario fisico',
  `indicaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `firmado_en` timestamp NULL DEFAULT NULL,
  `bloqueada` tinyint NOT NULL DEFAULT '0',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `anulada` tinyint NOT NULL DEFAULT '0',
  `motivo_anulacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `anulada_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `anulada_en` timestamp NULL DEFAULT NULL,
  `reemplaza_a` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `historia_id` (`historia_id`),
  KEY `consulta_id` (`consulta_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `reemplaza_a` (`reemplaza_a`),
  KEY `anulada_por` (`anulada_por`),
  CONSTRAINT `recetas_ibfk_1` FOREIGN KEY (`historia_id`) REFERENCES `historias_clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recetas_ibfk_2` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `recetas_ibfk_3` FOREIGN KEY (`doctor_id`) REFERENCES `usuarios` (`id`),
  CONSTRAINT `recetas_ibfk_4` FOREIGN KEY (`reemplaza_a`) REFERENCES `recetas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `recetas_ibfk_5` FOREIGN KEY (`anulada_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `trabajos_laboratorio` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `consulta_id` bigint NOT NULL,
  `nombre_laboratorio` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto_total` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registrado_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `creado_en` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `consulta_id` (`consulta_id`),
  KEY `registrado_por` (`registrado_por`),
  CONSTRAINT `trabajos_laboratorio_ibfk_1` FOREIGN KEY (`consulta_id`) REFERENCES `consultas` (`id`),
  CONSTRAINT `trabajos_laboratorio_ibfk_2` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `triaje` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `historia_id` bigint NOT NULL,
  `presion` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'triajeData.presion — ej: 120/80 mmHg',
  `pulso` int DEFAULT NULL COMMENT 'triajeData.pulso — lpm',
  `temperatura` decimal(4,1) DEFAULT NULL COMMENT 'triajeData.temperatura — °C',
  `fc` int DEFAULT NULL COMMENT 'triajeData.fc — Frecuencia cardíaca lpm',
  `fr` int DEFAULT NULL COMMENT 'triajeData.fr — Frecuencia respiratoria rpm',
  `peso` decimal(5,2) DEFAULT NULL COMMENT 'Opcional — kg (expansión futura)',
  `talla` decimal(5,2) DEFAULT NULL COMMENT 'Opcional — cm (expansión futura)',
  `imc` decimal(4,2) DEFAULT NULL COMMENT 'Opcional — calculado (expansión futura)',
  `fecha_toma` date NOT NULL,
  `registrado_por` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `historia_id` (`historia_id`),
  KEY `registrado_por` (`registrado_por`),
  CONSTRAINT `triaje_ibfk_1` FOREIGN KEY (`historia_id`) REFERENCES `historias_clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `triaje_ibfk_2` FOREIGN KEY (`registrado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `usuarios` (
  `id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'AVISO FASE 3: Reemplazar con hash BCrypt ($2a$10$...) al integrar Spring Security',
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_completo` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefix` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('o','a') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'o',
  `rol` enum('Doctor','Administradora','Asistente') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_admin` tinyint(1) DEFAULT '0',
  `dni` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `especialidad` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cop` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `creado_en` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `nivel` tinyint NOT NULL DEFAULT '1' COMMENT '1=Staff, 2=Admin, 3=Superadmin',
  `firma_digital` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Firma del doctor en base64, se estampa automatico en Evoluciones y Odontograma',
  `sello_digital` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Sello del doctor en base64',
  `comision_porcentaje` decimal(5,2) DEFAULT NULL COMMENT 'Porcentaje de comision del doctor sobre la ganancia neta, editable solo por Admin/Superadmin',
  PRIMARY KEY (`id`),
  UNIQUE KEY `dni` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
