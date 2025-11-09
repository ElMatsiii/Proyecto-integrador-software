export function normalizarCodigo(cod) {
  return cod?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "";
}

export function mostrarError(mensaje, contenedor) {
  contenedor.innerHTML = `<p style="color:red;">${mensaje}</p>`;
  console.error(mensaje);
}

// 🔹 Nueva función para obtener nombre de ramo
export function obtenerNombreRamo(codigo, nombreOriginal) {
  // Si ya tiene nombre, usarlo
  if (nombreOriginal && nombreOriginal.trim() && nombreOriginal !== codigo) {
    return nombreOriginal;
  }

  // Limpiar código para comparación
  const codigoLimpio = normalizarCodigo(codigo);

  // Mapeo de prefijos a nombres genéricos
  if (codigoLimpio.startsWith("DCTE")) return "Curso de Formación General";
  if (codigoLimpio.startsWith("UNFP")) return "Curso de Formación Profesional";
  if (codigoLimpio.startsWith("SSED")) return "Curso de Inglés o Comunicación";
  if (codigoLimpio.startsWith("ECIN")) return "Curso de Ingeniería o Programación";
  if (codigoLimpio.startsWith("DCCB")) return "Curso de Ciencias Básicas";

  // Si no coincide con ningún prefijo, devolver el código
  return codigo || "Nombre no disponible";
}