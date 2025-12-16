import { pool } from "./db/conexion.js";

async function verificarUsuarios() {
  console.log("========================================");
  console.log("👥 VERIFICACIÓN DE USUARIOS");
  console.log("========================================\n");

  try {
    // Obtener todos los usuarios
    const usuarios = await pool.query(
      `SELECT rut, email, nombre, fecha_login 
       FROM usuarios 
       ORDER BY fecha_login DESC`
    );

    if (usuarios.rows.length === 0) {
      console.log("⚠️  No hay usuarios registrados");
      console.log("\n💡 Los usuarios se registran automáticamente al hacer login");
      console.log("   Prueba hacer login con:");
      console.log("   - juan@example.com / 1234");
      console.log("   - maria@example.com / abcd");
      console.log("   - ximena@example.com / qwerty");
    } else {
      console.log(`✅ Total de usuarios: ${usuarios.rows.length}\n`);
      
      usuarios.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.nombre || 'Sin nombre'}`);
        console.log(`   RUT: ${user.rut}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Último login: ${user.fecha_login ? new Date(user.fecha_login).toLocaleString('es-CL') : 'Nunca'}`);
        console.log("");
      });
    }

    // Obtener proyecciones por usuario
    const proyecciones = await pool.query(
      `SELECT u.email, u.nombre, COUNT(p.id) as total_proyecciones
       FROM usuarios u
       LEFT JOIN proyecciones p ON u.rut = p.rut_usuario
       GROUP BY u.rut, u.email, u.nombre
       ORDER BY total_proyecciones DESC`
    );

    console.log("========================================");
    console.log("📊 PROYECCIONES POR USUARIO");
    console.log("========================================\n");

    proyecciones.rows.forEach((row) => {
      console.log(`${row.nombre || row.email}: ${row.total_proyecciones} proyección(es)`);
    });

    console.log("\n========================================");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
}

verificarUsuarios();