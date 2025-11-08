import { obtenerMalla } from "../services/apiService.js";
import { storage } from "../services/storageService.js";
import { mostrarError } from "../services/utils.js";

export async function initMalla() {
  const main = document.querySelector("main");
  const auth = storage.requireAuth();
  
  const carrera = storage.getCarrera();

  if (!carrera) return mostrarError("Carrera no encontrada", main);

  try {
    const data = await obtenerMalla(carrera.codigo, carrera.catalogo);
    if (!Array.isArray(data)) return mostrarError("No hay datos de malla", main);

    const niveles = {};
    data.forEach((r) => (niveles[r.nivel] = [...(niveles[r.nivel] || []), r]));

    main.innerHTML = "<h2>Malla Curricular</h2>";
    Object.keys(niveles)
      .sort((a, b) => a - b)
      .forEach((nivel) => {
        const bloque = document.createElement("div");
        bloque.innerHTML = `<h3>Semestre ${nivel}</h3>`;
        bloque.classList.add("bloque-nivel");
        const grid = document.createElement("div");
        grid.classList.add("malla-grid");

        niveles[nivel].forEach((curso) => {
          const div = document.createElement("div");
          div.classList.add("curso");
          div.innerHTML = `<h4>${curso.asignatura}</h4><p>${curso.codigo}</p>`;
          grid.appendChild(div);
        });

        bloque.appendChild(grid);
        main.appendChild(bloque);
      });
  } catch {
    mostrarError("Error al cargar malla curricular", main);
  }
}
