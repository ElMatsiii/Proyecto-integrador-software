import { storage } from "../services/storageService.js";

export function initPerfil() {
  const main = document.querySelector("main");
  const auth = storage.requireAuth(); 
  const carrera = storage.getCarrera();

  if (!auth || !carrera) {
    window.location.href = "index.html";
    return;
  }

  main.innerHTML = `
    <h2>Perfil del Estudiante</h2>
    <p><strong>RUT:</strong> ${auth.rut}</p>
    <p><strong>Carrera:</strong> ${carrera.nombre}</p>
    <p><strong>Código:</strong> ${carrera.codigo}</p>
    <p><strong>Catálogo:</strong> ${carrera.catalogo}</p>
  `;
}