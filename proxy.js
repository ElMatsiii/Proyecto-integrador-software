import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));

app.get("/api/malla", async (req, res) => {
  const { codigo, catalogo } = req.query;

  if (!codigo || !catalogo) {
    return res.status(400).json({ error: "Faltan parámetros: codigo y catalogo" });
  }

  const url = `https://losvilos.ucn.cl/hawaii/api/mallas?${codigo}-${catalogo}`;

  try {
    console.log("🔗 Solicitando malla:", url);

    const response = await axios.get(url, {
      headers: {
        "X-HAWAII-AUTH": "jf400fejof13f",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "application/json",
      },
      httpsAgent: new (await import("https")).Agent({ keepAlive: true, minVersion: "TLSv1.2" }),
    });

    console.log("✅ Código de respuesta:", response.status);
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      console.error("❌ Error HTTP:", error.response.status, error.response.data);
      return res.status(error.response.status).json(error.response.data);
    }
    console.error("❌ Error al conectar con API Hawaii:", error.message);
    res.status(500).json({ error: "Error al conectar con API Hawaii" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Proxy escuchando en http://localhost:${PORT}`));
