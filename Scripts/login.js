document.getElementById("loginBtn").addEventListener("click", function() {
    const rut = document.getElementById("rut").value.trim();
    const password = document.getElementById("password").value.trim();
  
    if (rut === "" || password === "") {
      alert("Por favor complete todos los campos.");
      return;
    }
  
    // Aquí podrías validar con un backend
    alert("Intentando ingresar con RUT: " + rut);
    window.location.href = '../html/inicio.html';
  });
  