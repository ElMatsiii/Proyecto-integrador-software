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

    const mallaPorCodigo = {};
    malla.forEach((ramo) => {
      const codigoNormalizado = normalizarCodigo(ramo.codigo);
      mallaPorCodigo[codigoNormalizado] = ramo;
    });

    const ramosPorCodigo = {};
    
    avance.forEach((r) => {
      const codigoNormalizado = normalizarCodigo(r.course);
      const datosMalla = mallaPorCodigo[codigoNormalizado];
      
      const nombreMalla = datosMalla?.asignatura;
      const nombreAvance = r.course_name;
      const nombre = obtenerNombreRamo(r.course, nombreMalla || nombreAvance);
      
      if (!ramosPorCodigo[codigoNormalizado]) {
        ramosPorCodigo[codigoNormalizado] = {
          codigo: r.course,
          nombre: nombre,
          creditos: datosMalla?.creditos || r.credits || 0,
          nivel: datosMalla?.nivel || "—",
          veces: 0,
          periodos: [],
          estados: []
        };
      }
      
      ramosPorCodigo[codigoNormalizado].veces++;
      ramosPorCodigo[codigoNormalizado].periodos.push(r.period || r.periodo || "—");
      ramosPorCodigo[codigoNormalizado].estados.push(r.status || "—");
    });

    const avanceAgrupado = Object.values(ramosPorCodigo);

    avanceAgrupado.forEach((ramo) => {
      if (ramo.estados.includes("APROBADO")) {
        ramo.estadoFinal = "APROBADO";
      } else if (ramo.estados.includes("INSCRITO") || ramo.estados.includes("EN_CURSO")) {
        ramo.estadoFinal = "INSCRITO";
      } else if (ramo.estados.includes("REPROBADO")) {
        ramo.estadoFinal = "REPROBADO";
      } else {
        ramo.estadoFinal = ramo.estados[ramo.estados.length - 1];
      }
    });

    const total = malla.length;
    const aprobados = avanceAgrupado.filter((r) => r.estadoFinal === "APROBADO").length;
    const reprobados = avanceAgrupado.filter((r) => r.estadoFinal === "REPROBADO").length;
    const inscritos = avanceAgrupado.filter((r) => ["INSCRITO", "EN_CURSO"].includes(r.estadoFinal)).length;
    const pendientes = total - aprobados - reprobados - inscritos;

    const creditosAprobados = avanceAgrupado
      .filter((r) => r.estadoFinal === "APROBADO")
      .reduce((sum, r) => sum + Number(r.creditos || 0), 0);

    const creditosTotales = malla.reduce((sum, r) => sum + Number(r.creditos || 0), 0);

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
            <th>Períodos Cursados</th>
            <th>Veces Cursado</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${avanceAgrupado.map((r) => {
            const estadoClass = 
              r.estadoFinal === "APROBADO" ? "aprobado" :
              r.estadoFinal === "REPROBADO" ? "reprobado" :
              ["INSCRITO", "EN_CURSO"].includes(r.estadoFinal) ? "inscrito" : "";
            
            const periodosTexto = r.periodos.length > 3
              ? r.periodos.slice(-3).join(", ") + "..."
              : r.periodos.join(", ");
            
            return `
              <tr class="${estadoClass}">
                <td>${r.nombre}</td>
                <td>${r.codigo}</td>
                <td>${r.creditos}</td>
                <td>${r.nivel}</td>
                <td>${periodosTexto}</td>
                <td>${r.veces}</td>
                <td>${r.estadoFinal}</td>
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