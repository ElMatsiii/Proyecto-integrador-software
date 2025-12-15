import express from "express";
import bcrypt from "bcryptjs";
import { generarToken } from "../config/jwt.js";
import { pool } from "../db/conexion.js";
import { autenticarToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: "Faltan usuario o contraseña" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM administradores WHERE usuario = $1",
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const admin = result.rows[0];
    const passwordValido = await bcrypt.compare(password, admin.password_hash);

    if (!passwordValido) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    await pool.query(
      "UPDATE administradores SET ultimo_acceso = NOW() WHERE id = $1",
      [admin.id]
    );

    const token = generarToken({ 
      id: admin.id, 
      usuario: admin.usuario, 
      rol: "admin" 
    });

    res.json({
      token,
      admin: {
        id: admin.id,
        usuario: admin.usuario,
        nombre: admin.nombre,
        email: admin.email
      }
    });
  } catch (error) {
    console.error("Error en login de admin:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.get("/demanda-ramos", autenticarToken, async (req, res) => {
  const { periodo, codigo_carrera } = req.query;

  try {
    let query = `
      SELECT 
        codigo_carrera,
        periodo_proyectado,
        codigo_ramo,
        nombre_ramo,
        cantidad_estudiantes,
        creditos_totales
      FROM demanda_ramos
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (periodo) {
      query += ` AND periodo_proyectado = $${paramIndex}`;
      params.push(periodo);
      paramIndex++;
    }

    if (codigo_carrera) {
      query += ` AND codigo_carrera = $${paramIndex}`;
      params.push(codigo_carrera);
      paramIndex++;
    }

    query += ` ORDER BY cantidad_estudiantes DESC, codigo_ramo`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener demanda:", error);
    res.status(500).json({ error: "Error al obtener demanda de ramos" });
  }
});

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

    const ramosMasDemandados = await pool.query(`
      SELECT 
        codigo_ramo,
        nombre_ramo,
        SUM(cantidad_estudiantes) as total_estudiantes,
        COUNT(DISTINCT codigo_carrera) as carreras_impacto
      FROM demanda_ramos
      GROUP BY codigo_ramo, nombre_ramo
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

router.get("/periodos-disponibles", autenticarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT periodo_proyectado
      FROM proyecciones
      WHERE periodo_proyectado IS NOT NULL
      ORDER BY periodo_proyectado DESC
    `);

    res.json(result.rows.map(r => r.periodo_proyectado));
  } catch (error) {
    console.error("Error al obtener períodos:", error);
    res.status(500).json({ error: "Error al obtener períodos" });
  }
});

export default router;