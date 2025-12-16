import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

// Rutas
import loginRoutes from "./routes/loginRoutes.js";
import mallaRoutes from "./routes/mallaRoutes.js";
import avanceRoutes from "./routes/avanceRoutes.js";
import proyeccionesRoutes from "./routes/proyeccionesRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { autenticarToken } from "./middleware/authMiddleware.js";

// Cargar variables de entorno
dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos
const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

app.get("/", (req, res) => {
  res.redirect("/html/index.html");
});

// Endpoint para obtener malla (proxy a Hawaii API)
app.get("/api/malla", autenticarToken, async (req, res) => {
  const { codigo, catalogo } = req.query;

  if (!codigo || !catalogo) {
    return res.status(400).json({ error: "Faltan parámetros: codigo y catalogo" });
  }

  const url = `https://losvilos.ucn.cl/hawaii/api/mallas?${codigo}-${catalogo}`;
  console.log(`🔍 Solicitando malla → ${url}`);

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

    console.error("❌ Error al conectar con API Hawaii:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Montar rutas
app.use("/api/login", loginRoutes);
app.use("/api/malla", mallaRoutes);
app.use("/api/avance", avanceRoutes);
app.use("/api/proyecciones", proyeccionesRoutes);
app.use("/api/admin", adminRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).send(`
    <h2>404 - Página no encontrada</h2>
    <p>La ruta <b>${req.url}</b> no existe.</p>
  `);
});

// Puerto desde variable de entorno o 3000 por defecto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("========================================");
  console.log(`🚀 Servidor activo en: http://localhost:${PORT}`);
  console.log(`📊 Base de datos: Neon PostgreSQL`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log("========================================");
  console.log("📄 Frontend: /html/index.html");
  console.log("🔌 API Malla: /api/malla");
  console.log("📈 API Proyecciones: /api/proyecciones");
  console.log("👤 Admin: /html/admin-login.html");
  console.log("========================================\n");
});