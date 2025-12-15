import { storage } from "../services/storageService.js";
import { CONFIG } from "../../config/config.js";

export function initLogin() {
  document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll('.tab');
    const formContainers = document.querySelectorAll('.form-container');
    const formEstudiante = document.getElementById("loginFormEstudiante");
    const formAdmin = document.getElementById("loginFormAdmin");

    if (!tabs.length || !formEstudiante || !formAdmin) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        formContainers.forEach(container => {
          container.classList.remove('active');
        });
        
        document.getElementById(`form-${targetTab}`).classList.add('active');
        
        const mensajeEstudiante = document.getElementById('mensajeEstudiante');
        const mensajeAdmin = document.getElementById('mensajeAdmin');
        if (mensajeEstudiante) mensajeEstudiante.textContent = '';
        if (mensajeAdmin) mensajeAdmin.textContent = '';
      });
    });

    formEstudiante.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const mensaje = document.getElementById("mensajeEstudiante");
      mensaje.textContent = "Iniciando sesión...";
      mensaje.style.color = "#1a5569";

      const email = document.getElementById("emailEstudiante").value.trim();
      const password = document.getElementById("passwordEstudiante").value.trim();

      try {
        const response = await fetch(`${CONFIG.API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al iniciar sesión");
        }

        storage.setAuth({ 
          token: data.token, 
          rut: data.rut, 
          carreras: data.carreras || [] 
        });

        const carrera = data.carreras && data.carreras.length > 0 ? data.carreras[0] : null;
        if (carrera) {
          storage.setCarrera(carrera);
        }

        window.location.href = "../html/inicio.html";
      } catch (err) {
        console.error(err);
        mensaje.textContent = err.message || "Error al iniciar sesión";
        mensaje.style.color = "#e74c3c";
      }
    });

    formAdmin.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const mensaje = document.getElementById("mensajeAdmin");
      mensaje.textContent = "Verificando credenciales...";
      mensaje.style.color = "#f39c12";

      const usuario = document.getElementById("usuarioAdmin").value.trim();
      const password = document.getElementById("passwordAdmin").value.trim();

      try {
        const response = await fetch(`${CONFIG.API_URL}/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Error al iniciar sesión");
        }

        sessionStorage.setItem("adminAuth", JSON.stringify({
          token: data.token,
          admin: data.admin
        }));

        window.location.href = "../html/admin-dashboard.html";
      } catch (error) {
        console.error(error);
        mensaje.textContent = error.message || "Error al iniciar sesión";
        mensaje.style.color = "#e74c3c";
      }
    });
  });
}