
import { loginUsuario } from "../services/apiService.js";
import { storage } from "../services/storageService.js";

export function initLogin() {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const mensaje = document.getElementById("mensaje");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      mensaje.textContent = "Iniciando sesión...";

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const data = await loginUsuario(email, password);
       
        storage.setAuth({ token: data.token, rut: data.rut, carreras: data.carreras || [] });
        const carrera = storage.getCarrera();
        storage.setCarrera(carrera);
        window.location.href = "../html/inicio.html";
      } catch (err) {
        console.error(err);
        mensaje.textContent = "Error al iniciar sesión";
      }
    });
  });
}
