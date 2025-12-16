import bcrypt from "bcryptjs";
import { pool } from "./db/conexion.js";

async function generarYActualizarHash() {
  const password = "admin123";
  const email = "admin@ucn.cl";
  
  console.log("========================================");
  console.log("🔐 GENERANDO Y ACTUALIZANDO HASH");
  console.log("========================================\n");
  
  try {
    // Generar hash
    console.log(`🔒 Generando hash para password: ${password}`);
    const hash = await bcrypt.hash(password, 10);
    console.log(`✅ Hash generado: ${hash.substring(0, 30)}...\n`);
    
    // Actualizar en la base de datos
    console.log(`📝 Actualizando en base de datos...`);
    const result = await pool.query(
      `UPDATE administradores 
       SET password_hash = $1 
       WHERE email = $2
       RETURNING email, nombre`,
      [hash, email]
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ Hash actualizado para: ${result.rows[0].email}`);
      console.log(`   Nombre: ${result.rows[0].nombre}`);
      console.log(`   Password: ${password}`);
      
      // Verificar que funciona
      console.log(`\n🧪 Verificando hash...`);
      const isValid = await bcrypt.compare(password, hash);
      console.log(`   Verificación: ${isValid ? '✅ CORRECTO' : '❌ ERROR'}`);
      
      console.log("\n========================================");
      console.log("✅ ADMIN ACTUALIZADO");
      console.log("========================================");
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      console.log("\n💡 Ahora puedes hacer login en /html/index.html\n");
      
    } else {
      console.log(`⚠️  No se encontró admin con email: ${email}`);
      console.log(`\n💡 Creando nuevo admin...`);
      
      await pool.query(
        `INSERT INTO administradores (email, password_hash, nombre)
         VALUES ($1, $2, $3)`,
        [email, hash, 'Administrador UCN']
      );
      
      console.log(`✅ Admin creado exitosamente`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

generarYActualizarHash();