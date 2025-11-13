// storageService.js
const KEY = "auth";          // { token, rut, carreras }
const KEY_CARRERA = "carreraSeleccionada";

function read() {
  try { 
    return JSON.parse(sessionStorage.getItem(KEY)) || null; 
  } catch { 
    return null; 
  }
}

export const storage = {
  // Guardar autenticación
  setAuth({ token, rut, carreras }) {
    const data = { token, rut, carreras: carreras || [] };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  },

  // Obtener autenticación
  getAuth() { 
    return read(); 
  },

  // Limpiar sesión
  clear() { 
    sessionStorage.removeItem(KEY); 
    sessionStorage.removeItem(KEY_CARRERA); 
  },

  // Guardar carrera seleccionada
  setCarrera(carrera) { 
    sessionStorage.setItem(KEY_CARRERA, JSON.stringify(carrera)); 
  },

  // Obtener carrera seleccionada
  getCarrera() {
    const raw = sessionStorage.getItem(KEY_CARRERA);
    if (raw) return JSON.parse(raw);
    const auth = read();
    return auth?.carreras?.[0] || null; // fallback a la primera carrera
  },

  // Validar autenticación (redirige si no está autenticado)
  requireAuth() {
    const auth = read();
    if (!auth?.token || !auth?.rut) {
      window.location.href = "../html/index.html";
      throw new Error("No autenticado");
    }
    return auth; // Retorna { token, rut, carreras }
  }
};