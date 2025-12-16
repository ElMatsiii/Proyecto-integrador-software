import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "clave-super-segura-ucn";

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