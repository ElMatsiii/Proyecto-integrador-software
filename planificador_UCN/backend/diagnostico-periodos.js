import { pool } from "./db/conexion.js";

async function diagnosticarPeriodos() {
  console.log("========================================");
  console.log("🔍 DIAGNÓSTICO DE PERIODOS EN BD");
  console.log("========================================\n");

  try {
    // 1. Verificar cuántas proyecciones hay
    console.log("📊 [1/5] Contando proyecciones...");
    const totalProyecciones = await pool.query(
      "SELECT COUNT(*) as total FROM proyecciones"
    );
    console.log(`   Total de proyecciones: ${totalProyecciones.rows[0].total}\n`);

    if (totalProyecciones.rows[0].total === "0") {
      console.log("⚠️  No hay proyecciones en la base de datos.");
      console.log("   Crea una proyección desde el frontend primero.\n");
      await pool.end();
      return;
    }

    // 2. Ver estructura completa de una proyección
    console.log("📋 [2/5] Examinando estructura de proyecciones...");
    const sample = await pool.query(`
      SELECT 
        id,
        nombre,
        tipo,
        codigo_carrera,
        periodo_proyectado,
        datos_completos
      FROM proyecciones
      LIMIT 1
    `);

    if (sample.rows.length > 0) {
      const proy = sample.rows[0];
      console.log(`   ID: ${proy.id}`);
      console.log(`   Nombre: ${proy.nombre}`);
      console.log(`   Tipo: ${proy.tipo}`);
      console.log(`   Carrera: ${proy.codigo_carrera}`);
      console.log(`   Periodo Proyectado (columna): ${proy.periodo_proyectado}`);
      console.log(`\n   📦 Estructura de datos_completos:`);
      console.log(JSON.stringify(proy.datos_completos, null, 2));
    }

    // 3. Verificar si los ramos tienen el campo 'periodo'
    console.log("\n🔎 [3/5] Verificando campo 'periodo' en ramos...");
    const ramosConPeriodo = await pool.query(`
      SELECT 
        p.id,
        p.nombre,
        jsonb_array_length(p.datos_completos->'ramos') as total_ramos,
        COUNT(*) FILTER (
          WHERE (ramo->>'periodo') IS NOT NULL 
          AND (ramo->>'periodo')::TEXT != ''
          AND (ramo->>'periodo')::TEXT != 'null'
        ) as ramos_con_periodo
      FROM proyecciones p
      CROSS JOIN LATERAL jsonb_array_elements(p.datos_completos->'ramos') as ramo
      GROUP BY p.id, p.nombre, p.datos_completos
    `);

    console.log("\n   Proyección               | Total Ramos | Ramos con Periodo");
    console.log("   " + "-".repeat(65));
    ramosConPeriodo.rows.forEach(row => {
      const nombreCorto = row.nombre.substring(0, 22).padEnd(23);
      const total = String(row.total_ramos).padEnd(11);
      const conPeriodo = String(row.ramos_con_periodo).padEnd(17);
      console.log(`   ${nombreCorto} | ${total} | ${conPeriodo}`);
    });

    // 4. Extraer periodos únicos encontrados
    console.log("\n📅 [4/5] Extrayendo periodos únicos...");
    const periodosUnicos = await pool.query(`
      SELECT DISTINCT 
        (ramo->>'periodo')::TEXT as periodo,
        COUNT(*) as cantidad_ramos
      FROM proyecciones p
      CROSS JOIN LATERAL jsonb_array_elements(p.datos_completos->'ramos') as ramo
      WHERE (ramo->>'periodo') IS NOT NULL
      GROUP BY (ramo->>'periodo')::TEXT
      ORDER BY periodo DESC
    `);

    if (periodosUnicos.rows.length > 0) {
      console.log("\n   Periodo    | Cantidad de Ramos");
      console.log("   " + "-".repeat(35));
      periodosUnicos.rows.forEach(row => {
        const periodo = String(row.periodo || "NULL").padEnd(10);
        console.log(`   ${periodo} | ${row.cantidad_ramos}`);
      });
    } else {
      console.log("   ⚠️  No se encontraron periodos en los ramos");
    }

    // 5. Ver un ejemplo de ramo con y sin periodo
    console.log("\n📝 [5/5] Ejemplos de ramos...");
    const ejemploRamos = await pool.query(`
      SELECT 
        p.nombre as proyeccion,
        ramo->>'codigo' as codigo,
        ramo->>'nombre' as nombre_ramo,
        ramo->>'creditos' as creditos,
        ramo->>'periodo' as periodo,
        ramo->>'nivel' as nivel
      FROM proyecciones p
      CROSS JOIN LATERAL jsonb_array_elements(p.datos_completos->'ramos') as ramo
      LIMIT 5
    `);

    console.log("\n   Ejemplos de ramos en la base de datos:");
    console.log("   " + "-".repeat(80));
    ejemploRamos.rows.forEach((ramo, index) => {
      console.log(`\n   Ramo ${index + 1}:`);
      console.log(`     Proyección: ${ramo.proyeccion}`);
      console.log(`     Código: ${ramo.codigo}`);
      console.log(`     Nombre: ${ramo.nombre_ramo}`);
      console.log(`     Créditos: ${ramo.creditos}`);
      console.log(`     Periodo: ${ramo.periodo || '❌ NULL/VACÍO'}`);
      console.log(`     Nivel: ${ramo.nivel}`);
    });

    // 6. Probar la query exacta de adminRoutes
    console.log("\n\n🧪 [BONUS] Probando query de adminRoutes...");
    const queryAdmin = `
      SELECT 
        p.codigo_carrera,
        (ramo->>'periodo')::TEXT as periodo_ramo,
        (ramo->>'codigo')::TEXT as codigo_ramo,
        (ramo->>'nombre')::TEXT as nombre_ramo,
        COUNT(DISTINCT p.rut_usuario) as cantidad_estudiantes
      FROM proyecciones p
      CROSS JOIN LATERAL jsonb_array_elements(p.datos_completos->'ramos') as ramo
      WHERE (ramo->>'periodo') IS NOT NULL
        AND (ramo->>'periodo')::TEXT != ''
        AND (ramo->>'periodo')::TEXT != 'null'
      GROUP BY p.codigo_carrera, (ramo->>'periodo')::TEXT, (ramo->>'codigo')::TEXT, (ramo->>'nombre')::TEXT
      LIMIT 5
    `;

    const resultAdmin = await pool.query(queryAdmin);
    
    if (resultAdmin.rows.length > 0) {
      console.log("\n   ✅ Query de adminRoutes funciona correctamente");
      console.log("   Primeros resultados:");
      console.log("   " + "-".repeat(80));
      resultAdmin.rows.forEach((row, index) => {
        console.log(`\n   ${index + 1}. ${row.nombre_ramo}`);
        console.log(`      Código: ${row.codigo_ramo}`);
        console.log(`      Carrera: ${row.codigo_carrera}`);
        console.log(`      Periodo: ${row.periodo_ramo}`);
        console.log(`      Estudiantes: ${row.cantidad_estudiantes}`);
      });
    } else {
      console.log("\n   ❌ Query de adminRoutes no retorna resultados");
      console.log("   Esto significa que los ramos NO tienen el campo 'periodo' o está vacío");
    }

    console.log("\n========================================");
    console.log("✅ DIAGNÓSTICO COMPLETADO");
    console.log("========================================\n");

    // Conclusiones
    console.log("💡 CONCLUSIONES:\n");
    
    if (periodosUnicos.rows.length === 0) {
      console.log("❌ PROBLEMA ENCONTRADO:");
      console.log("   Los ramos en la base de datos NO tienen el campo 'periodo'");
      console.log("   o el campo está vacío/null.\n");
      console.log("🔧 SOLUCIÓN:");
      console.log("   1. Verifica proyeccionController.js línea ~400-420");
      console.log("   2. Busca donde se crea el objeto del ramo");
      console.log("   3. Asegúrate que incluya: periodo: formatearPeriodoCorto(semestreActual)");
      console.log("   4. Crea una NUEVA proyección desde el frontend");
      console.log("   5. Las proyecciones antiguas NO tendrán periodos\n");
    } else if (resultAdmin.rows.length === 0) {
      console.log("⚠️  PROBLEMA PARCIAL:");
      console.log("   Los periodos existen pero están en formato incorrecto");
      console.log("   Periodos encontrados:", periodosUnicos.rows.map(r => r.periodo).join(", "));
      console.log("\n🔧 SOLUCIÓN:");
      console.log("   Revisa el formato de periodo en proyeccionController.js");
      console.log("   Debe ser: '2025-1' o '2025-2', no números como 202510\n");
    } else {
      console.log("✅ Todo parece estar correcto en la base de datos");
      console.log("   Si aún no ves periodos en el frontend:");
      console.log("   1. Verifica la consola del navegador");
      console.log("   2. Revisa la respuesta de la API en Network tab");
      console.log("   3. Verifica admin-dashboard.html línea ~200-250\n");
    }

  } catch (error) {
    console.error("❌ Error durante diagnóstico:", error);
    console.error("Stack:", error.stack);
  } finally {
    await pool.end();
  }
}

diagnosticarPeriodos();