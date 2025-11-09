import { obtenerAvance, obtenerMalla } from "../services/apiService.js";
import { storage } from "../services/storageService.js";
import { normalizarCodigo, mostrarError } from "../services/utils.js";

export async function initProyeccion() {
  const main = document.querySelector("main");
  const auth = storage.requireAuth(); // Cambio aquí
  const carrera = storage.getCarrera();
  const contenedor = document.getElementById("mallaProyeccionContainer");

  if (!auth || !carrera) {
    return (window.location.href = "index.html");
  }

  const btnManual = document.getElementById("btnIrManual");
  const btnAuto = document.getElementById("btnIrAutomatica");

  btnManual.addEventListener("click", () => guardarProyeccionManual());
  btnAuto.addEventListener("click", () => generarProyeccionAutomatica(auth, carrera, contenedor)); // Cambio aquí
}

function guardarProyeccionManual() {
  const seleccionados = Array.from(document.querySelectorAll(".curso.seleccionado")).map(
    (el) => el.textContent
  );
  if (seleccionados.length === 0) return alert("Selecciona al menos un ramo.");
  
  // Guardar en localStorage o sessionStorage si lo necesitas
  const proyeccion = {
    fecha: new Date().toISOString(),
    ramos: seleccionados
  };
  localStorage.setItem('proyeccionManual', JSON.stringify(proyeccion));
  
  alert("Proyección guardada correctamente.");
}

async function generarProyeccionAutomatica(auth, carrera, contenedor) { // Cambio aquí
  try {
    const [avance, malla] = await Promise.all([
      obtenerAvance(auth.rut, carrera.codigo),
      obtenerMalla(carrera.codigo, carrera.catalogo),
    ]);

    // Crear mapa de códigos aprobados
    const aprobados = new Set(
      avance
        .filter((r) => r.status === "APROBADO")
        .map((r) => normalizarCodigo(r.course))
    );

    // Filtrar ramos disponibles (sin prereqs o con prereqs cumplidos)
    const disponibles = malla.filter((r) => {
      if (!r.prereq) return true;
      const prereqs = r.prereq.split(",").map(p => normalizarCodigo(p));
      return prereqs.every((p) => aprobados.has(p));
    });

    // Seleccionar ramos hasta el límite de créditos
    const seleccion = [];
    let creditos = 0;
    const limite = 35;

    for (const ramo of disponibles) {
      const creditosRamo = Number(ramo.creditos || 0);
      if (creditos + creditosRamo <= limite) {
        seleccion.push(ramo);
        creditos += creditosRamo;
      }
    }

    contenedor.innerHTML = `
      <h3>Proyección Automática</h3>
      <p><strong>Ramos seleccionados:</strong> ${seleccion.length}</p>
      <p><strong>Total créditos:</strong> ${creditos} / ${limite}</p>
      <div class="malla-grid">
        ${seleccion.map((r) => `
          <div class="curso seleccionado-auto">
            <h4>${r.asignatura}</h4>
            <p><strong>Código:</strong> ${r.codigo}</p>
            <p><strong>Créditos:</strong> ${r.creditos}</p>
            <p><strong>Nivel:</strong> ${r.nivel}</p>
          </div>
        `).join("")}
      </div>
    `;
  } catch (err) {
    console.error("Error en proyección automática:", err);
    mostrarError("Error al generar proyección automática", contenedor);
  }
}