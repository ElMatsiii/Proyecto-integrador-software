import { obtenerMalla } from "../services/apiService.js";
import { storage } from "../services/storageService.js";
import { mostrarError, obtenerNombreRamo } from "../services/utils.js";

export async function initMalla() {
  const main = document.querySelector("main");
  
  if (!main) {
    console.error("No se encontró el elemento main");
    return;
  }

  const auth = storage.requireAuth();
  const carrera = storage.getCarrera();

  if (!carrera) {
    mostrarError("Carrera no encontrada", main);
    return;
  }

  main.innerHTML = `
    <h2>Malla Curricular</h2>
    <p>Cargando malla de ${carrera.nombre}...</p>
  `;

  try {
    const data = await obtenerMalla(carrera.codigo, carrera.catalogo);
    
    if (!Array.isArray(data) || data.length === 0) {
      mostrarError("No hay datos de malla disponibles", main);
      return;
    }

    const niveles = {};
    data.forEach((ramo) => {
      const nivel = ramo.nivel || 0;
      if (!niveles[nivel]) niveles[nivel] = [];
      niveles[nivel].push(ramo);
    });

    let html = `
      <h2>Malla Curricular</h2>
      <p><strong>Carrera:</strong> ${carrera.nombre}</p>
      <div id="mallaContainer">
    `;

    Object.keys(niveles)
      .sort((a, b) => Number(a) - Number(b))
      .forEach((nivel) => {
        html += `
          <div class="bloque-nivel">
            <h3>Semestre ${nivel}</h3>
            <div class="malla-grid">
        `;

        niveles[nivel].forEach((curso) => {
          const nombre = obtenerNombreRamo(curso.codigo, curso.asignatura);
          
          html += `
            <div class="curso">
              <h4>${nombre}</h4>
              <p><strong>Código:</strong> ${curso.codigo}</p>
              <p><strong>Créditos:</strong> ${curso.creditos}</p>
            </div>
          `;
        });

        html += `
            </div>
          </div>
        `;
      });

    html += `</div>`;
    main.innerHTML = html;

  } catch (error) {
    console.error("Error al cargar malla:", error);
    mostrarError("Error al cargar malla curricular. Intenta nuevamente.", main);
  }
}