import { obtenerAvance, obtenerMalla } from "../services/apiService.js";
import { storage } from "../services/storageService.js";
import { normalizarCodigo, mostrarError } from "../services/utils.js";

export async function initProyeccion() {
  const main = document.querySelector("main");
  const usuario = storage.getUser();
  const auth = storage.requireAuth();
  const carrera = storage.getCarrera();
  const contenedor = document.getElementById("mallaProyeccionContainer");

  if (!usuario || !carrera) return (window.location.href = "index.html");

  const btnManual = document.getElementById("btnIrManual");
  const btnAuto = document.getElementById("btnIrAutomatica");

  btnManual.addEventListener("click", () => guardarProyeccionManual());
  btnAuto.addEventListener("click", () => generarProyeccionAutomatica(usuario, carrera, contenedor));
}

function guardarProyeccionManual() {
  const seleccionados = Array.from(document.querySelectorAll(".curso.seleccionado")).map(
    (el) => el.textContent
  );
  if (seleccionados.length === 0) return alert("Selecciona al menos un ramo.");
  storage.saveProyeccion(Date.now(), seleccionados);
  alert("Proyección guardada correctamente.");
}

async function generarProyeccionAutomatica(usuario, carrera, contenedor) {
  try {
    const [avance, malla] = await Promise.all([
      obtenerAvance(usuario.rut, carrera.codigo),
      obtenerMalla(carrera.codigo, carrera.catalogo),
    ]);

    const aprobados = new Set(avance.filter((r) => r.status === "APROBADO").map((r) => normalizarCodigo(r.course)));
    const disponibles = malla.filter((r) => !r.prereq || r.prereq.split(",").every((p) => aprobados.has(normalizarCodigo(p))));

    const seleccion = [];
    let creditos = 0;
    for (const ramo of disponibles) {
      if (creditos + ramo.creditos <= 35) {
        seleccion.push(ramo);
        creditos += ramo.creditos;
      }
    }

    contenedor.innerHTML = `
      <h3>Proyección Automática</h3>
      <p>${seleccion.length} ramos (${creditos} créditos)</p>
      <div class="malla-grid">
        ${seleccion.map((r) => `<div class="curso"><h4>${r.asignatura}</h4><p>${r.creditos} créditos</p></div>`).join("")}
      </div>
    `;
  } catch (err) {
    mostrarError("Error al generar proyección automática", contenedor);
  }
}
