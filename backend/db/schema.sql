CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    rut VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    nombre VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE carreras (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    catalogo VARCHAR(20) NOT NULL,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE
);
CREATE TABLE proyecciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    carrera_id INT REFERENCES carreras(id) ON DELETE CASCADE,
    nombre_proyeccion VARCHAR(100) NOT NULL, -- ej: "Proyección Semestre 5-6"
    creado_en TIMESTAMP DEFAULT NOW()
);
CREATE TABLE proyeccion_cursos (
    id SERIAL PRIMARY KEY,
    proyeccion_id INT REFERENCES proyecciones(id) ON DELETE CASCADE,
    codigo_asignatura VARCHAR(20) NOT NULL,
    nombre_asignatura VARCHAR(100) NOT NULL,
    nivel INT, -- semestre al que pertenece en la malla
    creditos INT
);

