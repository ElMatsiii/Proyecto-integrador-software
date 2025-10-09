// Funcionalidad para la página de Versiones
document.addEventListener('DOMContentLoaded', function() {
    initializeVersionesPage();
    setupNavigation();
});

async function initializeVersionesPage() {
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
            
            const primeraCarrera = userData.carreras[0];
            await loadVersionesData(primeraCarrera);
        }
        
    } catch (error) {
        console.error('Error inicializando página de versiones:', error);
        showError('Error cargando versiones de malla.');
    }
}

async function loadVersionesData(carrera) {
    try {
        showLoadingState(true);
        
        // Simular carga de versiones (en un caso real, esto vendría de una API)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        displayVersionesData(carrera);
        updateCarreraInfo(carrera);
        
    } catch (error) {
        console.error('Error en loadVersionesData:', error);
        showError('Error cargando versiones. Usando datos de ejemplo.');
        displayVersionesEjemplo();
    } finally {
        showLoadingState(false);
    }
}

function displayVersionesData(carrera) {
    const versionesContent = document.getElementById('versiones-content');
    const loadingMessage = document.getElementById('loading-message');
    
    loadingMessage.style.display = 'none';
    
    // Datos de ejemplo de versiones
    const versiones = [
        {
            catalogo: carrera.catalogo,
            nombre: `Malla ${carrera.nombre}`,
            estado: 'ACTIVA',
            fechaInicio: '2024-01-01',
            descripcion: 'Versión actual de la malla curricular'
        },
        {
            catalogo: '202310',
            nombre: `Malla ${carrera.nombre} (Anterior)`,
            estado: 'PASADA',
            fechaInicio: '2023-01-01',
            descripcion: 'Versión anterior de la malla curricular'
        }
    ];
    
    versionesContent.innerHTML = versiones.map(version => `
        <div class="version-card">
            <div class="version-header">
                <div class="version-title">${version.nombre}</div>
                <div class="version-status status-${version.estado.toLowerCase()}">
                    ${version.estado}
                </div>
            </div>
            <p><strong>Catálogo:</strong> ${version.catalogo}</p>
            <p><strong>Fecha de Inicio:</strong> ${version.fechaInicio}</p>
            <p><strong>Descripción:</strong> ${version.descripcion}</p>
        </div>
    `).join('');
    
    versionesContent.style.display = 'block';
}

function displayVersionesEjemplo() {
    const versionesContent = document.getElementById('versiones-content');
    const loadingMessage = document.getElementById('loading-message');
    
    loadingMessage.style.display = 'none';
    versionesContent.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6c757d;">
            <h3>Datos de Ejemplo</h3>
            <p>No se pudieron cargar las versiones reales de la malla curricular.</p>
        </div>
    `;
    versionesContent.style.display = 'block';
}

function updateUserInfo(userData) {
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        usernameElement.textContent = userData.rut || 'Usuario';
    }
}

function updateCarreraInfo(carrera) {
    const carreraInfo = document.getElementById('carrera-info');
    if (carreraInfo) {
        carreraInfo.textContent = `${carrera.nombre} (${carrera.codigo}) - Catálogo ${carrera.catalogo}`;
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
    
    select.addEventListener('change', async (e) => {
        const [codigo, catalogo] = e.target.value.split('-');
        const carrera = carreras.find(c => c.codigo === codigo && c.catalogo === catalogo);
        if (carrera) {
            await loadVersionesData(carrera);
        }
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
            
            if (targetTab === 'versiones') {
                return;
            }
            
            const targetPage = tabToPage[targetTab];
            if (targetPage) {
                window.location.href = targetPage;
            }
        });
    });
}

function showLoadingState(show) {
    const loadingMessage = document.getElementById('loading-message');
    const versionesContent = document.getElementById('versiones-content');
    
    if (show) {
        loadingMessage.style.display = 'block';
        versionesContent.style.display = 'none';
    } else {
        loadingMessage.style.display = 'none';
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
