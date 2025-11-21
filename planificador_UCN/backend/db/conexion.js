import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "postgres",
  port: 5433,
  // Forzar el search_path en la cadena de conexión
  options: "-c search_path=public"
});

pool.on("connect", () => console.log("Conectado a PostgreSQL"));
pool.on("error", (err) => console.error("Error en conexión:", err.stack));