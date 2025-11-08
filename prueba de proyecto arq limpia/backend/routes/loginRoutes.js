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
    // 🔹 Llamar API real
    const respuesta = await axios.get(
      `https://puclaro.ucn.cl/eross/avance/login.php?email=${email}&password=${password}`
    );

    // 🔹 Si devuelve error
    if (respuesta.data.error) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const { rut, carreras } = respuesta.data;

    // 🔹 Validar estructura mínima
    if (!rut || !Array.isArray(carreras)) {
      console.error("❌ Respuesta inesperada del API:", respuesta.data);
      return res.status(500).json({ error: "Respuesta inválida desde API UCN" });
    }

    // 🔹 Guardar en BD
    await pool.query(
      `INSERT INTO usuarios (rut, email)
       VALUES ($1, $2)
       ON CONFLICT (rut) DO UPDATE SET email = $2`,
      [rut, email]
    );

    for (const c of carreras) {
      await pool.query(
        `INSERT INTO carreras (codigo, nombre, catalogo, rut_usuario)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (codigo, rut_usuario) DO NOTHING`,
        [c.codigo, c.nombre, c.catalogo, rut]
      );
    }

    // 🔹 Crear token JWT
    const token = generarToken({ rut, email });

    res.json({ rut, carreras, token });
  } catch (error) {
    console.error("💥 Error en /api/login:", error.message);
    if (error.response) {
      console.error("Respuesta:", error.response.data);
    }
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
