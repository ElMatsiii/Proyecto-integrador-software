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

      console.log("=== LOGIN ATTEMPT ===");
      console.log("Usuario:", usuario);
      console.log("Tiene @:", usuario.includes("@"));

      const esEmail = usuario.includes("@");

      if (esEmail) {
        console.log("Detectado como EMAIL - intentando login estudiante/admin");
        
        const esEmailAdmin = usuario.toLowerCase().includes("admin");
        
        if (esEmailAdmin) {
          console.log("Email contiene 'admin' - intentando login admin");
          await intentarLoginAdmin(usuario, password, mensaje);
        } else {
          console.log("Email sin 'admin' - intentando login estudiante");
          await intentarLoginEstudiante(usuario, password, mensaje);
        }
      } else {
        console.log("NO es email - mostrando error");
        mensaje.textContent = "Por favor ingresa un correo electrónico válido";
        mensaje.style.color = "#e74c3c";
      }
    });
  });
}

async function intentarLoginEstudiante(email, password, mensaje) {
  console.log("→ Intentando login estudiante");
  console.log("  URL:", `${CONFIG.API_URL}/login`);
  
  try {
    const response = await fetch(`${CONFIG.API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    console.log("  Status:", response.status);
    const data = await response.json();
    console.log("  Response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Credenciales incorrectas");
    }

    console.log("✓ Login estudiante exitoso");

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
    console.error("✗ Error login estudiante:", err);
    
    console.log("→ Intentando login admin como fallback");
    await intentarLoginAdmin(email, password, mensaje);
  }
}

async function intentarLoginAdmin(usuario, password, mensaje) {
  console.log("→ Intentando login admin");
  console.log("  URL:", `${CONFIG.API_URL}/admin/login`);
  console.log("  Usuario:", usuario);
  
  try {
    const response = await fetch(`${CONFIG.API_URL}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password })
    });

    console.log("  Status:", response.status);
    const data = await response.json();
    console.log("  Response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Credenciales incorrectas");
    }

    console.log("✓ Login admin exitoso");

    sessionStorage.setItem("adminAuth", JSON.stringify({
      token: data.token,
      admin: data.admin
    }));

    window.location.href = "../html/admin-dashboard.html";
  } catch (error) {
    console.error("✗ Error login admin:", error);
    mensaje.textContent = "Credenciales incorrectas. Verifica tu email y contraseña.";
    mensaje.style.color = "#e74c3c";
  }
}