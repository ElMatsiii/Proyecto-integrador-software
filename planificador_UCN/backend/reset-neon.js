import { pool } from "./db/conexion.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetearBaseDatos() {
  console.log("========================================");
  console.log("🔄 LIMPIEZA Y REINICIO DE BASE DE DATOS");
  console.log("========================================\n");

  try {
    // 1. Eliminar vistas (dependencias primero)
    console.log("🗑️  Eliminando vistas...");
    await pool.query(`DROP VIEW IF EXISTS demanda_ramos CASCADE;`);
    console.log("✅ Vistas eliminadas\n");

    // 2. Eliminar tablas (en orden inverso por dependencias)
    console.log("🗑️  Eliminando tablas...");
    await pool.query(`
      DROP TABLE IF EXISTS proyecciones CASCADE;
      DROP TABLE IF EXISTS mallas CASCADE;
      DROP TABLE IF EXISTS carreras CASCADE;
      DROP TABLE IF EXISTS administradores CASCADE;
      DROP TABLE IF EXISTS usuarios CASCADE;
    `);
    console.log("✅ Tablas eliminadas\n");

    // 3. Leer y ejecutar el script SQL completo
    console.log("📝 Ejecutando script de inicialización...");
    const sqlPath = path.join(__dirname, "db", "init.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    
    await pool.query(sql);
    console.log("✅ Script ejecutado exitosamente\n");

    // 4. Verificar tablas creadas
    const tablas = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("========================================");
    console.log("📊 TABLAS CREADAS");
    console.log("========================================");
    tablas.rows.forEach((t) => console.log(`   ✓ ${t.table_name}`));

    // 5. Verificar vistas creadas
    const vistas = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("\n========================================");
    console.log("👁️  VISTAS CREADAS");
    console.log("========================================");
    vistas.rows.forEach((v) => console.log(`   ✓ ${v.table_name}`));

    // 6. Verificar usuario admin
    const admin = await pool.query(
      "SELECT email, nombre FROM administradores LIMIT 1"
    );

    console.log("\n========================================");
    console.log("👤 USUARIO ADMINISTRADOR");
    console.log("========================================");
    if (admin.rows.length > 0) {
      console.log(`   Email: ${admin.rows[0].email}`);
      console.log(`   Nombre: ${admin.rows[0].nombre}`);
      console.log(`   Password: admin123`);
    }

    // 7. Verificar usuarios de prueba
    const usuarios = await pool.query(
      "SELECT rut, email, nombre FROM usuarios"
    );

    console.log("\n========================================");
    console.log("👥 USUARIOS DE PRUEBA");
    console.log("========================================");
    if (usuarios.rows.length > 0) {
      usuarios.rows.forEach((u) => {
        console.log(`   ✓ ${u.email} (${u.nombre})`);
      });
    } else {
      console.log("   ⚠️  No hay usuarios de prueba");
      console.log("   💡 Se crearán automáticamente al hacer login");
    }

    console.log("\n========================================");
    console.log("✅ BASE DE DATOS LISTA");
    console.log("========================================");
    console.log("\n💡 Próximos pasos:");
    console.log("   1. Ejecuta: npm start");
    console.log("   2. Prueba el login en el frontend");
    console.log("   3. Verifica usuarios: node verificar-usuarios.js\n");

  } catch (error) {
    console.error("\n❌ Error durante el reset:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

resetearBaseDatos()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error fatal:", err);
    process.exit(1);
  });