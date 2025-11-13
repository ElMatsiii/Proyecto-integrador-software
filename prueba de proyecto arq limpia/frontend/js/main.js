import { initLogin } from "./modules/loginController.js";
import { initPerfil } from "./modules/perfilController.js";
import { initMalla } from "./modules/mallaController.js";
import { initResumen } from "./modules/resumenController.js";
import { initProyeccion } from "./modules/proyeccionController.js";
import { initInicio } from "./modules/inicioController.js";
import { initDarkMode, darkModeStyles } from "./modules/darkModeController.js";

// Inyectar estilos del modo oscuro
const styleElement = document.createElement('style');
styleElement.textContent = darkModeStyles;
document.head.appendChild(styleElement);

// Inicializar modo oscuro en todas las páginas
initDarkMode();

const path = window.location.pathname;

// ✅ Detectar index también en "/"
const isIndex =
  path.endsWith("/") ||
  path.endsWith("/index.html") ||
  path.includes("/html/index.html") ||
  path.split("/").pop() === "index.html";

if (isIndex) initLogin();
else if (path.includes("inicio.html")) initInicio();
else if (path.includes("perfil.html")) initPerfil();
else if (path.includes("malla.html")) initMalla();
else if (path.includes("resumen.html")) initResumen();
else if (path.includes("proyecciones.html")) initProyeccion();

const logoutBtn = document.querySelector(".logout");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("usuarioUCN");
    localStorage.removeItem("carreraSeleccionada");
    window.location.href = "../html/index.html";
  });
}