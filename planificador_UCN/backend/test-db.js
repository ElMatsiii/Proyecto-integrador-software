import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "postgres",
  port: 5432,
});

async function testProyecciones() {
  const client = await pool.connect();
  try {
    console.log("Probando conexión...");
    
    const dbInfo = await client.query("SELECT current_database(), current_user, version();");
    console.log("Base de datos actual:", dbInfo.rows[0]);
    
    const tables = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    console.log("Tablas en public:", tables.rows);
    
    const proyecciones = await client.query(`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE tablename LIKE '%proyec%';
    `);
    console.log("Tablas con 'proyec':", proyecciones.rows);
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testProyecciones();