// ===============================
// 🔰 PROYECTO PLANIFICADOR DE MALLA
// Servidor backend + proxy API + frontend estático
// ===============================
import loginRoutes from "./routes/loginRoutes.js";
import mallaRoutes from "./routes/mallaRoutes.js";
import avanceRoutes from "./routes/avanceRoutes.js";
import { autenticarToken } from "./middleware/authMiddleware.js";
import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

// ===============================
// 📁 CONFIGURACIÓN BÁSICA
// ===============================
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use("/api/login", loginRoutes);

// Rutas absolutas seguras (compatibles con ESModules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// 🗂️ SERVIR FRONTEND ESTÁTICO
// ===============================
// Subimos un nivel porque estamos dentro de /backend
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// Redirigir raíz al login automáticamente
app.get("/", (req, res) => {
  res.redirect("/html/index.html");
});

// ===============================
// 🔌 RUTA API (PROXY)
// ===============================
app.get("/api/malla",autenticarToken,async (req, res) => {
  const { codigo, catalogo } = req.query;

  if (!codigo || !catalogo) {
    return res.status(400).json({ error: "Faltan parámetros: codigo y catalogo" });
  }

  const url = `https://losvilos.ucn.cl/hawaii/api/mallas?${codigo}-${catalogo}`;
  console.log(`🌐 Solicitando a Hawaii API → ${url}`);

  try {
    const response = await axios.get(url, {
      headers: {
        "X-HAWAII-AUTH": "jf400fejof13f",
        "User-Agent": "PlanificadorUCN/1.0",
        Accept: "application/json",
      },
      httpsAgent: new https.Agent({ keepAlive: true, minVersion: "TLSv1.2" }),
    });

    console.log(`✅ Respuesta ${response.status}`);
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      console.error(`❌ Error HTTP ${error.response.status}:`, error.response.data);
      return res.status(error.response.status).json(error.response.data || { error: "Error desconocido en API" });
    }

    console.error("💥 Error al conectar con API Hawaii:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Rutas nuevas
app.use("/api/login", loginRoutes);
app.use("/api/malla", mallaRoutes);
app.use("/api/avance", avanceRoutes);

// ===============================
// 🚫 MANEJO DE RUTAS INVÁLIDAS
// ===============================
app.use((req, res) => {
  res.status(404).send(`
    <h2>404 - Página no encontrada</h2>
    <p>La ruta <b>${req.url}</b> no existe.</p>
  `);
});

// ===============================
// 🧩 LOGS Y SERVIDOR
// ===============================
const PORT = 3000;
app.listen(PORT, () => {
  console.log("========================================");
  console.log(`🚀 Servidor activo en: http://localhost:${PORT}`);
  console.log("🌐 Frontend disponible en: /html/index.html");
  console.log("📡 Endpoint API disponible en: /api/malla");
  console.log("========================================\n");
});
