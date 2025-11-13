import { verificarToken } from "../config/jwt.js";

export function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const usuario = verificarToken(token);
  if (!usuario) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }

  req.usuario = usuario;
  next();
}
