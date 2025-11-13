// darkModeController.js
// Guardar en: frontend/js/modules/darkModeController.js

export function initDarkMode() {
  // Crear el botón de modo oscuro
  const darkModeButton = document.createElement('button');
  darkModeButton.id = 'darkModeToggle';
  darkModeButton.className = 'dark-mode-toggle';
  darkModeButton.innerHTML = '🌙';
  darkModeButton.setAttribute('aria-label', 'Cambiar modo oscuro');
  
  // Añadir el botón al body
  document.body.appendChild(darkModeButton);

  // Cargar preferencia guardada
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    darkModeButton.innerHTML = '☀️';
  }

  // Toggle al hacer clic
  darkModeButton.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    if (currentTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'light');
      darkModeButton.innerHTML = '🌙';
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      darkModeButton.innerHTML = '☀️';
      localStorage.setItem('theme', 'dark');
    }
  });
}

// Estilos CSS para el botón y el modo oscuro
export const darkModeStyles = `
/* Botón de modo oscuro flotante */
.dark-mode-toggle {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark-mode-toggle:hover {
  transform: scale(1.1) rotate(15deg);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.dark-mode-toggle:active {
  transform: scale(0.95);
}

/* Variables CSS para modo claro (por defecto) */
:root {
  --bg-body: #f5f7fa;
  --text-color: #222;
  --card-bg: #fff;
  --border-color: #e9ecef;
  --shadow: rgba(0, 0, 0, 0.1);
  
  --aprobado-bg: #d4edda;
  --aprobado-border: #28a745;
  --aprobado-text: #0f5132;
  
  --reprobado-bg: #f8d7da;
  --reprobado-border: #dc3545;
  --reprobado-text: #842029;
  
  --inscrito-bg: #fff3cd;
  --inscrito-border: #ffc107;
  --inscrito-text: #664d03;
  
  --pendiente-bg: #f9f9f9;
  --pendiente-border: #e9ecef;
  --pendiente-text: #333;
  
  --header-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --header-text: #fff;
  
  --footer-bg: #333;
  --footer-text: #fff;
  
  --nav-bg: #fff;
  --nav-text: #333;
  --nav-hover-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --nav-hover-text: #fff;
}

/* Variables CSS para modo oscuro */
[data-theme="dark"] {
  --bg-body: #0d0d0d;
  --text-color: #e0e0e0;
  --card-bg: #1c1c1c;
  --border-color: #333;
  --shadow: rgba(0, 0, 0, 0.5);
  
  --aprobado-bg: #1a4d2e;
  --aprobado-border: #28a745;
  --aprobado-text: #90ee90;
  
  --reprobado-bg: #4d1a1a;
  --reprobado-border: #dc3545;
  --reprobado-text: #ff9999;
  
  --inscrito-bg: #4d3b00;
  --inscrito-border: #ffc107;
  --inscrito-text: #ffeb99;
  
  --pendiente-bg: #2a2a2a;
  --pendiente-border: #444;
  --pendiente-text: #ccc;
  
  --header-bg: linear-gradient(135deg, #4a3f7a 0%, #5a3d6e 100%);
  --header-text: #e0e0e0;
  
  --footer-bg: #0a0a0a;
  --footer-text: #aaa;
  
  --nav-bg: #1c1c1c;
  --nav-text: #e0e0e0;
  --nav-hover-bg: linear-gradient(135deg, #5a4ddf 0%, #7b68ee 100%);
  --nav-hover-text: #fff;
}

/* Aplicar variables a los elementos */
body {
  background-color: var(--bg-body);
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

main, .dashboard, .tabla-avance, .resumen-lateral {
  background-color: var(--card-bg);
  color: var(--text-color);
  border-color: var(--border-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.curso {
  background-color: var(--card-bg);
  color: var(--text-color);
  border-color: var(--border-color);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.curso.aprobado {
  background-color: var(--aprobado-bg) !important;
  border-color: var(--aprobado-border) !important;
  color: var(--aprobado-text) !important;
}

.curso.reprobado {
  background-color: var(--reprobado-bg) !important;
  border-color: var(--reprobado-border) !important;
  color: var(--reprobado-text) !important;
}

.curso.en-curso,
.curso.inscrito {
  background-color: var(--inscrito-bg) !important;
  border-color: var(--inscrito-border) !important;
  color: var(--inscrito-text) !important;
}

.curso.pendiente {
  background-color: var(--pendiente-bg) !important;
  border-color: var(--pendiente-border) !important;
  color: var(--pendiente-text) !important;
}

header, footer {
  background: var(--header-bg);
  color: var(--header-text);
  transition: background 0.3s ease, color 0.3s ease;
}

footer {
  background-color: var(--footer-bg);
  color: var(--footer-text);
}

nav {
  background-color: var(--nav-bg);
  transition: background-color 0.3s ease;
}

nav a {
  color: var(--nav-text);
  transition: color 0.3s ease, background 0.3s ease;
}

nav a:hover,
nav a.active {
  background: var(--nav-hover-bg) !important;
  color: var(--nav-hover-text) !important;
}

.tabla-avance {
  background-color: var(--card-bg);
  box-shadow: 0 2px 8px var(--shadow);
}

.tabla-avance th {
  background: var(--header-bg);
  color: var(--header-text);
}

.tabla-avance td {
  border-color: var(--border-color);
  color: var(--text-color);
}

.tabla-avance tr.aprobado td {
  background-color: var(--aprobado-bg);
  color: var(--aprobado-text);
}

.tabla-avance tr.reprobado td {
  background-color: var(--reprobado-bg);
  color: var(--reprobado-text);
}

.tabla-avance tr.inscrito td,
.tabla-avance tr.en_curso td {
  background-color: var(--inscrito-bg);
  color: var(--inscrito-text);
}

.ramo-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  box-shadow: 0 2px 6px var(--shadow);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.resumen-body-lateral {
  background-color: var(--bg-body);
}

.resumen-body-lateral p {
  background-color: var(--card-bg);
  color: var(--text-color);
  box-shadow: 0 2px 5px var(--shadow);
}

.barra-progreso-lateral {
  background-color: var(--border-color);
}

#contadorCreditosProyeccion {
  background: var(--header-bg);
  color: var(--header-text);
}

/* Inputs y selects en modo oscuro */
[data-theme="dark"] input,
[data-theme="dark"] select,
[data-theme="dark"] textarea {
  background-color: #2a2a2a;
  color: #e0e0e0;
  border-color: #444;
}

[data-theme="dark"] input::placeholder {
  color: #888;
}

/* Botones en modo oscuro */
[data-theme="dark"] button,
[data-theme="dark"] .btn {
  background: linear-gradient(135deg, #5a4ddf 0%, #7b68ee 100%);
}

/* Auth container en modo oscuro */
[data-theme="dark"] .auth-container,
[data-theme="dark"] .login-container {
  background-color: #1c1c1c;
  color: #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

[data-theme="dark"] .login-title,
[data-theme="dark"] .auth-container h2 {
  color: #e0e0e0;
}
`;