export function normalizarCodigo(cod) {
  return cod?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "";
}

export function mostrarError(mensaje, contenedor) {
  contenedor.innerHTML = `<p style="color:red;">${mensaje}</p>`;
  console.error(mensaje);
}
