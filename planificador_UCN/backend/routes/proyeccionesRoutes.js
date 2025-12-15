import express from "express";
import { pool } from "../db/conexion.js";
import { autenticarToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", autenticarToken, async (req, res) => {
  const { rut } = req.usuario;
  const { 
    codigo_carrera, 
    tipo, 
    nombre, 
    total_creditos, 
    total_ramos, 
    semestres_proyectados, 
    fecha_egreso_estimada, 
    datos_completos,
    periodo_proyectado
  } = req.body;

  if (!codigo_carrera || !tipo || !nombre || !datos_completos) {
    return res.status(400).json({ error: "Faltan parámetros requeridos" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO proyecciones 
       (rut_usuario, codigo_carrera, tipo, nombre, total_creditos, total_ramos, 
        semestres_proyectados, fecha_egreso_estimada, datos_completos, periodo_proyectado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        rut, 
        codigo_carrera, 
        tipo, 
        nombre, 
        total_creditos, 
        total_ramos, 
        semestres_proyectados, 
        fecha_egreso_estimada, 
        JSON.stringify(datos_completos),
        periodo_proyectado
      ]
    );

    res.json({ 
      success: true, 
      proyeccion: result.rows[0],
      mensaje: "Proyección guardada correctamente" 
    });
  } catch (error) {
    console.error("Error al guardar proyección:", error);
    res.status(500).json({ error: "Error al guardar proyección" });
  }
});

router.get("/", autenticarToken, async (req, res) => {
  const { rut } = req.usuario;
  const { codigo_carrera } = req.query;

  try {
    let query = `
      SELECT id, tipo, nombre, fecha_creacion, total_creditos, total_ramos, 
             semestres_proyectados, fecha_egreso_estimada, datos_completos, periodo_proyectado
      FROM proyecciones 
      WHERE rut_usuario = $1
    `;
    const params = [rut];

    if (codigo_carrera) {
      query += " AND codigo_carrera = $2";
      params.push(codigo_carrera);
    }

    query += " ORDER BY fecha_creacion DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener proyecciones:", error);
    res.status(500).json({ error: "Error al obtener proyecciones" });
  }
});

router.get("/:id", autenticarToken, async (req, res) => {
  const { rut } = req.usuario;
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM proyecciones WHERE id = $1 AND rut_usuario = $2",
      [id, rut]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proyección no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener proyección:", error);
    res.status(500).json({ error: "Error al obtener proyección" });
  }
});

router.delete("/:id", autenticarToken, async (req, res) => {
  const { rut } = req.usuario;
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM proyecciones WHERE id = $1 AND rut_usuario = $2 RETURNING id",
      [id, rut]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proyección no encontrada" });
    }

    res.json({ success: true, mensaje: "Proyección eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar proyección:", error);
    res.status(500).json({ error: "Error al eliminar proyección" });
  }
});

export default router;