import { obtenerAvance, obtenerMalla } from "../services/apiService.js";
import { storage } from "../services/storageService.js";
import { mostrarError, normalizarCodigo, obtenerNombreRamo } from "../services/utils.js";

export async function initResumen() {
  const main = document.querySelector("main");
  const auth = storage.requireAuth();
  const carrera = storage.getCarrera();

  if (!carrera) {
    return mostrarError("No se ha seleccionado una carrera", main);
  }

  try {
    const [avance, malla] = await Promise.all([
      obtenerAvance(auth.rut, carrera.codigo),
      obtenerMalla(carrera.codigo, carrera.catalogo),
    ]);

    if (!Array.isArray(avance)) {
      return mostrarError("No se pudo cargar avance académico", main);
    }

    if (!Array.isArray(malla)) {
      return mostrarError("No se pudo cargar la malla curricular", main);
    }

    // Crear un mapa de la malla para búsqueda rápida
    const mallaPorCodigo = {};
    malla.forEach((ramo) => {
      const codigoNormalizado = normalizarCodigo(ramo.codigo);
      mallaPorCodigo[codigoNormalizado] = ramo;
    });

    // Enriquecer avance con datos de la malla
    const avanceEnriquecido = avance.map((r) => {
      const codigoNormalizado = normalizarCodigo(r.course);
      const datosMalla = mallaPorCodigo[codigoNormalizado];
      
      // 🔹 Usar la nueva función para obtener el nombre
      const nombreMalla = datosMalla?.asignatura;
      const nombreAvance = r.course_name;
      const nombre = obtenerNombreRamo(r.course, nombreMalla || nombreAvance);
      
      return {
        codigo: r.course,
        nombre: nombre,
        creditos: datosMalla?.creditos || r.credits || 0,
        periodo: r.period || r.periodo || "—",
        estado: r.status || "—",
        nivel: datosMalla?.nivel || "—"
      };
    });

    // Calcular estadísticas
    const total = malla.length;
    const aprobados = avanceEnriquecido.filter((r) => r.estado === "APROBADO").length;
    const reprobados = avanceEnriquecido.filter((r) => r.estado === "REPROBADO").length;
    const inscritos = avanceEnriquecido.filter((r) => ["INSCRITO", "EN_CURSO"].includes(r.estado)).length;
    const pendientes = total - aprobados - reprobados - inscritos;

    const creditosAprobados = avanceEnriquecido
      .filter((r) => r.estado === "APROBADO")
      .reduce((sum, r) => sum + Number(r.creditos || 0), 0);

    const creditosTotales = malla.reduce((sum, r) => sum + Number(r.creditos || 0), 0);

    // Renderizar dashboard
    main.innerHTML = `
      <h2>Resumen Académico</h2>
      <p><strong>Carrera:</strong> ${carrera.nombre}</p>
      <p><strong>RUT:</strong> ${auth.rut}</p>

      <div class="dashboard">
        <p><strong>Avance de carrera:</strong><br>${((aprobados / total) * 100).toFixed(1)}%</p>
        <p><strong>Ramos aprobados:</strong><br>${aprobados} / ${total}</p>
        <p><strong>Ramos reprobados:</strong><br>${reprobados}</p>
        <p><strong>Ramos en curso:</strong><br>${inscritos}</p>
        <p><strong>Ramos pendientes:</strong><br>${pendientes}</p>
        <p><strong>Créditos aprobados:</strong><br>${creditosAprobados} / ${creditosTotales}</p>
      </div>

      <h3>Detalle del Avance Académico</h3>
      <table class="tabla-avance">
        <thead>
          <tr>
            <th>Asignatura</th>
            <th>Código</th>
            <th>Créditos</th>
            <th>Semestre</th>
            <th>Período Cursado</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${avanceEnriquecido.map((r) => {
            const estadoClass = 
              r.estado === "APROBADO" ? "aprobado" :
              r.estado === "REPROBADO" ? "reprobado" :
              ["INSCRITO", "EN_CURSO"].includes(r.estado) ? "inscrito" : "";
            
            return `
              <tr class="${estadoClass}">
                <td>${r.nombre}</td>
                <td>${r.codigo}</td>
                <td>${r.creditos}</td>
                <td>${r.nivel}</td>
                <td>${r.periodo}</td>
                <td>${r.estado}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;

  } catch (error) {
    console.error("Error al cargar resumen:", error);
    mostrarError("Error al cargar el resumen académico. Intenta nuevamente.", main);
  }
}