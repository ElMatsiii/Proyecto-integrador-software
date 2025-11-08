import { obtenerProyecciones } from "../core/storageService.js";

export function mostrarVersiones() {
  const lista = document.querySelector(".lista-versiones");
  const versiones = obtenerProyecciones();

  if (!lista) return;
  lista.innerHTML = versiones.length
    ? versiones.map(v => `<li>${v.nombre} – ${v.fecha}</li>`).join("")
    : "<li>No hay proyecciones guardadas</li>";
}
