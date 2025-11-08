import { obtenerAvance, obtenerMalla } from "../services/apiService.js";
import { storage } from "../services/storageService.js";
import { mostrarError } from "../services/utils.js";

export async function initResumen() {
  const main = document.querySelector("main");
  const auth = storage.requireAuth();
  const usuario = storage.getUser();
  const carrera = storage.getCarrera();

  if (!usuario || !carrera) return mostrarError("Datos faltantes", main);

  try {
    const [avance, malla] = await Promise.all([
      obtenerAvance(usuario.rut, carrera.codigo, token),
      obtenerMalla(carrera.codigo, carrera.catalogo, token),
    ]);

    if (!Array.isArray(avance)) return mostrarError("No se pudo cargar avance", main);

    const total = malla.length;
    const aprobados = avance.filter((r) => r.status === "APROBADO").length;
    const reprobados = avance.filter((r) => r.status === "REPROBADO").length;
    const inscritos = avance.filter((r) => ["INSCRITO", "EN_CURSO"].includes(r.status)).length;

    main.innerHTML = `
      <h2>Resumen Académico</h2>
      <p><strong>Avance de carrera:</strong> ${(aprobados / total * 100).toFixed(1)}%</p>
      <p><strong>Ramos aprobados:</strong> ${aprobados}</p>
      <p><strong>Ramos reprobados:</strong> ${reprobados}</p>
      <p><strong>Ramos inscritos/en curso:</strong> ${inscritos}</p>
    `;
  } catch {
    mostrarError("Error al cargar resumen", main);
  }
}
