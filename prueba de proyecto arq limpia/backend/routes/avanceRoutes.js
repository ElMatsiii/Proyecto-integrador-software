import express from "express";
import axios from "axios";

const router = express.Router();
const API_AVANCE = "https://puclaro.ucn.cl/eross/avance/avance.php";

router.get("/", async (req, res) => {
  const { rut, codcarrera } = req.query;

  if (!rut || !codcarrera) {
    return res.status(400).json({ error: "Faltan parámetros: rut o codcarrera" });
  }

  try {
    // Consultar directamente la API externa sin verificar BD
    const response = await axios.get(API_AVANCE, {
      params: { rut, codcarrera },
    });

    const avance = response.data;
    
    console.log("✅ Avance obtenido de API externa");
    res.json(avance);
    
  } catch (error) {
    console.error("💥 Error al obtener avance:", error.message);
    res.status(500).json({ error: "Error al obtener avance desde API externa" });
  }
});

export default router;