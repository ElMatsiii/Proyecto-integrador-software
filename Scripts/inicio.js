// Tab functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
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

// Export functions for future API integration
window.academicProjection = {
    openPlanner,
    closePlanner,
    savePlanning,
    generateAnnualPlan,
    updateStudentData,
    showCourseDetails
};