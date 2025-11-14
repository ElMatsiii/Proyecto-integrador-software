import express from "express";
import axios from "axios";
import { generarToken } from "../config/jwt.js";
import { pool } from "../db/conexion.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Faltan email o contraseña" });
  }

  try {
    const respuesta = await axios.get(
      `https://puclaro.ucn.cl/eross/avance/login.php?email=${email}&password=${password}`
    );

    if (respuesta.data.error) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const { rut, carreras } = respuesta.data;

    if (!rut || !Array.isArray(carreras)) {
      console.error("Respuesta inesperada del API:", respuesta.data);
      return res.status(500).json({ error: "Respuesta inválida desde API UCN" });
    }

    await pool.query(
      `INSERT INTO usuarios (rut, email)
       VALUES ($1, $2)
       ON CONFLICT (rut) DO UPDATE SET email = $2`,
      [rut, email]
    );

    const token = generarToken({ rut, email });

    res.json({ rut, carreras, token });
    
  } catch (error) {
    console.error("Error en /api/login:", error.message);
    if (error.response) {
      console.error("Respuesta:", error.response.data);
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;