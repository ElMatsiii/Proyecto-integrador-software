// Funcionalidad para la página de Malla Curricular
document.addEventListener('DOMContentLoaded', function() {
    initializeMallaPage();
    
    // Configurar navegación
    setupNavigation();
});

async function initializeMallaPage() {
    try {
        // Obtener datos del usuario del localStorage
        const userDataStr = localStorage.getItem('userData');
        if (!userDataStr) {
            showError('No hay datos de usuario. Por favor, inicia sesión nuevamente.');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return;
        }
        
        const userData = JSON.parse(userDataStr);
        
        // Actualizar información del usuario en la interfaz
        updateUserInfo(userData);
        
        // Si hay carreras, cargar malla de la primera carrera por defecto
        if (userData.carreras && userData.carreras.length > 0) {
            // Crear selector de carreras si hay más de una
            if (userData.carreras.length > 1) {
                createCarreraSelector(userData.carreras);
            }
            
            const primeraCarrera = userData.carreras[0];
            await loadMallaCurricular(primeraCarrera);
        }
        
    } catch (error) {
        console.error('Error inicializando página de malla:', error);
        showError('Error cargando datos de la malla curricular.');
    }
}

async function loadMallaCurricular(carrera) {
    try {
        showLoadingState(true);
        
        const userData = JSON.parse(localStorage.getItem('userData'));
        
        // Obtener malla curricular
        const mallaResult = await window.apiService.getMallaCurricular(carrera.codigo, carrera.catalogo);
        
        if (mallaResult.success) {
            // Obtener avance curricular para marcar cursos aprobados/reprobados
            const avanceResult = await window.apiService.getAvanceCurricular(userData.rut, carrera.codigo);
            
            const avance = avanceResult.success ? avanceResult.data : [];
            
            // Organizar malla por semestres
            const mallaOrganizada = organizarMallaPorSemestres(mallaResult.data, avance);
            
            // Mostrar malla en la interfaz
            displayMallaCurricular(mallaOrganizada);
            
            // Actualizar información de la carrera
            updateCarreraInfo(carrera);
            
        } else {
            console.error('Error obteniendo malla curricular:', mallaResult.error);
            showError('Error cargando malla curricular. Usando datos de ejemplo.');
            displayMallaEjemplo();
        }
        
    } catch (error) {
        console.error('Error en loadMallaCurricular:', error);
        showError('Error de conexión. Usando datos de ejemplo.');
        displayMallaEjemplo();
    } finally {
        showLoadingState(false);
    }
}

function organizarMallaPorSemestres(malla, avance) {
    // Agrupar cursos por semestre
    const semestres = {};
    
    malla.forEach(asignatura => {
        const semestre = asignatura.nivel || 1;
        
        if (!semestres[semestre]) {
            semestres[semestre] = [];
        }
        
        // Buscar estado del curso en el avance
        const cursoAvance = avance.find(c => c.course === asignatura.codigo);
        
        asignatura.estado = cursoAvance ? cursoAvance.status : 'PENDIENTE';
        asignatura.claseEstado = getClaseEstado(asignatura.estado);
        
        semestres[semestre].push(asignatura);
    });
    
    return semestres;
}

function getClaseEstado(estado) {
    const estadosMap = {
        'APROBADO': 'aprobado',
        'REPROBADO': 'reprobado',
        'EN_PROCESO': 'en-proceso',
        'PENDIENTE': 'pendiente'
    };
    return estadosMap[estado] || 'pendiente';
}

function displayMallaCurricular(mallaOrganizada) {
    const mallaContent = document.getElementById('malla-content');
    const loadingMessage = document.getElementById('loading-message');
    
    // Ocultar mensaje de carga
    loadingMessage.style.display = 'none';
    
    // Limpiar contenido anterior
    mallaContent.innerHTML = '';
    
    // Ordenar semestres
    const semestresOrdenados = Object.keys(mallaOrganizada).sort((a, b) => parseInt(a) - parseInt(b));
    
    // Crear grid de semestres
    const semesterGrid = document.createElement('div');
    semesterGrid.className = 'semester-grid';
    
    semestresOrdenados.forEach(numeroSemestre => {
        const semestre = mallaOrganizada[numeroSemestre];
        const semesterCard = createSemesterCard(numeroSemestre, semestre);
        semesterGrid.appendChild(semesterCard);
    });
    
    mallaContent.appendChild(semesterGrid);
    mallaContent.style.display = 'block';
}

function createSemesterCard(numeroSemestre, cursos) {
    const card = document.createElement('div');
    card.className = 'semester-card';
    
    const title = document.createElement('div');
    title.className = 'semester-title';
    title.textContent = `Semestre ${numeroSemestre}`;
    
    const coursesContainer = document.createElement('div');
    
    cursos.forEach(curso => {
        const courseItem = document.createElement('div');
        courseItem.className = `course-item ${curso.claseEstado}`;
        
        courseItem.innerHTML = `
            <div class="course-code">${curso.codigo}</div>
            <div class="course-name">${curso.asignatura}</div>
            <div class="course-credits">${curso.creditos} créditos</div>
            ${curso.prereq ? `<div class="prereq-info">Prerrequisitos: ${curso.prereq}</div>` : ''}
        `;
        
        // Agregar tooltip con información adicional
        courseItem.title = `Estado: ${curso.estado}\nCréditos: ${curso.creditos}`;
        
        coursesContainer.appendChild(courseItem);
    });
    
    card.appendChild(title);
    card.appendChild(coursesContainer);
    
    return card;
}

function displayMallaEjemplo() {
    const mallaContent = document.getElementById('malla-content');
    const loadingMessage = document.getElementById('loading-message');
    
    loadingMessage.style.display = 'none';
    mallaContent.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #6c757d;">
            <h3>Datos de Ejemplo</h3>
            <p>No se pudieron cargar los datos reales de la malla curricular.</p>
            <p>Aquí se mostrarían los cursos organizados por semestre.</p>
        </div>
    `;
    mallaContent.style.display = 'block';
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
    
    // Crear selector de carreras
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
    
    // Agregar opciones
    carreras.forEach(carrera => {
        const option = document.createElement('option');
        option.value = `${carrera.codigo}-${carrera.catalogo}`;
        option.textContent = `${carrera.nombre} (${carrera.codigo})`;
        select.appendChild(option);
    });
    
    // Event listener para cambio de carrera
    select.addEventListener('change', async (e) => {
        const [codigo, catalogo] = e.target.value.split('-');
        const carrera = carreras.find(c => c.codigo === codigo && c.catalogo === catalogo);
        if (carrera) {
            await loadMallaCurricular(carrera);
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
            
            // Mapeo de pestañas a páginas HTML
            const tabToPage = {
                'inicio': 'inicio.html',
                'malla': 'malla.html',
                'resumen': 'resumen.html',
                'completacion': 'completacion.html',
                'versiones': 'versiones.html',
                'perfil': 'perfil.html'
            };
            
            // Si es la pestaña actual (malla), no hacer nada
            if (targetTab === 'malla') {
                return;
            }
            
            // Redirigir a la página correspondiente
            const targetPage = tabToPage[targetTab];
            if (targetPage) {
                window.location.href = targetPage;
            }
        });
    });
}

function showLoadingState(show) {
    const loadingMessage = document.getElementById('loading-message');
    const mallaContent = document.getElementById('malla-content');
    
    if (show) {
        loadingMessage.style.display = 'block';
        mallaContent.style.display = 'none';
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
