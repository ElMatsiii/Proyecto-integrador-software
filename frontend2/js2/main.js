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
          const carrera = data.carreras[0];
          localStorage.setItem("carreraSeleccionada", JSON.stringify(carrera));
          window.location.href = "inicio.html";
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

  // --- INICIO (pantalla principal) ---
  if (page.includes("inicio.html") && usuario && carreraSeleccionada) {
    const nombreCarrera = document.getElementById("nombreCarrera");
    const semestreSpan = document.getElementById("semestreActual");
    const selectSemestre = document.getElementById("selectSemestre");
    const ramosContainer = document.getElementById("ramosContainer");
    const infoCreditos = document.getElementById("infoCreditos");
    const btnManual = document.getElementById("btnManual");
    const btnAuto = document.getElementById("btnAuto");

    nombreCarrera.textContent = carreraSeleccionada.nombre;

    // Calcular semestre actual
    const ahora = new Date();
    const año = ahora.getFullYear();
    const semestre = ahora.getMonth() < 6 ? 1 : 2;
    const semestreActual = `${año}-${semestre}`;
    semestreSpan.textContent = semestreActual;

    localStorage.setItem("semestreActual", semestreActual);

    // Cargar avance y mostrar ramos
    mostrarRamosInicio(usuario, carreraSeleccionada, selectSemestre, ramosContainer, infoCreditos);

    // Botones
    btnManual.addEventListener("click", () => {
      window.location.href = "proyeccion-manual.html";
    });
    btnAuto.addEventListener("click", () => {
      window.location.href = "proyeccion-automatica.html";
    });
  }

  // --- MALLA ---
  if (page.includes("malla.html") && usuario && carreraSeleccionada) {
    cargarMalla(carreraSeleccionada);
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
      window.location.href = "inicio.html";
    });
  });
}

// =============================
// Mostrar ramos del INICIO
// =============================
async function mostrarRamosInicio(usuario, carrera, selectSemestre, contenedor, infoCreditos) {
  try {
    const url = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
    const response = await fetch(url);
    const avance = await response.json();

    if (!Array.isArray(avance) || avance.length === 0) {
      contenedor.innerHTML = "<p>No se encontraron ramos.</p>";
      return;
    }

    const semestres = [...new Set(avance.map(r => r.period))].sort();
    const semestreActual = semestres[semestres.length - 1];
    let semestreSeleccionado = semestreActual;

    selectSemestre.innerHTML = "";
    semestres.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      if (s === semestreActual) opt.selected = true;
      selectSemestre.appendChild(opt);
    });

    const renderRamos = (sem) => {
      const filtrados = avance.filter(r => r.period === sem);
      contenedor.innerHTML = "";
      let totalCreditos = 0;

      filtrados.forEach((r) => {
        const creditos = 6;
        totalCreditos += creditos;
        let color = "#f8f9fa";
        if (r.status === "APROBADO") color = "#d4edda";
        else if (r.status === "REPROBADO") color = "#f8d7da";
        else if (r.status === "INSCRITO" || r.status === "EN_CURSO") color = "#fff3cd";

        const div = document.createElement("div");
        div.classList.add("curso");
        div.style.backgroundColor = color;
        div.innerHTML = `
          <h4>${r.course}</h4>
          <p><strong>Periodo:</strong> ${r.period}</p>
          <p><strong>Estado:</strong> ${r.status}</p>
          <p><strong>Créditos:</strong> ${creditos}</p>
        `;
        contenedor.appendChild(div);
      });

      const exceso = totalCreditos > 35 ? totalCreditos - 35 : 0;
      infoCreditos.innerHTML = `
        <p>Total créditos del semestre: <strong>${totalCreditos}</strong></p>
        ${
          exceso > 0
            ? `<p style="color:red;">Supera el límite en ${exceso} créditos</p>`
            : `<p style="color:green;">Dentro del límite de créditos</p>`
        }
      `;
    };

    renderRamos(semestreSeleccionado);
    selectSemestre.addEventListener("change", (e) => {
      renderRamos(e.target.value);
    });
  } catch (err) {
    console.error("Error al mostrar ramos:", err);
    contenedor.innerHTML = `<p style="color:red;">Error al cargar los ramos.</p>`;
  }
}

// =============================
// Función para cargar Malla (solo visual, sin estados)
// =============================
async function cargarMalla(carrera) {
  const container = document.getElementById("mallaContainer");
  const main = document.querySelector("main");

  try {
    // Obtener malla desde el proxy
    const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;
    const response = await fetch(urlMalla);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>No se encontraron ramos en la malla.</p>";
      return;
    }

    // Agrupar por nivel (semestres)
    const niveles = {};
    data.forEach((curso) => {
      if (!niveles[curso.nivel]) niveles[curso.nivel] = [];
      niveles[curso.nivel].push(curso);
    });

    // Limpiar contenido
    container.innerHTML = "";

    // Generar visualización tipo bloques
    Object.keys(niveles)
      .sort((a, b) => a - b)
      .forEach((nivel) => {
        const bloque = document.createElement("div");
        bloque.classList.add("bloque-nivel");

        const titulo = document.createElement("h3");
        titulo.textContent = `Semestre ${nivel}`;
        bloque.appendChild(titulo);

        const grid = document.createElement("div");
        grid.classList.add("malla-grid");

        niveles[nivel].forEach((curso) => {
          const div = document.createElement("div");
          div.classList.add("curso");
          div.innerHTML = `
            <h4>${curso.asignatura}</h4>
            <p>${curso.codigo}</p>
          `;
          grid.appendChild(div);
        });

        bloque.appendChild(grid);
        container.appendChild(bloque);
      });
  } catch (err) {
    console.error("Error cargando malla:", err);
    main.innerHTML += `<p style="color:red;">Error al cargar malla curricular.</p>`;
  }
}

// =============================
// Avance (Resumen con tabla)
// =============================
async function mostrarAvance(usuario, carrera) {
  const main = document.querySelector("main");
  const dash = document.createElement("div");
  dash.classList.add("dashboard");

  try {
    const url = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      main.innerHTML = "<p>No se encontraron registros de avance.</p>";
      return;
    }

    // --- Cálculos del dashboard ---
    const total = data.length;
    const aprobados = data.filter(r => r.status === "APROBADO").length;
    const reprobados = data.filter(r => r.status === "REPROBADO").length;
    const enCurso = data.filter(r => r.status === "INSCRITO" || r.status === "EN_CURSO").length;
    const avance = total > 0 ? ((aprobados / total) * 100).toFixed(1) : 0;

    // --- Dashboard superior ---
    dash.innerHTML = `
      <p>Créditos aprobados: <strong>${aprobados}</strong></p>
      <p>Ramos reprobados: <strong>${reprobados}</strong></p>
      <p>Ramos inscritos/en curso: <strong>${enCurso}</strong></p>
      <p>Avance de carrera: <strong>${avance}%</strong></p>
    `;

    main.appendChild(dash);

    // --- Tabla de detalle ---
    const tabla = document.createElement("table");
    tabla.classList.add("tabla-avance");
    tabla.innerHTML = `
      <thead>
        <tr>
          <th>Código</th>
          <th>Estado</th>
          <th>Período</th>
          <th>Tipo de Inscripción</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(r => `
          <tr class="${r.status.toLowerCase()}">
            <td>${r.course}</td>
            <td>${r.status}</td>
            <td>${r.period}</td>
            <td>${r.inscriptionType}</td>
          </tr>
        `).join("")}
      </tbody>
    `;
    main.appendChild(tabla);

  } catch (err) {
    console.error("Error cargando avance:", err);
    main.innerHTML = `<p style="color:red;">Error al conectar con el servidor.</p>`;
  }
}
