import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "postgres",
  port: 5432,
});

pool.on("connect", () => console.log("🟢 Conectado a PostgreSQL"));
pool.on("error", (err) => console.error("🔴 Error en conexión:", err.stack));
