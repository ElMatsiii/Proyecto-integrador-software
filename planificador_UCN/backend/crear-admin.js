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
  const email = "admin@ucn.cl";
  const password = "admin123";
  const nombre = "Administrador UCN";

  try {
    console.log("Verificando tabla de administradores...");
    
    const tableCheck = await pool.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'administradores'
      ORDER BY ordinal_position
    `);

    console.log("Columnas actuales:", tableCheck.rows);

    const hasUsuarioColumn = tableCheck.rows.some(row => row.column_name === 'usuario');
    const hasEmailColumn = tableCheck.rows.some(row => row.column_name === 'email');

    if (hasUsuarioColumn) {
      console.log("Detectada estructura antigua con columna 'usuario'");
      console.log("Iniciando migración a formato email...\n");
      
      console.log("Paso 1: Agregar columna email...");
      await pool.query(`
        ALTER TABLE administradores 
        ADD COLUMN IF NOT EXISTS email TEXT;
      `);

      console.log("Paso 2: Copiar datos de usuario a email...");
      await pool.query(`
        UPDATE administradores 
        SET email = CASE 
          WHEN usuario LIKE '%@%' THEN usuario
          ELSE usuario || '@ucn.cl'
        END
        WHERE email IS NULL;
      `);

      console.log("Paso 3: Hacer email NOT NULL...");
      await pool.query(`
        ALTER TABLE administradores 
        ALTER COLUMN email SET NOT NULL;
      `);

      console.log("Paso 4: Agregar constraint UNIQUE en email...");
      await pool.query(`
        ALTER TABLE administradores 
        ADD CONSTRAINT administradores_email_key UNIQUE (email);
      `);

      console.log("Paso 5: Hacer columna usuario nullable...");
      await pool.query(`
        ALTER TABLE administradores 
        ALTER COLUMN usuario DROP NOT NULL;
      `);

      console.log("Paso 6: Eliminar columna usuario...");
      await pool.query(`
        ALTER TABLE administradores 
        DROP COLUMN usuario;
      `);

      console.log("Migración completada exitosamente!\n");
    } else if (!hasEmailColumn) {
      console.log("Creando estructura de tabla desde cero...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS administradores (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          nombre TEXT NOT NULL,
          fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW(),
          ultimo_acceso TIMESTAMP
        );
      `);
    } else {
      console.log("Tabla ya tiene la estructura correcta con email.\n");
    }

    console.log("Generando hash de contraseña...");
    const passwordHash = await bcrypt.hash(password, 10);

    console.log("Insertando/actualizando administrador...");
    await pool.query(
      `INSERT INTO administradores (email, password_hash, nombre) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, 
           nombre = EXCLUDED.nombre`,
      [email, passwordHash, nombre]
    );

    console.log("\n========================================");
    console.log("✓ Administrador creado/actualizado!");
    console.log("========================================");
    console.log(`Email: ${email}`);
    console.log(`Contraseña: ${password}`);
    console.log(`Nombre: ${nombre}`);
    console.log("========================================");
    console.log("\nPuedes iniciar sesión con:");
    console.log(`  Email: ${email}`);
    console.log(`  Contraseña: ${password}`);
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

    console.log("Actualizando vista de demanda...");
    await pool.query(`
      DROP VIEW IF EXISTS demanda_ramos;
      
      CREATE VIEW demanda_ramos AS
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

    console.log("\n✓ Base de datos actualizada correctamente!");
    console.log("\nVerificando estructura final...");
    
    const finalCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'administradores'
      ORDER BY ordinal_position
    `);
    
    console.log("\nEstructura final de tabla administradores:");
    console.table(finalCheck.rows);

  } catch (error) {
    console.error("\n❌ Error al crear/actualizar administrador:", error.message);
    console.error("\nDetalles del error:", error);
    
    console.log("\n🔧 Solución alternativa: Eliminar y recrear tabla");
    console.log("Ejecuta el siguiente comando SQL manualmente:");
    console.log(`
DROP TABLE IF EXISTS administradores CASCADE;

CREATE TABLE administradores (
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
  '$2a$10$YJZvXqF5xGZYH7K1L5qY9eF8OQx4K2d5R8QX2qL5hK7K8R9Y2qL5h',
  'Administrador UCN'
);
    `);
    
  } finally {
    await pool.end();
  }
}

crearAdministrador();