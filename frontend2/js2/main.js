// Cerrar sesión
document.querySelector('.logout')?.addEventListener('click', e => {
  e.preventDefault();
  localStorage.removeItem('usuario');
  window.location.href = 'index.html';
});
