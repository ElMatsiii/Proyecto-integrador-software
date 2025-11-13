import jwt from "jsonwebtoken";

const SECRET = "clave-super-segura-ucn"; // cámbiala por una variable de entorno luego

export function generarToken(datosUsuario) {
  return jwt.sign(datosUsuario, SECRET, { expiresIn: "2h" });
}

export function verificarToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}
