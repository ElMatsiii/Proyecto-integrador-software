import express from "express";
import bcrypt from "bcryptjs";
import { generarToken } from "../config/jwt.js";
import { pool } from "../db/conexion.js";
import { autenticarToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  console.log("=== DEBUG LOGIN ADMIN ===");
  console.log("Usuario recibido:", usuario);
  console.log("Password recibido:", password ? "*" : "vacío");

  if (!usuario || !password) {
    console.log("Error: Faltan credenciales");
    return res.status(400).json({ error: "Faltan usuario o contraseña" });
  }

  try {
    console.log("Buscando admin con email:", usuario);
    
    const result = await pool.query(
      "SELECT * FROM administradores WHERE email = $1",
      [usuario]
    );

    console.log("Admins encontrados:", result.rows.length);

    if (result.rows.length === 0) {
      console.log("Error: No se encontró admin con ese email");
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const admin = result.rows[0];
    console.log("Admin encontrado:", admin.email);
    console.log("Hash en BD:", admin.password_hash.substring(0, 20) + "...");
    
    const passwordValido = await bcrypt.compare(password, admin.password_hash);
    console.log("Password válido:", passwordValido);

    if (!passwordValido) {
      console.log("Error: Password incorrecto");
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    await pool.query(
      "UPDATE administradores SET ultimo_acceso = NOW() WHERE id = $1",
      [admin.id]
    );

    const token = generarToken({ 
      id: admin.id, 
      email: admin.email, 
      rol: "admin" 
    });

    console.log("Login exitoso, enviando token");
    console.log("=== FIN DEBUG ===");

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        nombre: admin.nombre
      }
    });
  } catch (error) {
    console.error("Error en login de admin:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ============================================================================
// CAMBIO PRINCIPAL: Query corregida que lee periodo de cada ramo individual
// ============================================================================
router.get("/demanda-ramos", autenticarToken, async (req, res) => {
  const { periodo, codigo_carrera } = req.query;

  try {
    console.log("=== QUERY DEMANDA RAMOS ===");
    console.log("Periodo solicitado:", periodo);
    console.log("Carrera solicitada:", codigo_carrera);

    // Query CORREGIDA: Lee el periodo individual de cada ramo desde el JSON
    let query = `
      SELECT 
        p.codigo_carrera,
        (ramo->>'periodo')::TEXT as periodo_ramo,
        (ramo->>'codigo')::TEXT as codigo_ramo,
        (ramo->>'nombre')::TEXT as nombre_ramo,
        COUNT(DISTINCT p.rut_usuario) as cantidad_estudiantes,
        SUM(COALESCE((ramo->>'creditos')::INT, 0)) as creditos_totales,
        AVG(COALESCE((ramo->>'creditos')::INT, 0)) as creditos_promedio
      FROM proyecciones p
      CROSS JOIN LATERAL jsonb_array_elements(p.datos_completos->'ramos') as ramo
      WHERE (ramo->>'periodo') IS NOT NULL
    `;
    
    const params = [];
    let paramIndex = 1;

    if (periodo) {
      query += ` AND (ramo->>'periodo')::TEXT = $${paramIndex}`;
      params.push(periodo);
      paramIndex++;
    }

    if (codigo_carrera) {
      query += ` AND p.codigo_carrera = $${paramIndex}`;
      params.push(codigo_carrera);
      paramIndex++;
    }

    query += `
      GROUP BY p.codigo_carrera, (ramo->>'periodo')::TEXT, (ramo->>'codigo')::TEXT, (ramo->>'nombre')::TEXT
      ORDER BY cantidad_estudiantes DESC, codigo_ramo
    `;

    console.log("Query ejecutada:", query);
    console.log("Parámetros:", params);

    const result = await pool.query(query, params);
    
    console.log("Resultados encontrados:", result.rows.length);
    if (result.rows.length > 0) {
      console.log("Ejemplo de resultado:", result.rows[0]);
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener demanda:", error);
    res.status(500).json({ error: "Error al obtener demanda de ramos" });
  }
});

// ============================================================================
// CAMBIO SECUNDARIO: Estadísticas también usan periodo individual
// ============================================================================
router.get("/estadisticas", autenticarToken, async (req, res) => {
  try {
    const totalProyecciones = await pool.query(
      "SELECT COUNT(*) as total FROM proyecciones"
    );

    const totalEstudiantes = await pool.query(
      "SELECT COUNT(DISTINCT rut_usuario) as total FROM proyecciones"
    );

    const proyeccionesPorCarrera = await pool.query(`
      SELECT 
        codigo_carrera,
        COUNT(*) as cantidad_proyecciones,
        COUNT(DISTINCT rut_usuario) as estudiantes_unicos
      FROM proyecciones
      GROUP BY codigo_carrera
      ORDER BY cantidad_proyecciones DESC
    `);

    // Query CORREGIDA: Lee periodo individual de cada ramo
    const ramosMasDemandados = await pool.query(`
      SELECT 
        (ramo->>'codigo')::TEXT as codigo_ramo,
        (ramo->>'nombre')::TEXT as nombre_ramo,
        COUNT(DISTINCT p.rut_usuario) as total_estudiantes,
        COUNT(DISTINCT p.codigo_carrera) as carreras_impacto
      FROM proyecciones p
      CROSS JOIN LATERAL jsonb_array_elements(p.datos_completos->'ramos') as ramo
      WHERE (ramo->>'periodo') IS NOT NULL
      GROUP BY (ramo->>'codigo')::TEXT, (ramo->>'nombre')::TEXT
      ORDER BY total_estudiantes DESC
      LIMIT 10
    `);

    res.json({
      total_proyecciones: parseInt(totalProyecciones.rows[0].total),
      total_estudiantes: parseInt(totalEstudiantes.rows[0].total),
      proyecciones_por_carrera: proyeccionesPorCarrera.rows,
      ramos_mas_demandados: ramosMasDemandados.rows
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

// ============================================================================
// CAMBIO TERCIARIO: Periodos disponibles lee de periodos individuales
// ============================================================================
router.get("/periodos-disponibles", autenticarToken, async (req, res) => {
  try {
    // Query CORREGIDA: Lee periodos únicos de los ramos individuales
    const result = await pool.query(`
      SELECT DISTINCT (ramo->>'periodo')::TEXT as periodo_proyectado
      FROM proyecciones p
      CROSS JOIN LATERAL jsonb_array_elements(p.datos_completos->'ramos') as ramo
      WHERE (ramo->>'periodo') IS NOT NULL
      ORDER BY periodo_proyectado DESC
    `);

    res.json(result.rows.map(r => r.periodo_proyectado));
  } catch (error) {
    console.error("Error al obtener períodos:", error);
    res.status(500).json({ error: "Error al obtener períodos" });
  }
});

export default router;