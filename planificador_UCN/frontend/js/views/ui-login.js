import { guardarUsuario } from "../core/storageService.js";

export function inicializarLogin() {
  const form = document.getElementById("loginForm");
  const mensaje = document.getElementById("mensaje");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (email && password) {
      guardarUsuario({ email });
      window.location.href = "inicio.html";
    } else {
      mensaje.textContent = "Por favor, completa todos los campos.";
    }
  });
}
