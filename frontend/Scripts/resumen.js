// Funcionalidad para la página de Resumen Académico
document.addEventListener('DOMContentLoaded', function() {
    initializeResumenPage();
    setupNavigation();
});

async function initializeResumenPage() {
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
            await loadResumenAcademico(primeraCarrera);
        }
        
    } catch (error) {
        console.error('Error inicializando página de resumen:', error);
        showError('Error cargando resumen académico.');
    }
}

async function loadResumenAcademico(carrera) {
    try {
        showLoadingState(true);
        
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        // Obtener datos completos
        const result = await window.apiService.getDatosCompletosEstudiante(
            userData.email || 'usuario@ucn.cl',
            'password',
            carrera.codigo,
            carrera.catalogo
        );
        
        if (result.success) {
            const { malla, avance } = result.data;
            const estadisticas = window.apiService.procesarEstadisticas(avance, malla);
            
            displayResumenAcademico(estadisticas, avance, malla);
            updateCarreraInfo(carrera);
        } else {
            showError('Error cargando datos académicos. Usando datos de ejemplo.');
            displayResumenEjemplo();
        }
        
    } catch (error) {
        console.error('Error en loadResumenAcademico:', error);
        showError('Error de conexión. Usando datos de ejemplo.');
        displayResumenEjemplo();
    } finally {
        showLoadingState(false);
    }
}

function displayResumenAcademico(estadisticas, avance, malla) {
    const resumenContent = document.getElementById('resumen-content');
    const loadingMessage = document.getElementById('loading-message');
    
    loadingMessage.style.display = 'none';
    
    resumenContent.innerHTML = `
        <div class="resumen-grid">
            <div class="resumen-card">
                <h3>Progreso General</h3>
                <div class="progress-section">
                    <div class="progress-item">
                        <span>Créditos Aprobados</span>
                        <span>${estadisticas.creditosAprobados}/${estadisticas.creditosTotales}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${estadisticas.porcentajeAvance}%"></div>
                    </div>
                </div>
                <div class="progress-section">
                    <div class="progress-item">
                        <span>Cursos Completados</span>
                        <span>${estadisticas.cursosAprobados}/${estadisticas.totalCursos}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.round((estadisticas.cursosAprobados / estadisticas.totalCursos) * 100)}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="resumen-card">
                <h3>Estadísticas</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value">${estadisticas.cursosAprobados}</div>
                        <div class="stat-label">Aprobados</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${estadisticas.cursosReprobados}</div>
                        <div class="stat-label">Reprobados</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${estadisticas.cursosEnProceso}</div>
                        <div class="stat-label">En Proceso</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${estadisticas.promedio.toFixed(1)}</div>
                        <div class="stat-label">Promedio</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resumenContent.style.display = 'block';
}

function displayResumenEjemplo() {
    const resumenContent = document.getElementById('resumen-content');
    const loadingMessage = document.getElementById('loading-message');
    
    loadingMessage.style.display = 'none';
    resumenContent.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6c757d;">
            <h3>Datos de Ejemplo</h3>
            <p>No se pudieron cargar los datos reales del resumen académico.</p>
        </div>
    `;
    resumenContent.style.display = 'block';
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
            await loadResumenAcademico(carrera);
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
            
            if (targetTab === 'resumen') {
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
    const resumenContent = document.getElementById('resumen-content');
    
    if (show) {
        loadingMessage.style.display = 'block';
        resumenContent.style.display = 'none';
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
