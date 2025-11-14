import { storage } from "./storageService.js";

const API_BASE = "http://localhost:3000";
const API = {
  LOGIN:  `${API_BASE}/api/login`,
  MALLA:  `${API_BASE}/api/malla`,
  AVANCE: `${API_BASE}/api/avance`,
};

function authHeaders() {
  const auth = storage.getAuth();
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
}

export async function loginUsuario(email, password) {
  const res = await fetch(API.LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Error de login");
  return data;
}

export async function obtenerMalla(codigo, catalogo) {
  const res = await fetch(`${API.MALLA}?codigo=${codigo}&catalogo=${catalogo}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error("Error al obtener la malla");
  return res.json();
}

export async function obtenerAvance(rut, codCarrera) {
  const res = await fetch(`${API.AVANCE}?rut=${rut}&codcarrera=${codCarrera}`, {
    headers: { ...authHeaders() }
  });
  if (!res.ok) throw new Error("Error al obtener avance académico");
  return res.json();
}
