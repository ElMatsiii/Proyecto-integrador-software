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