import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// Configuración para Neon
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Configuración optimizada para serverless
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on("connect", () => console.log("Conectado a Neon PostgreSQL"));
pool.on("error", (err) => console.error("Error en conexión Neon:", err.stack));

// Test de conexión inicial
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Error al conectar con Neon:", err);
  } else {
    console.log("Neon conectado exitosamente:", res.rows[0].now);
  }
});