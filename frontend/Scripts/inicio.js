// Tab functionality
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar datos del usuario si están disponibles
    initializeUserData();
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

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
            
            // Si es la pestaña de inicio, mantener el comportamiento actual
            if (targetTab === 'inicio') {
                // Remove active class from all tabs and contents
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                this.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            } else {
                // Redirigir a la página correspondiente
                const targetPage = tabToPage[targetTab];
                if (targetPage) {
                    window.location.href = targetPage;
                }
            }
        });
    });
});

// Modal functionality
const modal = document.getElementById('plannerModal');
const closeBtn = document.querySelector('.close');

function openPlanner(type) {
    const modal = document.getElementById('plannerModal');
    const title = document.getElementById('plannerTitle');
    const content = document.getElementById('plannerContent');
    
    if (type === 'cuatrimestral') {
        title.textContent = 'Planificación Cuatrimestral';
        content.innerHTML = `
            <div class="planner-content">
                <h3>Próximo Cuatrimestre (2025-1)</h3>
                <p>Selecciona los ramos que planeas inscribir:</p>
                <div class="available-courses">
                    <div class="course-option">
                        <input type="checkbox" id="math2" name="course">
                        <label for="math2">Matemáticas II (Prereq: Matemáticas I)</label>
                        <span class="credits">6 créditos</span>
                    </div>
                    <div class="course-option">
                        <input type="checkbox" id="prog2" name="course">
                        <label for="prog2">Programación Avanzada (Prereq: Intro Programación)</label>
                        <span class="credits">8 créditos</span>
                    </div>
                    <div class="course-option">
                        <input type="checkbox" id="physics" name="course">
                        <label for="physics">Física General (Prereq: Matemáticas I)</label>
                        <span class="credits">6 créditos</span>
                    </div>
                    <div class="course-option">
                        <input type="checkbox" id="english" name="course">
                        <label for="english">Inglés Intermedio</label>
                        <span class="credits">4 créditos</span>
                    </div>
                </div>
                <div class="planner-summary">
                    <p>Créditos seleccionados: <span id="selectedCredits">0</span>/30</p>
                    <button class="btn primary" onclick="savePlanning()">Guardar Planificación</button>
                </div>
            </div>
        `;
    } else if (type === 'anual') {
        title.textContent = 'Plan Académico Anual';
        content.innerHTML = `
            <div class="planner-content">
                <h3>Planificación Año 2025</h3>
                <div class="annual-planning">
                    <div class="semester-block">
                        <h4>2025-1</h4>
                        <div class="semester-courses">
                            <p>Cursos planificados aparecerán aquí...</p>
                        </div>
                    </div>
                    <div class="semester-block">
                        <h4>2025-2</h4>
                        <div class="semester-courses">
                            <p>Cursos planificados aparecerán aquí...</p>
                        </div>
                    </div>
                </div>
                <button class="btn primary" onclick="generateAnnualPlan()">Generar Plan Sugerido</button>
            </div>
        `;
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closePlanner() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking the X
closeBtn.addEventListener('click', closePlanner);

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    if (event.target === modal) {
        closePlanner();
    }
});

// Course selection functionality
document.addEventListener('change', function(e) {
    if (e.target.type === 'checkbox' && e.target.name === 'course') {
        updateSelectedCredits();
    }
});

function updateSelectedCredits() {
    const checkboxes = document.querySelectorAll('input[name="course"]:checked');
    let totalCredits = 0;
    
    checkboxes.forEach(checkbox => {
        const creditText = checkbox.parentElement.querySelector('.credits').textContent;
        const credits = parseInt(creditText.match(/\d+/)[0]);
        totalCredits += credits;
    });
    
    const selectedCreditsSpan = document.getElementById('selectedCredits');
    if (selectedCreditsSpan) {
        selectedCreditsSpan.textContent = totalCredits;
    }
}

function savePlanning() {
    const selectedCourses = document.querySelectorAll('input[name="course"]:checked');
    const courseNames = Array.from(selectedCourses).map(cb => 
        cb.parentElement.querySelector('label').textContent
    );
    
    alert(`Planificación guardada:\n${courseNames.join('\n')}`);
    closePlanner();
}

function generateAnnualPlan() {
    alert('Generando plan académico sugerido basado en tu progreso actual...');
    // Aquí se conectaría con la API de malla curricular
}

// Course card interactions
document.addEventListener('click', function(e) {
    if (e.target.closest('.course-card')) {
        const courseCard = e.target.closest('.course-card');
        const courseName = courseCard.querySelector('h4').textContent;
        
        // Show course details (placeholder)
        showCourseDetails(courseName);
    }
});

function showCourseDetails(courseName) {
    alert(`Detalles del curso: ${courseName}\n\nEsta funcionalidad se expandirá para mostrar:\n- Descripción del curso\n- Prerrequisitos\n- Horarios disponibles\n- Profesores\n- Evaluaciones`);
}

// Simulate data updates (placeholder for API integration)
function updateStudentData() {
    // This will be replaced with actual API calls
    console.log('Updating student data...');
}

// Initialize progress bars animation
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => {
            bar.style.width = width;
        }, 500);
    });
}

// Run progress bar animation on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(animateProgressBars, 1000);
});

// Funciones para integración con APIs externas
async function initializeUserData() {
    try {
        // Obtener datos del usuario del localStorage
        const userDataStr = localStorage.getItem('userData');
        if (!userDataStr) {
            console.log('No hay datos de usuario almacenados');
            return;
        }
        
        const userData = JSON.parse(userDataStr);
        
        // Actualizar información del usuario en la interfaz
        const usernameElement = document.getElementById('username');
        if (usernameElement) {
            usernameElement.textContent = userData.rut || 'Usuario';
        }
        
        // Si hay carreras, cargar datos de la primera carrera por defecto
        if (userData.carreras && userData.carreras.length > 0) {
            // Crear selector de carreras si hay más de una
            if (userData.carreras.length > 1) {
                createCarreraSelector(userData.carreras);
            }
            
            const primeraCarrera = userData.carreras[0];
            await loadCarreraData(primeraCarrera);
        }
        
    } catch (error) {
        console.error('Error inicializando datos del usuario:', error);
    }
}

async function loadCarreraData(carrera) {
    try {
        showLoadingState(true);
        
        const userData = JSON.parse(localStorage.getItem('userData'));
        const rut = userData.rut;
        
        // Obtener datos completos: malla + avance
        const result = await window.apiService.getDatosCompletosEstudiante(
            userData.email || 'usuario@ucn.cl', // Email no viene en la respuesta del login
            'password', // Necesitarías almacenar esto de forma segura
            carrera.codigo,
            carrera.catalogo
        );
        
        if (result.success) {
            const { malla, avance } = result.data;
            
            // Procesar estadísticas
            const estadisticas = window.apiService.procesarEstadisticas(avance, malla);
            
            // Actualizar interfaz con datos reales
            updateInterfaceWithRealData(estadisticas, malla, avance, carrera);
            
        } else {
            console.error('Error cargando datos de la carrera:', result.error);
            showError('Error cargando datos académicos. Usando datos de ejemplo.');
        }
        
    } catch (error) {
        console.error('Error en loadCarreraData:', error);
        showError('Error de conexión. Usando datos de ejemplo.');
    } finally {
        showLoadingState(false);
    }
}

function updateInterfaceWithRealData(estadisticas, malla, avance, carrera) {
    // Actualizar estadísticas
    updateStatistics(estadisticas);
    
    // Actualizar cursos inscritos con datos reales
    updateCurrentCourses(avance, malla);
    
    // Actualizar información de la carrera
    updateCarreraInfo(carrera);
}

function updateStatistics(estadisticas) {
    // Actualizar créditos totales
    const creditosElement = document.querySelector('.stats-card:nth-child(1) .stat-value');
    if (creditosElement) {
        creditosElement.textContent = `${estadisticas.creditosAprobados}/${estadisticas.creditosTotales}`;
    }
    
    // Actualizar barra de progreso
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
        progressBar.style.width = `${estadisticas.porcentajeAvance}%`;
    }
    
    // Actualizar ramos aprobados
    const ramosElement = document.querySelector('.stats-card:nth-child(2) .stat-value');
    if (ramosElement) {
        ramosElement.textContent = `${estadisticas.cursosAprobados}/${malla.length}`;
    }
    
    // Actualizar promedio
    const promedioElement = document.querySelector('.stats-card:nth-child(3) .stat-value');
    if (promedioElement) {
        promedioElement.textContent = estadisticas.promedio.toFixed(1);
    }
    
    // Actualizar porcentaje de avance
    const avanceElement = document.querySelector('.stats-card:nth-child(4) .stat-value');
    if (avanceElement) {
        avanceElement.textContent = `${estadisticas.porcentajeAvance}%`;
    }
}

function updateCurrentCourses(avance, malla) {
    const coursesGrid = document.querySelector('.courses-grid');
    if (!coursesGrid) return;
    
    // Limpiar cursos existentes
    coursesGrid.innerHTML = '';
    
    // Obtener cursos en proceso (inscritos actualmente)
    const cursosEnProceso = avance.filter(curso => curso.status === 'EN_PROCESO');
    
    if (cursosEnProceso.length === 0) {
        // Si no hay cursos en proceso, mostrar los últimos aprobados
        const ultimosAprobados = avance
            .filter(curso => curso.status === 'APROBADO')
            .slice(-6); // Últimos 6 cursos aprobados
        
        ultimosAprobados.forEach(curso => {
            const asignatura = malla.find(a => a.codigo === curso.course);
            if (asignatura) {
                const courseCard = createCourseCard(asignatura, curso, 'aprobado');
                coursesGrid.appendChild(courseCard);
            }
        });
    } else {
        // Mostrar cursos en proceso
        cursosEnProceso.forEach(curso => {
            const asignatura = malla.find(a => a.codigo === curso.course);
            if (asignatura) {
                const courseCard = createCourseCard(asignatura, curso, 'inscrito');
                coursesGrid.appendChild(courseCard);
            }
        });
    }
}

function createCourseCard(asignatura, curso, estado) {
    const card = document.createElement('div');
    card.className = `course-card ${estado}`;
    
    const statusText = {
        'aprobado': 'Aprobado',
        'inscrito': 'En Proceso',
        'reprobado': 'Reprobado'
    };
    
    card.innerHTML = `
        <h4>${asignatura.asignatura}</h4>
        <div class="course-details">
            <span class="credits">${asignatura.creditos} créditos</span>
            <span class="schedule">${statusText[estado]}</span>
        </div>
        <div class="course-code">${asignatura.codigo}</div>
    `;
    
    return card;
}

function updateCarreraInfo(carrera) {
    // Actualizar información de la carrera en el header o donde sea apropiado
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
            await loadCarreraData(carrera);
        }
    });
    
    selectorContainer.appendChild(label);
    selectorContainer.appendChild(select);
    userInfo.appendChild(selectorContainer);
}

function showLoadingState(show) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (show) {
        if (!loadingIndicator) {
            const indicator = document.createElement('div');
            indicator.id = 'loading-indicator';
            indicator.innerHTML = `
                <div style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 255, 255, 0.9);
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                ">
                    <div style="
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #667eea;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 10px;
                    "></div>
                    <div>Cargando datos académicos...</div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(indicator);
        }
    } else {
        if (loadingIndicator) {
            loadingIndicator.remove();
        }
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

// Función para cambiar de carrera
async function cambiarCarrera(codigoCarrera, catalogo) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const carrera = userData.carreras.find(c => c.codigo === codigoCarrera && c.catalogo === catalogo);
    
    if (carrera) {
        await loadCarreraData(carrera);
    }
}

// Export functions for future API integration
window.academicProjection = {
    openPlanner,
    closePlanner,
    savePlanning,
    generateAnnualPlan,
    updateStudentData,
    showCourseDetails,
    loadCarreraData,
    cambiarCarrera,
    initializeUserData
};