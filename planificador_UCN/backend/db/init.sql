-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  rut TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT,
  fecha_login TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de carreras
CREATE TABLE IF NOT EXISTS carreras (
  id SERIAL PRIMARY KEY,
  codigo TEXT NOT NULL,
  nombre TEXT NOT NULL,
  catalogo TEXT,
  rut_usuario TEXT NOT NULL REFERENCES usuarios(rut) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_carreras_usuario_codigo ON carreras(rut_usuario, codigo);

-- Tabla de mallas
CREATE TABLE IF NOT EXISTS mallas (
  id SERIAL PRIMARY KEY,
  codigo_asignatura TEXT,
  nombre_asignatura TEXT,
  creditos INT,
  nivel INT,
  prerequisitos TEXT,
  codigo_carrera TEXT
);

-- Tabla de proyecciones con campo de favoritos
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
  es_favorita BOOLEAN DEFAULT FALSE
);

-- Índices para proyecciones
CREATE INDEX IF NOT EXISTS idx_proyecciones_usuario ON proyecciones(rut_usuario);
CREATE INDEX IF NOT EXISTS idx_proyecciones_carrera ON proyecciones(rut_usuario, codigo_carrera);
CREATE INDEX IF NOT EXISTS idx_proyecciones_favoritas ON proyecciones(rut_usuario, es_favorita);