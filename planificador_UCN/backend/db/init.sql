CREATE TABLE IF NOT EXISTS usuarios (
  rut TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  fecha_login TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carreras (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  catalogo TEXT,
  rut_usuario TEXT NOT NULL REFERENCES usuarios(rut) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_carreras_usuario_codigo ON carreras(rut_usuario, codigo);

CREATE TABLE IF NOT EXISTS mallas (
  id SERIAL PRIMARY KEY,
  codigo_asignatura TEXT,
  nombre_asignatura TEXT,
  creditos INT,
  nivel INT,
  prerequisitos TEXT,
  codigo_carrera TEXT
);

CREATE TABLE IF NOT EXISTS proyecciones (
  id SERIAL PRIMARY KEY,
  rut_usuario TEXT NOT NULL REFERENCES usuarios(rut) ON DELETE CASCADE,
  codigo_carrera TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('manual', 'automatica')),
  nombre TEXT NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  total_creditos INT,
  total_ramos INT,
  semestres_proyectados INT,
  fecha_egreso_estimada TEXT,
  datos_completos JSONB NOT NULL,
  es_favorita BOOLEAN DEFAULT FALSE,
  periodo_proyectado TEXT
);

CREATE INDEX IF NOT EXISTS idx_proyecciones_usuario ON proyecciones(rut_usuario);
CREATE INDEX IF NOT EXISTS idx_proyecciones_carrera ON proyecciones(rut_usuario, codigo_carrera);
CREATE INDEX IF NOT EXISTS idx_proyecciones_favoritas ON proyecciones(rut_usuario, es_favorita);
CREATE INDEX IF NOT EXISTS idx_proyecciones_periodo ON proyecciones(periodo_proyectado, codigo_carrera);

CREATE TABLE IF NOT EXISTS administradores (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
  ultimo_acceso TIMESTAMP
);

INSERT INTO administradores (email, password_hash, nombre) 
VALUES (
  'admin@ucn.cl',
  '$2b$10$uLH/JZm4UAED6njIGP8jcea5eXUb4pCQvJxWDx94C4fqGRoaLClBa',
  'Administrador UCN'
) ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE VIEW demanda_ramos AS
SELECT 
  p.codigo_carrera,
  p.periodo_proyectado,
  r.codigo_ramo,
  r.nombre_ramo,
  COUNT(DISTINCT p.rut_usuario) as cantidad_estudiantes,
  SUM(r.creditos) as creditos_totales,
  AVG(r.creditos) as creditos_promedio
FROM proyecciones p
CROSS JOIN LATERAL (
  SELECT 
    (ramo->>'codigo')::TEXT as codigo_ramo,
    (ramo->>'nombre')::TEXT as nombre_ramo,
    COALESCE((ramo->>'creditos')::INT, 0) as creditos
  FROM jsonb_array_elements(p.datos_completos->'ramos') as ramo
) r
WHERE p.periodo_proyectado IS NOT NULL
GROUP BY p.codigo_carrera, p.periodo_proyectado, r.codigo_ramo, r.nombre_ramo
ORDER BY p.periodo_proyectado DESC, cantidad_estudiantes DESC;