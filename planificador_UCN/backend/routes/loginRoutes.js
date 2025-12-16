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
    console.log(`🔐 Intentando login para: ${email}`);

    // 1. Validar con API externa de UCN
    const respuesta = await axios.get(
      `https://puclaro.ucn.cl/eross/avance/login.php?email=${email}&password=${password}`
    );

    if (respuesta.data.error) {
      console.log(`❌ Login fallido para: ${email}`);
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const { rut, carreras, nombre } = respuesta.data;

    if (!rut || !Array.isArray(carreras)) {
      console.error("⚠️ Respuesta inesperada del API:", respuesta.data);
      return res.status(500).json({ error: "Respuesta inválida desde API UCN" });
    }

    console.log(`✅ Login exitoso - RUT: ${rut}, Nombre: ${nombre || 'No proporcionado'}`);

    // 2. Registrar/actualizar usuario en base de datos Neon
    try {
      await pool.query(
        `INSERT INTO usuarios (rut, email, nombre, fecha_login)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (rut) 
         DO UPDATE SET 
           email = EXCLUDED.email,
           nombre = COALESCE(EXCLUDED.nombre, usuarios.nombre),
           fecha_login = NOW()`,
        [rut, email, nombre || email.split('@')[0]]
      );
      
      console.log(`📝 Usuario registrado/actualizado en BD: ${rut}`);
    } catch (dbError) {
      console.error("⚠️ Error al guardar usuario en BD:", dbError);
      // No bloqueamos el login si falla el registro en BD
    }

    // 3. Generar token JWT
    const token = generarToken({ rut, email });

    console.log(`🎟️ Token generado para: ${email}\n`);

    // 4. Responder con token y datos
    res.json({ 
      rut, 
      carreras, 
      token,
      nombre: nombre || email.split('@')[0]
    });
    
  } catch (error) {
    console.error("❌ Error en /api/login:", error.message);
    
    if (error.response) {
      console.error("📡 Respuesta API:", error.response.data);
    }
    
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;