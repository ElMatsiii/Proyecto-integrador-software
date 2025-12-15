import { storage } from "../services/storageService.js";
import { CONFIG } from "../../config/config.js";

export function initLogin() {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const mensaje = document.getElementById("mensaje");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      mensaje.textContent = "Iniciando sesión...";
      mensaje.style.color = "#1a5569";

      const usuario = document.getElementById("usuario").value.trim();
      const password = document.getElementById("password").value.trim();

      const esEmail = usuario.includes("@");

      if (esEmail) {
        await intentarLoginEstudiante(usuario, password, mensaje);
      } else {
        await intentarLoginAdmin(usuario, password, mensaje);
      }
    });
  });
}

async function intentarLoginEstudiante(email, password, mensaje) {
  try {
    const response = await fetch(`${CONFIG.API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Credenciales incorrectas");
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
}

async function intentarLoginAdmin(usuario, password, mensaje) {
  try {
    const response = await fetch(`${CONFIG.API_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Credenciales incorrectas");
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
}