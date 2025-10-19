// ============================
// AUTH.JS - LOGIN CON API REAL
// ============================

// Esperar a que el DOM cargue completamente antes de buscar el formulario
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  if (!form) {
    console.error("No se encontró el formulario de login (#loginForm).");
    return;
  }

  console.log("Formulario detectado. Listo para iniciar sesión.");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const mensaje = document.getElementById("mensaje");

    if (!email || !password) {
      mensaje.textContent = "Por favor, completa todos los campos.";
      mensaje.style.color = "red";
      return;
    }

    mensaje.textContent = "Conectando con el servidor...";
    mensaje.style.color = "#333";

    const url = `http://localhost:3000/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
    const requestOptions = {
      method: 'GET',
      redirect: 'follow'
    };

    try {
      const response = await fetch(url, requestOptions);

      // Validar estado HTTP
      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status}`);
      }

      const rawText = await response.text();
      console.log("Respuesta cruda:", rawText);

      let data;
      try {
        data = JSON.parse(rawText);
      } catch (err) {
        throw new Error("Error al convertir la respuesta en JSON.");
      }

      // Manejo de errores de login
      if (data.error) {
        mensaje.textContent = "Credenciales incorrectas";
        mensaje.style.color = "red";
        localStorage.clear();
        return;
      }

      // Respuesta positiva
      if (data.rut && Array.isArray(data.carreras)) {
        mensaje.textContent = "Inicio de sesión exitoso";
        mensaje.style.color = "green";

        // Guardar en localStorage
        localStorage.setItem("usuario", email);
        localStorage.setItem("rut", data.rut);
        localStorage.setItem("carreras", JSON.stringify(data.carreras));

        console.log("Datos guardados:", data);

        // Redirigir tras 1 segundo
        setTimeout(() => {
          window.location.href = "malla.html";
        }, 1000);
      } else {
        mensaje.textContent = "Respuesta inesperada del servidor.";
        mensaje.style.color = "orange";
      }

    } catch (error) {
      console.error("Error al conectar:", error);
      mensaje.textContent = "No se pudo conectar con el servidor.";
      mensaje.style.color = "orange";
    }
  });
});
