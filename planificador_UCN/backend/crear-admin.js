import pkg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "postgres",
  port: 5433,
});

async function crearAdministrador() {
  const usuario = "admin";
  const password = "admin123";
  const nombre = "Administrador UCN";
  const email = "admin@ucn.cl";

  try {
    console.log("Creando tabla de administradores...");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS administradores (
        id SERIAL PRIMARY KEY,
        usuario TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        nombre TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
        ultimo_acceso TIMESTAMP
      );
    `);

    console.log("Generando hash de contraseña...");
    const passwordHash = await bcrypt.hash(password, 10);

    console.log("Insertando administrador...");
    await pool.query(
      `INSERT INTO administradores (usuario, password_hash, nombre, email) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (usuario) DO UPDATE 
       SET password_hash = $2, nombre = $3, email = $4`,
      [usuario, passwordHash, nombre, email]
    );

    console.log("\n========================================");
    console.log("Administrador creado exitosamente!");
    console.log("========================================");
    console.log(`Usuario: ${usuario}`);
    console.log(`Contraseña: ${password}`);
    console.log(`Nombre: ${nombre}`);
    console.log(`Email: ${email}`);
    console.log("========================================\n");

    console.log("Actualizando tabla proyecciones...");
    await pool.query(`
      ALTER TABLE proyecciones 
      ADD COLUMN IF NOT EXISTS periodo_proyectado TEXT;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_proyecciones_periodo 
      ON proyecciones(periodo_proyectado, codigo_carrera);
    `);

    console.log("Creando vista de demanda...");
    await pool.query(`
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
    `);

    console.log("Base de datos actualizada correctamente!");

  } catch (error) {
    console.error("Error al crear administrador:", error);
  } finally {
    await pool.end();
  }
}

crearAdministrador();