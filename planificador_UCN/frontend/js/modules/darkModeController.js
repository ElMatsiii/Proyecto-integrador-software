const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}

export function initDarkMode() {
  const init = () => {
    const nav = document.querySelector('nav ul');
    
    if (!nav) {
      createFloatingButton();
      return;
    }
    
    const darkModeLi = document.createElement('li');
    darkModeLi.style.cssText = 'margin-left: auto; display: flex; align-items: center;';
    
    const darkModeButton = document.createElement('button');
    darkModeButton.id = 'darkModeToggle';
    darkModeButton.className = 'dark-mode-toggle-nav';
    darkModeButton.setAttribute('aria-label', 'Cambiar modo oscuro');
    darkModeButton.type = 'button';

    const currentTheme = document.documentElement.getAttribute('data-theme');
    darkModeButton.innerHTML = currentTheme === 'dark' ? '☀️ Claro' : '🌙 Oscuro';
    
    darkModeLi.appendChild(darkModeButton);
    nav.appendChild(darkModeLi);

    darkModeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const theme = document.documentElement.getAttribute('data-theme');
      
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'light');
        darkModeButton.innerHTML = '🌙 Oscuro';
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeButton.innerHTML = '☀️ Claro';
        localStorage.setItem('theme', 'dark');
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

function createFloatingButton() {
  const darkModeButton = document.createElement('button');
  darkModeButton.id = 'darkModeToggleFloat';
  darkModeButton.className = 'dark-mode-toggle';
  darkModeButton.setAttribute('aria-label', 'Cambiar modo oscuro');
  darkModeButton.type = 'button';
  
  const currentTheme = document.documentElement.getAttribute('data-theme');
  darkModeButton.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
  
  document.body.appendChild(darkModeButton);
  
  darkModeButton.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    
    if (theme === 'dark') {
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

export const darkModeStyles = `
.dark-mode-toggle-nav {
  background: #1a5569;
  color: white !important;
  border: none;
  border-radius: 6px;
  padding: 10px 15px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

/* Transiciones solo después de cargar */
body.loaded .dark-mode-toggle-nav {
  transition: all 0.3s ease;
}

.dark-mode-toggle-nav:hover {
  opacity: 0.9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  background: #134152;
}

[data-theme="dark"] .dark-mode-toggle-nav {
  background: #2a7a94;
}

[data-theme="dark"] .dark-mode-toggle-nav:hover {
  background: #1a5569;
}

nav ul {
  display: flex;
  list-style: none;
  gap: 15px;
  align-items: center;
  flex-wrap: nowrap;
}

nav ul li:has(.dark-mode-toggle-nav) {
  margin-left: auto;
}

:root,
:root:not([data-theme]) {
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
  
  --header-bg: #1a5569;
  --header-text: #fff;
  
  --footer-bg: #333;
  --footer-text: #fff;
  
  --nav-bg: #fff;
  --nav-text: #333;
  --nav-hover-bg: #f0f0f0;
  --nav-hover-text: #1a5569;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="dark"]) {
    --bg-body: #f5f7fa;
    --text-color: #222;
    --card-bg: #fff;
    --border-color: #e9ecef;
  }
}

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
  
  --header-bg: #1a5569;
  --header-text: #e0e0e0;
  
  --footer-bg: #0a0a0a;
  --footer-text: #aaa;
  
  --nav-bg: #1c1c1c;
  --nav-text: #e0e0e0;
  --nav-hover-bg: #2a2a2a;
  --nav-hover-text: #fff;
}

body {
  background-color: var(--bg-body);
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Asegurar que TODO el texto tenga buen contraste */
h1, h2, h3, h4, h5, h6,
p, span, label, a, li,
.curso h4, .curso p, .curso small,
.ramo-card h4, .ramo-card p, .ramo-card strong {
  color: inherit;
}

main {
  background-color: var(--card-bg);
  color: var(--text-color);
  border-color: var(--border-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

main h2, main h3, main h4, main p, main label, main strong {
  color: var(--text-color) !important;
}

.container,
.container * {
  color: var(--text-color);
}

.dashboard {
  background: transparent;
}

.dashboard p {
  background: var(--header-bg);
  color: var(--header-text) !important;
}

.dashboard p strong {
  color: var(--header-text) !important;
}

.tabla-avance, .resumen-lateral {
  background-color: var(--card-bg);
  color: var(--text-color);
  border-color: var(--border-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Estados de cursos - MODO CLARO */
.curso {
  background-color: var(--card-bg);
  color: var(--text-color);
  border-color: var(--border-color);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.curso h4, .curso p, .curso small {
  color: inherit !important;
}

.curso.aprobado {
  background-color: var(--aprobado-bg) !important;
  border-color: var(--aprobado-border) !important;
  color: var(--aprobado-text) !important;
}

.curso.aprobado h4,
.curso.aprobado p,
.curso.aprobado small {
  color: var(--aprobado-text) !important;
}

.curso.reprobado {
  background-color: var(--reprobado-bg) !important;
  border-color: var(--reprobado-border) !important;
  color: var(--reprobado-text) !important;
}

.curso.reprobado h4,
.curso.reprobado p,
.curso.reprobado small {
  color: var(--reprobado-text) !important;
}

.curso.en-curso,
.curso.inscrito {
  background-color: var(--inscrito-bg) !important;
  border-color: var(--inscrito-border) !important;
  color: var(--inscrito-text) !important;
}

.curso.en-curso h4,
.curso.en-curso p,
.curso.en-curso small,
.curso.inscrito h4,
.curso.inscrito p,
.curso.inscrito small {
  color: var(--inscrito-text) !important;
}

.curso.pendiente {
  background-color: var(--pendiente-bg) !important;
  border-color: var(--pendiente-border) !important;
  color: var(--pendiente-text) !important;
}

.curso.pendiente h4,
.curso.pendiente p,
.curso.pendiente small {
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

nav a:hover {
  background: var(--nav-hover-bg) !important;
  color: var(--nav-hover-text) !important;
}

nav a.active {
  background: #1a5569 !important;
  color: white !important;
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

.ramo-card h4,
.ramo-card p,
.ramo-card strong {
  color: var(--text-color);
}

.resumen-body-lateral {
  background-color: var(--bg-body);
}

.resumen-body-lateral p {
  background-color: var(--card-bg);
  color: var(--text-color);
  box-shadow: 0 2px 5px var(--shadow);
}

.resumen-body-lateral p strong {
  color: var(--text-color);
}

.resumen-header-lateral {
  background: var(--header-bg);
  color: var(--header-text);
}

.barra-progreso-lateral {
  background-color: var(--border-color);
}

#contadorCreditosProyeccion {
  background: var(--header-bg);
  color: var(--header-text);
}

/* Estadísticas en inicio */
#estadoCreditos p {
  color: var(--text-color) !important;
}

#estadoCreditos strong {
  color: var(--text-color) !important;
}

#selectorCarrera,
#filtroSemestre,
#selectCarrera {
  background-color: var(--card-bg);
  color: var(--text-color);
  border-color: var(--border-color);
}

.container label,
.container p,
.container span {
  color: var(--text-color) !important;
}

#nombreCarrera,
#semestreActual,
#totalCreditos {
  color: var(--text-color) !important;
}

/* Mensajes y textos de proyecciones */
.pagina-proyeccion main h2,
.pagina-proyeccion main p,
#mensajeProyeccionManual {
  color: var(--text-color) !important;
}

.pagina-malla main h2,
.pagina-malla main p,
.pagina-malla .curso h4,
.pagina-malla .curso p {
  color: inherit !important;
}

.tabla-avance td,
.tabla-avance td strong {
  color: var(--text-color) !important;
}

.resumen-body-lateral p,
.resumen-body-lateral p strong,
.resumen-body-lateral p span {
  color: var(--text-color) !important;
}

.lista-versiones li {
  background-color: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.malla-proyeccion {
  background-color: var(--bg-body);
}

.malla-proyeccion .bloque-nivel {
  background-color: transparent;
}

.malla-proyeccion .bloque-nivel h3 {
  background: var(--header-bg);
  color: var(--header-text);
}

.malla-proyeccion .curso {
  background-color: var(--card-bg);
  border-color: var(--border-color);
  color: var(--text-color);
}

.malla-proyeccion .curso h4,
.malla-proyeccion .curso p {
  color: var(--text-color);
}

.malla-proyeccion .curso.aprobado {
  background-color: var(--aprobado-bg) !important;
  border-color: var(--aprobado-border) !important;
  color: var(--aprobado-text) !important;
}

.malla-proyeccion .curso.aprobado h4,
.malla-proyeccion .curso.aprobado p,
.malla-proyeccion .curso.aprobado small {
  color: var(--aprobado-text) !important;
}

.malla-proyeccion .curso.reprobado {
  background-color: var(--reprobado-bg) !important;
  border-color: var(--reprobado-border) !important;
  color: var(--reprobado-text) !important;
}

.malla-proyeccion .curso.reprobado h4,
.malla-proyeccion .curso.reprobado p,
.malla-proyeccion .curso.reprobado small {
  color: var(--reprobado-text) !important;
}

.malla-proyeccion .curso.inscrito,
.malla-proyeccion .curso.en-curso {
  background-color: var(--inscrito-bg) !important;
  border-color: var(--inscrito-border) !important;
  color: var(--inscrito-text) !important;
}

.malla-proyeccion .curso.inscrito h4,
.malla-proyeccion .curso.inscrito p,
.malla-proyeccion .curso.inscrito small,
.malla-proyeccion .curso.en-curso h4,
.malla-proyeccion .curso.en-curso p,
.malla-proyeccion .curso.en-curso small {
  color: var(--inscrito-text) !important;
}

.malla-proyeccion .curso.pendiente {
  background-color: var(--pendiente-bg) !important;
  border-color: var(--pendiente-border) !important;
  color: var(--pendiente-text) !important;
}

.malla-proyeccion .curso.pendiente h4,
.malla-proyeccion .curso.pendiente p,
.malla-proyeccion .curso.pendiente small {
  color: var(--pendiente-text) !important;
}


.dark-mode-toggle {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  background: #1a5569;
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
  background: #134152;
}

.dark-mode-toggle:active {
  transform: scale(0.95);
}

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
  background: #2a7a94;
}

[data-theme="dark"] button:hover,
[data-theme="dark"] .btn:hover {
  background: #1a5569;
}

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