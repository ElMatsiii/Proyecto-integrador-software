import express from "express";
import axios from "axios";
import https from "https";
import { pool } from "../db/conexion.js";

const router = express.Router();
const API_MALLA = "https://losvilos.ucn.cl/hawaii/api/mallas";

router.get("/", async (req, res) => {
  const { codigo, catalogo } = req.query;

  if (!codigo || !catalogo) {
    return res.status(400).json({ error: "Faltan parámetros: codigo y catalogo" });
  }

  try {
    // Verificar si ya existe la malla guardada
    const result = await pool.query(
      "SELECT * FROM mallas WHERE codigo_carrera = $1 LIMIT 1",
      [codigo]
    );

    if (result.rows.length > 0) {
      console.log("📦 Malla recuperada desde BD");
      return res.json(result.rows);
    }

    // Si no existe → pedir a la API real
    const response = await axios.get(`${API_MALLA}?${codigo}-${catalogo}`, {
      headers: {
        "X-HAWAII-AUTH": "jf400fejof13f",
        "User-Agent": "PlanificadorUCN/1.0",
        Accept: "application/json",
      },
      httpsAgent: new https.Agent({ keepAlive: true, minVersion: "TLSv1.2" }),
    });

    const malla = response.data;

    // Guardar los ramos en la BD
    for (const ramo of malla) {
      await pool.query(
        `INSERT INTO mallas (codigo_asignatura, nombre_asignatura, creditos, nivel, prerequisitos, codigo_carrera)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          ramo.codigo,
          ramo.asignatura,
          ramo.creditos,
          ramo.nivel,
          ramo.prereq,
          codigo,
        ]
      );
    }

    console.log("💾 Malla guardada en BD");
    res.json(malla);
  } catch (error) {
    console.error("💥 Error al obtener malla:", error.message);
    res.status(500).json({ error: "Error al obtener malla" });
  }
});

export default router;
