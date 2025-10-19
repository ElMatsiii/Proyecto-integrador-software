// =============================
// main.js - lógica central
// =============================

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const container = document.querySelector("main");

  // --- LOGIN ---
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const mensaje = document.getElementById("mensaje");

      mensaje.textContent = "Iniciando sesión...";
      mensaje.style.color = "black";

      try {
        const url = `https://puclaro.ucn.cl/eross/avance/login.php?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
          mensaje.textContent = "Credenciales incorrectas.";
          mensaje.style.color = "red";
          return;
        }

        // Guardar usuario base sin carrera seleccionada
        localStorage.setItem(
          "usuario",
          JSON.stringify({
            email,
            rut: data.rut,
            carreras: data.carreras,
          })
        );

        // Si tiene más de una carrera -> mostrar selección
        if (data.carreras.length > 1) {
          mostrarSelectorCarrera(container, data);
        } else {
          // Si solo tiene una carrera, guardarla y continuar
          const carrera = data.carreras[0];
          localStorage.setItem("carreraSeleccionada", JSON.stringify(carrera));
          window.location.href = "malla.html";
        }
      } catch (err) {
        console.error("Error de conexión:", err);
        mensaje.textContent = "Error al conectar con el servidor.";
        mensaje.style.color = "red";
      }
    });
  }

  // --- LOGOUT ---
  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("usuario");
      localStorage.removeItem("carreraSeleccionada");
      window.location.href = "index.html";
    });
  }

  // --- VALIDAR SESIÓN ---
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const carreraSeleccionada = JSON.parse(localStorage.getItem("carreraSeleccionada") || "null");
  const page = window.location.pathname;

  if (!usuario && !page.includes("index.html") && !page.includes("register.html")) {
    window.location.href = "index.html";
  }

  // --- PERFIL ---
  if (page.includes("perfil.html") && usuario && carreraSeleccionada) {
    const main = document.querySelector("main");
    main.innerHTML = `
      <h2>Perfil del Estudiante</h2>
      <p><strong>Correo:</strong> ${usuario.email}</p>
      <p><strong>RUT:</strong> ${usuario.rut}</p>
      <p><strong>Carrera seleccionada:</strong> ${carreraSeleccionada.nombre}</p>
      <p><strong>Código:</strong> ${carreraSeleccionada.codigo}</p>
      <p><strong>Catálogo:</strong> ${carreraSeleccionada.catalogo}</p>
    `;
  }

  // --- MALLA ---
if (page.includes("malla.html") && usuario && carreraSeleccionada) {
  const nombreElem = document.getElementById("usuarioNombre");
  const rutElem = document.getElementById("usuarioRut");
  nombreElem.textContent = usuario.email;
  rutElem.textContent = usuario.rut;

  // Llamar a la API de mallas (vía proxy)
  cargarMalla(carreraSeleccionada);
}

// =============================
// Función para cargar Malla
// =============================
async function cargarMalla(carrera) {
  const main = document.querySelector("main");

  try {
    // Endpoint local (proxy)
    const url =`http://localhost:3000/api/malla?codigo=8606&catalogo=201610`;

    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      main.innerHTML += "<p>No se encontraron ramos en la malla.</p>";
      return;
    }

    // Agrupar por nivel
    const niveles = {};
    data.forEach((curso) => {
      if (!niveles[curso.nivel]) niveles[curso.nivel] = [];
      niveles[curso.nivel].push(curso);
    });

    // Crear visualización
    let html = `<h3>Malla Curricular (${carrera.nombre})</h3>`;
    Object.keys(niveles)
      .sort((a, b) => a - b)
      .forEach((nivel) => {
        html += `<h4>Semestre ${nivel}</h4>`;
        html += `<div class="malla-grid">`;
        niveles[nivel].forEach((curso) => {
          html += `
            <div class="curso pendiente">
              <h4>${curso.asignatura}</h4>
              <p><strong>Código:</strong> ${curso.codigo}</p>
              <p><strong>Créditos:</strong> ${curso.creditos}</p>
              <p><strong>Prerrequisitos:</strong> ${
                curso.prereq ? curso.prereq : "Ninguno"
              }</p>
            </div>
          `;
        });
        html += `</div>`;
      });

    main.innerHTML += html;
  } catch (err) {
    console.error("Error cargando malla:", err);
    main.innerHTML += `<p style="color:red;">Error al cargar malla curricular.</p>`;
  }
}


  // --- AVANCE / RESUMEN ---
  if (page.includes("resumen.html") && usuario && carreraSeleccionada) {
    mostrarAvance(usuario, carreraSeleccionada);
  }
});

// =============================
// Selector de carrera
// =============================
function mostrarSelectorCarrera(container, data) {
  const carreras = data.carreras;
  container.innerHTML = `
    <h2>Bienvenido/a</h2>
    <p>Selecciona la carrera que deseas visualizar:</p>
    <div class="selector-carreras" style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
      ${carreras
        .map(
          (c) =>
            `<button class="btn-carrera" data-codigo="${c.codigo}" data-nombre="${c.nombre}" data-catalogo="${c.catalogo}" style="padding:10px;border:none;border-radius:8px;background:#667eea;color:white;cursor:pointer;">
              ${c.nombre} (${c.codigo})
            </button>`
        )
        .join("")}
    </div>
  `;

  document.querySelectorAll(".btn-carrera").forEach((btn) => {
    btn.addEventListener("click", () => {
      const carrera = {
        codigo: btn.dataset.codigo,
        nombre: btn.dataset.nombre,
        catalogo: btn.dataset.catalogo,
      };
      localStorage.setItem("carreraSeleccionada", JSON.stringify(carrera));
      window.location.href = "malla.html";
    });
  });
}

// =============================
// Función para cargar avance + detalle
// =============================
async function mostrarAvance(usuario, carrera) {
  const dash = document.querySelector(".dashboard");

  if (!usuario || !carrera) {
    dash.innerHTML = "<p>No hay carrera seleccionada.</p>";
    return;
  }

  try {
    const url = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      dash.innerHTML = `<p>Error al obtener avance: ${data.error}</p>`;
      return;
    }

    const total = data.length;
    const aprobados = data.filter((r) => r.status === "APROBADO").length;
    const reprobados = data.filter((r) => r.status === "REPROBADO").length;
    const avance = total > 0 ? ((aprobados / total) * 100).toFixed(1) : 0;

    // --- Resumen general ---
    let html = `
      <p>Créditos aprobados: <strong>${aprobados} / ${total}</strong></p>
      <p>Avance de carrera: <strong>${avance}%</strong></p>
      <p>Ramos reprobados: <strong>${reprobados}</strong></p>
      <h3 style="margin-top:30px;">Detalle de ramos cursados</h3>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <thead>
          <tr style="background-color:#667eea;color:white;">
            <th style="padding:8px;text-align:left;">Código</th>
            <th style="padding:8px;text-align:left;">NRC</th>
            <th style="padding:8px;text-align:left;">Período</th>
            <th style="padding:8px;text-align:left;">Estado</th>
          </tr>
        </thead>
        <tbody>
    `;

    // --- Agregar cada ramo ---
    data.forEach((r) => {
      let color =
        r.status === "APROBADO"
          ? "#28a745"
          : r.status === "REPROBADO"
          ? "#dc3545"
          : "#6c757d";

      html += `
        <tr style="border-bottom:1px solid #ccc;">
          <td style="padding:8px;">${r.course}</td>
          <td style="padding:8px;">${r.nrc}</td>
          <td style="padding:8px;">${r.period}</td>
          <td style="padding:8px; color:${color}; font-weight:bold;">${r.status}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    dash.innerHTML = html;
  } catch (err) {
    console.error("Error cargando avance:", err);
    dash.innerHTML = `<p style="color:red">Error al conectar con el servidor.</p>`;
  }
}
