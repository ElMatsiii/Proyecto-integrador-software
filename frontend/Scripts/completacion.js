// Funcionalidad para la página de Completación
document.addEventListener('DOMContentLoaded', function() {
    initializeCompletacionPage();
    setupNavigation();
});

async function initializeCompletacionPage() {
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
            await loadCompletacionData(primeraCarrera);
        }
        
    } catch (error) {
        console.error('Error inicializando página de completación:', error);
        showError('Error cargando datos de completación.');
    }
}

async function loadCompletacionData(carrera) {
    try {
        showLoadingState(true);
        
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        const result = await window.apiService.getDatosCompletosEstudiante(
            userData.email || 'usuario@ucn.cl',
            'password',
            carrera.codigo,
            carrera.catalogo
        );
        
        if (result.success) {
            const { malla, avance } = result.data;
            const estadisticas = window.apiService.procesarEstadisticas(avance, malla);
            
            displayCompletacionData(estadisticas);
            updateCarreraInfo(carrera);
        } else {
            showError('Error cargando datos. Usando datos de ejemplo.');
            displayCompletacionEjemplo();
        }
        
    } catch (error) {
        console.error('Error en loadCompletacionData:', error);
        showError('Error de conexión. Usando datos de ejemplo.');
        displayCompletacionEjemplo();
    } finally {
        showLoadingState(false);
    }
}

function displayCompletacionData(estadisticas) {
    const completacionContent = document.getElementById('completacion-content');
    const loadingMessage = document.getElementById('loading-message');
    
    loadingMessage.style.display = 'none';
    
    // Actualizar círculo de progreso
    const progressCircle = document.getElementById('progressCircle');
    const progressText = document.getElementById('progressText');
    const progressDescription = document.getElementById('progressDescription');
    
    if (progressCircle && progressText && progressDescription) {
        const circumference = 2 * Math.PI * 90; // radio = 90
        const progress = estadisticas.porcentajeAvance / 100;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (progress * circumference);
        
        progressCircle.style.strokeDasharray = strokeDasharray;
        progressCircle.style.strokeDashoffset = strokeDashoffset;
        
        progressText.textContent = `${estadisticas.porcentajeAvance}%`;
        progressDescription.textContent = `Has completado ${estadisticas.creditosAprobados} de ${estadisticas.creditosTotales} créditos totales de la carrera.`;
    }
    
    completacionContent.style.display = 'block';
}

function displayCompletacionEjemplo() {
    const completacionContent = document.getElementById('completacion-content');
    const loadingMessage = document.getElementById('loading-message');
    
    loadingMessage.style.display = 'none';
    
    const progressCircle = document.getElementById('progressCircle');
    const progressText = document.getElementById('progressText');
    const progressDescription = document.getElementById('progressDescription');
    
    if (progressCircle && progressText && progressDescription) {
        progressText.textContent = '0%';
        progressDescription.textContent = 'No se pudieron cargar los datos reales.';
    }
    
    completacionContent.style.display = 'block';
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
            await loadCompletacionData(carrera);
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
            
            if (targetTab === 'completacion') {
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
    const completacionContent = document.getElementById('completacion-content');
    
    if (show) {
        loadingMessage.style.display = 'block';
        completacionContent.style.display = 'none';
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
