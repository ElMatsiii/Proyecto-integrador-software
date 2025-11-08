import { obtenerUsuario } from "../core/storageService.js";

export function inicializarPerfil() {
  const usuario = obtenerUsuario();
  const main = document.querySelector("main");

  if (!usuario) {
    main.innerHTML = "<h2>No se encontró información del usuario</h2>";
  } else {
    main.innerHTML = `
      <h2>Perfil de Usuario</h2>
      <p><strong>Correo:</strong> ${usuario.email}</p>
      <p><strong>Último acceso:</strong> ${new Date().toLocaleString()}</p>
    `;
  }
}
