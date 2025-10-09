// Funcionalidad para la página de Perfil
document.addEventListener('DOMContentLoaded', function() {
    initializePerfilPage();
    setupNavigation();
});

async function initializePerfilPage() {
    try {
        const userDataStr = localStorage.getItem('userData');
        if (!userDataStr) {
            showError('No hay datos de usuario. Por favor, inicia sesión nuevamente.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        const userData = JSON.parse(userDataStr);
        updateUserInfo(userData);
        
        if (userData.carreras && userData.carreras.length > 0) {
            if (userData.carreras.length > 1) {
                createCarreraSelector(userData.carreras);
            }
            
            displayPerfilData(userData);
        }
        
    } catch (error) {
        console.error('Error inicializando página de perfil:', error);
        showError('Error cargando datos del perfil.');
    }
}

function displayPerfilData(userData) {
    const perfilContent = document.getElementById('perfil-content');
    const loadingMessage = document.getElementById('loading-message');
    
    loadingMessage.style.display = 'none';
    
    // Obtener iniciales para el avatar
    const iniciales = userData.rut ? userData.rut.charAt(0).toUpperCase() : 'U';
    
    perfilContent.innerHTML = `
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-avatar">${iniciales}</div>
                <div class="profile-info">
                    <h2>${userData.rut || 'Usuario'}</h2>
                    <p>Estudiante Universidad Católica del Norte</p>
                </div>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">RUT</div>
                    <div class="info-value">${userData.rut || 'No disponible'}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Carreras Asociadas</div>
                    <div class="info-value">${userData.carreras ? userData.carreras.length : 0}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Última Conexión</div>
                    <div class="info-value">${new Date().toLocaleDateString()}</div>
                </div>
                
                <div class="info-item">
                    <div class="info-label">Estado de Cuenta</div>
                    <div class="info-value">Activa</div>
                </div>
            </div>
            
            ${userData.carreras && userData.carreras.length > 0 ? `
                <h3 style="margin-top: 30px; color: #2c3e50;">Carreras Registradas</h3>
                <div style="margin-top: 15px;">
                    ${userData.carreras.map(carrera => `
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                            <strong>${carrera.nombre}</strong><br>
                            <small>Código: ${carrera.codigo} - Catálogo: ${carrera.catalogo}</small>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            <button class="logout-btn" onclick="logout()">
                Cerrar Sesión
            </button>
        </div>
    `;
    
    perfilContent.style.display = 'block';
}

function updateUserInfo(userData) {
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = userData.rut || 'Usuario';
    }
}

function createCarreraSelector(carreras) {
    const userInfo = document.querySelector('.user-info');
    
    const selectorContainer = document.createElement('div');
    selectorContainer.style.cssText = `
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const label = document.createElement('label');
    label.textContent = 'Carrera:';
    label.style.fontSize = '0.9rem';
    label.style.opacity = '0.8';
    
    const select = document.createElement('select');
    select.id = 'carrera-selector';
    select.style.cssText = `
        padding: 5px 10px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 0.9rem;
    `;
    
    carreras.forEach(carrera => {
        const option = document.createElement('option');
        option.value = `${carrera.codigo}-${carrera.catalogo}`;
        option.textContent = `${carrera.nombre} (${carrera.codigo})`;
        select.appendChild(option);
    });
    
    selectorContainer.appendChild(label);
    selectorContainer.appendChild(select);
    userInfo.appendChild(selectorContainer);
}

function setupNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            const tabToPage = {
                'inicio': 'inicio.html',
                'malla': 'malla.html',
                'resumen': 'resumen.html',
                'completacion': 'completacion.html',
                'versiones': 'versiones.html',
                'perfil': 'perfil.html'
            };
            
            if (targetTab === 'perfil') {
                return;
            }
            
            const targetPage = tabToPage[targetTab];
            if (targetPage) {
                window.location.href = targetPage;
            }
        });
    });
}

function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        // Limpiar datos del localStorage
        localStorage.removeItem('userData');
        
        // Limpiar cache del servicio de API
        if (window.apiService) {
            window.apiService.clearCache();
        }
        
        // Redirigir al login
        window.location.href = 'login.html';
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #f8d7da;
        color: #721c24;
        padding: 15px;
        border-radius: 5px;
        border: 1px solid #f5c6cb;
        z-index: 1000;
        max-width: 300px;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}
