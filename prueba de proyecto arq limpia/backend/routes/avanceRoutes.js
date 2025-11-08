import express from "express";
import axios from "axios";
import { pool } from "../db/conexion.js";

const router = express.Router();
const API_AVANCE = "https://puclaro.ucn.cl/eross/avance/avance.php";

router.get("/", async (req, res) => {
  const { rut, codcarrera } = req.query;

  if (!rut || !codcarrera) {
    return res.status(400).json({ error: "Faltan parámetros: rut o codcarrera" });
  }

  try {
    // Consultar si ya existe avance en BD
    const result = await pool.query(
      "SELECT * FROM avances WHERE rut_usuario = $1 AND codigo_carrera = $2 LIMIT 1",
      [rut, codcarrera]
    );

    if (result.rows.length > 0) {
      console.log("📦 Avance recuperado desde BD");
      return res.json(result.rows);
    }

    // Si no existe → pedir a la API real
    const response = await axios.get(API_AVANCE, {
      params: { rut, codcarrera },
    });

    const avance = response.data;
    if (!Array.isArray(avance)) {
      console.warn("⚠️ Avance no es array:", avance);
      return res.status(200).json(avance);
    }

    // Guardar en BD
    for (const ramo of avance) {
      await pool.query(
        `INSERT INTO avances (rut_usuario, codigo_carrera, periodo, estado, asignatura, creditos)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [rut, codcarrera, ramo.period, ramo.status, ramo.course, ramo.credits || 0]
      );
    }

    console.log("💾 Avance guardado en BD");
    res.json(avance);
  } catch (error) {
    console.error("💥 Error al obtener avance:", error.message);
    res.status(500).json({ error: "Error al obtener avance" });
  }
});

export default router;
