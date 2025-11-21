/**
 * theme-initializer.js
 * Inicializa el tema antes de que se renderice el DOM
 * Debe ejecutarse lo más temprano posible
 */

(function() {
  'use strict';
  
  // Obtener tema guardado
  const savedTheme = localStorage.getItem('theme');
  
  // Aplicar tema inmediatamente
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    // Si no hay tema guardado, usar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }
})();