const KEY = "auth";
const KEY_CARRERA = "carreraSeleccionada";

function read() {
  try { 
    return JSON.parse(sessionStorage.getItem(KEY)) || null; 
  } catch { 
    return null; 
  }
}

export const storage = {
  setAuth({ token, rut, carreras }) {
    const data = { token, rut, carreras: carreras || [] };
    sessionStorage.setItem(KEY, JSON.stringify(data));
  },

  getAuth() { 
    return read(); 
  },

  clear() { 
    sessionStorage.removeItem(KEY); 
    sessionStorage.removeItem(KEY_CARRERA); 
  },

  setCarrera(carrera) { 
    sessionStorage.setItem(KEY_CARRERA, JSON.stringify(carrera)); 
  },

  getCarrera() {
    const raw = sessionStorage.getItem(KEY_CARRERA);
    if (raw) return JSON.parse(raw);
    const auth = read();
    return auth?.carreras?.[0] || null;
  },

  requireAuth() {
    const auth = read();
    if (!auth?.token || !auth?.rut) {
      window.location.href = "../html/index.html";
      throw new Error("No autenticado");
    }
    return auth;
  }
};