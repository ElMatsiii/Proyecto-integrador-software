import { guardarProyeccion } from "../core/storageService.js";

export function inicializarProyecciones() {
  const btnGuardar = document.getElementById("btnIrManual");
  const container = document.getElementById("mallaProyeccionContainer");

  btnGuardar.addEventListener("click", () => {
    const proyeccion = {
      asignaturas: ["Ejemplo 1", "Ejemplo 2"], // aquí irá la malla real
    };
    guardarProyeccion("Proyección manual", proyeccion);
    alert("✅ Proyección guardada correctamente");
  });

  // Ejemplo visual de render:
  container.innerHTML = "<p>Proyección cargada: Ninguna.</p>";
}
