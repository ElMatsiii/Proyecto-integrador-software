import express from "express";
import axios from "axios";
import https from "https";

const router = express.Router();
const API_MALLA = "https://losvilos.ucn.cl/hawaii/api/mallas";

router.get("/", async (req, res) => {
  const { codigo, catalogo } = req.query;

  if (!codigo || !catalogo) {
    return res.status(400).json({ error: "Faltan parámetros: codigo y catalogo" });
  }

  try {
    // Consultar directamente la API externa sin verificar BD
    const response = await axios.get(`${API_MALLA}?${codigo}-${catalogo}`, {
      headers: {
        "X-HAWAII-AUTH": "jf400fejof13f",
        "User-Agent": "PlanificadorUCN/1.0",
        Accept: "application/json",
      },
      httpsAgent: new https.Agent({ keepAlive: true, minVersion: "TLSv1.2" }),
    });

    const malla = response.data;
    
    console.log("✅ Malla obtenida de API externa");
    res.json(malla);
    
  } catch (error) {
    console.error("💥 Error al obtener malla:", error.message);
    res.status(500).json({ error: "Error al obtener malla desde API externa" });
  }
});

export default router;