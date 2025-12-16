import { pool } from "./db/conexion.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function inicializarBaseDatos() {
  console.log("🚀 Iniciando configuración de base de datos en Neon...\n");

  try {
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, "db", "init.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Ejecutar el script SQL
    await pool.query(sql);
    
    console.log("✅ Tablas creadas exitosamente");
    console.log("✅ Índices creados exitosamente");
    console.log("✅ Vistas creadas exitosamente");
    console.log("✅ Usuario administrador por defecto creado");

    // Verificar tablas creadas
    const tablas = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log("\n📊 Tablas en la base de datos:");
    tablas.rows.forEach((t) => console.log(`   - ${t.table_name}`));

    // Verificar usuario admin
    const admin = await pool.query(
      "SELECT email, nombre FROM administradores WHERE email = 'admin@ucn.cl'"
    );

    if (admin.rows.length > 0) {
      console.log("\n👤 Usuario administrador:");
      console.log(`   Email: ${admin.rows[0].email}`);
      console.log(`   Nombre: ${admin.rows[0].nombre}`);
      console.log(`   Password: admin123 (cambiar después del primer login)`);
    }

    console.log("\n✅ Base de datos Neon configurada correctamente");
  } catch (error) {
    console.error("❌ Error al inicializar base de datos:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

inicializarBaseDatos()
  .then(() => {
    console.log("\n🎉 Proceso completado exitosamente");
    process.exit(0);
  })
  .catch((err) => {
    console.error("\n❌ Error fatal:", err);
    process.exit(1);
  });