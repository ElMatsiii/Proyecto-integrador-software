// Importar el servicio de API (debe estar incluido en el HTML)
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById("loginBtn");
    
    if (loginBtn) {
        loginBtn.addEventListener("click", handleLogin);
    }
});

async function handleLogin() {
    const email = document.getElementById("rut").value.trim(); // Usando el campo RUT como email
    const password = document.getElementById("password").value.trim();
    
    if (email === "" || password === "") {
        showError("Por favor complete todos los campos.");
        return;
    }
    
    // Mostrar estado de carga
    const loginBtn = document.getElementById("loginBtn");
    const originalText = loginBtn.textContent;
    loginBtn.textContent = "Ingresando...";
    loginBtn.disabled = true;
    
    try {
        // Usar el servicio de API para hacer login
        const result = await window.apiService.login(email, password);
        
        if (result.success) {
            // Login exitoso
            const userData = result.data;
            
            // Guardar datos del usuario en localStorage para usar en otras páginas
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Mostrar mensaje de éxito
            showSuccess(`¡Bienvenido! Encontradas ${userData.carreras.length} carrera(s) asociadas.`);
            
            // Redirigir después de un breve delay
            setTimeout(() => {
                window.location.href = '../html/inicio.html';
            }, 1500);
            
        } else {
            // Error en login
            showError(`Error de autenticación: ${result.error}`);
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showError("Error de conexión. Por favor, intente nuevamente.");
    } finally {
        // Restaurar botón
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
    }
}

function showError(message) {
    // Crear o actualizar mensaje de error
    let errorDiv = document.getElementById('error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.style.cssText = `
            background-color: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid #f5c6cb;
        `;
        
        const loginContainer = document.querySelector('.login-container');
        loginContainer.insertBefore(errorDiv, loginContainer.firstChild);
    }
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    // Crear o actualizar mensaje de éxito
    let successDiv = document.getElementById('success-message');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.id = 'success-message';
        successDiv.style.cssText = `
            background-color: #d4edda;
            color: #155724;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid #c3e6cb;
        `;
        
        const loginContainer = document.querySelector('.login-container');
        loginContainer.insertBefore(successDiv, loginContainer.firstChild);
    }
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}
  