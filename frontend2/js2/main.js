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

      // Ordenar carreras por catálogo descendente (más reciente primero)
      const carrerasOrdenadas = data.carreras.sort((a, b) => b.catalogo.localeCompare(a.catalogo));

      // Guardar usuario completo
      localStorage.setItem(
        "usuario",
        JSON.stringify({
          email,
          rut: data.rut,
          carreras: carrerasOrdenadas,
        })
      );

      // Seleccionar por defecto la carrera más reciente
      const carrera = carrerasOrdenadas[0];
      localStorage.setItem("carreraSeleccionada", JSON.stringify(carrera));

      // Ir directo a inicio.html
      window.location.href = "inicio.html";
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
if (page.includes("inicio.html") && usuario) {
  const nombreCarrera = document.getElementById("nombreCarrera");
  const semestreSpan = document.getElementById("semestreActual");
  const selectSemestre = document.getElementById("selectSemestre");
  const ramosContainer = document.getElementById("ramosContainer");
  const infoCreditos = document.getElementById("infoCreditos");
  const btnManual = document.getElementById("btnManual");
  const btnAuto = document.getElementById("btnAuto");
  const selectorCarreraContainer = document.getElementById("selectorCarreraContainer");
  const selectorCarrera = document.getElementById("selectorCarrera");
  const etiquetaCarrera = document.getElementById("etiquetaCarrera");

  const carreras = usuario.carreras;
  let carreraSeleccionada = JSON.parse(localStorage.getItem("carreraSeleccionada") || "null");

  // Calcular semestre actual según fecha real (Ej: 202520 o 202610)
  const ahora = new Date();
  const año = ahora.getFullYear();
  const semestre = ahora.getMonth() < 6 ? "10" : "20"; // Primer semestre: enero-junio → "10", segundo → "20"
  const semestreActual = `${año}${semestre}`;
  semestreSpan.textContent = semestreActual;

  // Mostrar dropdown solo si hay más de una carrera
  if (carreras.length > 1) {
    selectorCarreraContainer.style.display = "block";
    selectorCarrera.innerHTML = "";

    carreras.forEach((c, index) => {
      const opt = document.createElement("option");
      opt.value = index;
      opt.textContent = `${c.nombre} (${c.catalogo})`;
      if (c.codigo === carreraSeleccionada?.codigo) opt.selected = true;
      selectorCarrera.appendChild(opt);
    });

    selectorCarrera.addEventListener("change", async (e) => {
      const seleccion = carreras[e.target.value];
      localStorage.setItem("carreraSeleccionada", JSON.stringify(seleccion));
      carreraSeleccionada = seleccion;
      await actualizarInicio();
    });
  } else {
    selectorCarreraContainer.style.display = "none";
  }

  async function actualizarInicio() {
    if (!carreraSeleccionada) {
      carreraSeleccionada = carreras[0];
      localStorage.setItem("carreraSeleccionada", JSON.stringify(carreraSeleccionada));
    }

    nombreCarrera.textContent = carreraSeleccionada.nombre;

    // Determinar si es la carrera actual o una anterior
    const carreraMasReciente = carreras.reduce((a, b) => (b.catalogo > a.catalogo ? b : a));
    if (carreraSeleccionada.codigo === carreraMasReciente.codigo) {
      etiquetaCarrera.textContent = "Carrera actual";
      etiquetaCarrera.style.color = "green";
    } else {
      etiquetaCarrera.textContent = "Carrera anterior";
      etiquetaCarrera.style.color = "gray";
    }

    // Cargar avance de la carrera seleccionada
    const urlAvance = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carreraSeleccionada.codigo}`;
    const response = await fetch(urlAvance);
    const avance = await response.json();

    if (!Array.isArray(avance) || avance.length === 0) {
      ramosContainer.innerHTML = "<p>No se encontraron registros para esta carrera.</p>";
      return;
    }

    // Obtener semestres únicos (ordenados)
    const semestres = [...new Set(avance.map(r => r.period))].sort();

    // Dropdown de semestres (todos los que existan)
    selectSemestre.innerHTML = "";
    semestres.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s.endsWith("15")
        ? `${s} (Invierno/Verano)`
        : s.endsWith("10")
        ? `${s} (Primer semestre)`
        : `${s} (Segundo semestre)`;
      selectSemestre.appendChild(opt);
    });

    // Mostrar semestre más reciente al inicio
    selectSemestre.value = semestres[semestres.length - 1];

    await mostrarRamosInicio(usuario, carreraSeleccionada, selectSemestre, ramosContainer, infoCreditos);
  }

  actualizarInicio();

  btnManual.addEventListener("click", () => window.location.href = "proyeccion-manual.html");
  btnAuto.addEventListener("click", () => window.location.href = "proyeccion-automatica.html");
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
// Selector de carrera → Mostrar Ramos Inicio (versión mejorada)
// =============================
async function mostrarRamosInicio(usuario, carrera, selectSemestre, contenedor, infoCreditos) {
  try {
    // 1️⃣ Obtener avance académico
    const url = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
    const response = await fetch(url);
    const avance = await response.json();

    if (!Array.isArray(avance) || avance.length === 0) {
      contenedor.innerHTML = "<p>No se encontraron ramos.</p>";
      return;
    }

    // 2️⃣ Identificar los semestres únicos
    const semestres = [...new Set(avance.map(r => r.period))].sort();
    const semestreActual = semestres[semestres.length - 1];
    let semestreSeleccionado = semestreActual;

    // 3️⃣ Llenar el dropdown de semestres
    selectSemestre.innerHTML = "";
    semestres.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s.endsWith("15")
        ? `${s} (Invierno/Verano)`
        : s.endsWith("10")
        ? `${s} (Primer semestre)`
        : `${s} (Segundo semestre)`;
      if (s === semestreActual) opt.selected = true;
      selectSemestre.appendChild(opt);
    });

    // 4️⃣ Obtener malla para obtener nombres de ramos
    const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;
    const responseMalla = await fetch(urlMalla);
    const malla = await responseMalla.json();

    // Crear mapa de nombres con normalización completa
    const mapaNombres = {};
    if (Array.isArray(malla)) {
      malla.forEach(c => {
        const codigoNormalizado = c.codigo
          .trim()
          .toUpperCase()
          .replace(/[\s\-]/g, ""); // elimina espacios y guiones
        mapaNombres[codigoNormalizado] = c.asignatura.trim();
      });
    }

    // 5️⃣ Función robusta para buscar el nombre del ramo
    const obtenerNombre = (codigo) => {
      const codigoLimpio = codigo
        .trim()
        .toUpperCase()
        .replace(/[\s\-]/g, "");

      // Coincidencia exacta
      if (mapaNombres[codigoLimpio]) return mapaNombres[codigoLimpio];

      // Coincidencia parcial por sufijo (para ECINM ↔ ECIN, DCCB ↔ DCC)
      const encontrado = Object.keys(mapaNombres).find(k =>
        k.endsWith(codigoLimpio.slice(-5))
      );
      if (encontrado) return mapaNombres[encontrado];

      // Fallback genérico por prefijo
      if (codigoLimpio.startsWith("DCTE")) return "Curso de Formación General";
      if (codigoLimpio.startsWith("UNFP")) return "Curso de Formación Profesional";
      if (codigoLimpio.startsWith("SSED")) return "Curso de Inglés o Comunicación";
      if (codigoLimpio.startsWith("ECIN")) return "Curso de Ingeniería o Programación";
      if (codigoLimpio.startsWith("DCCB")) return "Curso de Ciencias Básicas";

      return codigo; // fallback final
    };

    // 6️⃣ Renderizar los ramos sin duplicados dentro de cada semestre
    const renderRamos = (sem) => {
      contenedor.innerHTML = "";

      // Agrupar por curso dentro del semestre (evita duplicados dentro del mismo)
      const vistos = new Set();
      const filtrados = avance.filter(r => r.period === sem && !vistos.has(r.course) && vistos.add(r.course));

      let totalCreditos = 0;

      filtrados.forEach((r) => {
        // Buscar nombre usando coincidencia avanzada
        const nombreRamo = obtenerNombre(r.course);
        const creditos = 6;
        totalCreditos += creditos;

        // Colores según estado
        const div = document.createElement("div");
        div.classList.add("curso");

        if (r.status === "APROBADO") div.classList.add("aprobado");
        else if (r.status === "REPROBADO") div.classList.add("reprobado");
        else if (r.status === "INSCRITO" || r.status === "EN_CURSO") div.classList.add("inscrito");

        div.innerHTML = `
          <h4>${nombreRamo}</h4>
          <p><strong>Periodo:</strong> ${r.period}</p>
          <p><strong>Estado:</strong> ${r.status}</p>
          <p><strong>Créditos:</strong> ${creditos}</p>
        `;
        contenedor.appendChild(div);
      });

      // Créditos totales y validación de límite
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

    // 7️⃣ Mostrar por defecto el semestre más reciente
    renderRamos(semestreSeleccionado);
    selectSemestre.addEventListener("change", (e) => renderRamos(e.target.value));

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
// AVANCE / RESUMEN ACADÉMICO (versión con columna "Intentos")
// =============================
async function mostrarAvance(usuario, carrera) {
  const main = document.querySelector("main");

  // Estructura base
  main.innerHTML = `
    <h2>Resumen Académico</h2>
    <div class="dashboard" id="resumenDashboard"></div>
    <div class="dashboard" id="avanceCarrera"></div>

    <div class="tabla-container" style="margin-top:25px;">
      <table id="tablaResumen" style="
        width:100%;
        border-collapse:separate;
        border-spacing:0 10px;
        font-size:15px;
      ">
        <thead style="background:linear-gradient(135deg,#5f48cc,#7a66cc);color:white;">
          <tr>
            <th style="padding:10px;border-top-left-radius:10px;">Código</th>
            <th>Nombre del ramo</th>
            <th>Estado</th>
            <th>Período</th>
            <th>Intentos</th>
            <th style="border-top-right-radius:10px;">Tipo de Inscripción</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>
  `;

  const dash = document.getElementById("resumenDashboard");
  const avanceBox = document.getElementById("avanceCarrera");
  const tbody = document.querySelector("#tablaResumen tbody");

  try {
    // 1️⃣ Obtener avance académico
    const urlAvance = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
    const respAvance = await fetch(urlAvance);
    const data = await respAvance.json();

    if (!Array.isArray(data) || data.length === 0) {
      main.innerHTML += `<p>No se encontró información académica para esta carrera.</p>`;
      return;
    }

    // 2️⃣ Obtener malla (para nombres)
    const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;
    const respMalla = await fetch(urlMalla);
    const malla = await respMalla.json();

    // Crear mapa normalizado
    const mapaNombres = {};
    if (Array.isArray(malla)) {
      malla.forEach(c => {
        const codigoNormalizado = c.codigo
          .trim()
          .toUpperCase()
          .replace(/[\s\-]/g, "");
        mapaNombres[codigoNormalizado] = c.asignatura.trim();
      });
    }

    // Función de coincidencia robusta
    const obtenerNombre = (codigo) => {
      const codigoLimpio = codigo.trim().toUpperCase().replace(/[\s\-]/g, "");
      if (mapaNombres[codigoLimpio]) return mapaNombres[codigoLimpio];

      const encontrado = Object.keys(mapaNombres).find(k =>
        k.endsWith(codigoLimpio.slice(-5))
      );
      if (encontrado) return mapaNombres[encontrado];

      if (codigoLimpio.startsWith("DCTE")) return "Curso de Formación General";
      if (codigoLimpio.startsWith("UNFP")) return "Curso de Formación Profesional";
      if (codigoLimpio.startsWith("SSED")) return "Curso de Inglés o Comunicación";
      if (codigoLimpio.startsWith("ECIN")) return "Curso de Ingeniería o Programación";
      if (codigoLimpio.startsWith("DCCB")) return "Curso de Ciencias Básicas";

      return codigo;
    };

    // 3️⃣ Agrupar por curso para calcular intentos y obtener el más reciente
    const agrupados = {};
    data.forEach(r => {
      const codigo = r.course.trim().toUpperCase();
      if (!agrupados[codigo]) agrupados[codigo] = [];
      agrupados[codigo].push(r);
    });

    const resumenCursos = Object.entries(agrupados).map(([codigo, intentos]) => {
      // Ordenar por período
      intentos.sort((a, b) => a.period - b.period);
      const ultimoIntento = intentos[intentos.length - 1];

      return {
        codigo,
        nombre: obtenerNombre(codigo),
        status: ultimoIntento.status,
        period: ultimoIntento.period,
        inscriptionType: ultimoIntento.inscriptionType,
        intentos: intentos.length
      };
    });

    // 4️⃣ Calcular métricas con base en todos los intentos (no solo el último)
    let totalRamosMalla = 0;
    try {
      // Intentamos obtener la cantidad de ramos de la malla real
      totalRamosMalla = Array.isArray(malla) ? malla.length : resumenCursos.length;
    } catch {
      totalRamosMalla = resumenCursos.length;
    }

    // 1️⃣ Ramos aprobados → al menos un intento aprobado
    const aprobados = Object.values(agrupados).filter(intentos =>
      intentos.some(r => r.status === "APROBADO")
    ).length;

    // 2️⃣ Ramos reprobados → al menos un intento reprobado
    const reprobados = Object.values(agrupados).filter(intentos =>
      intentos.some(r => r.status === "REPROBADO")
    ).length;

    // 3️⃣ Ramos inscritos → al menos un intento en curso
    const inscritos = Object.values(agrupados).filter(intentos =>
      intentos.some(r => ["INSCRITO", "EN_CURSO"].includes(r.status))
    ).length;

    // 4️⃣ Avance de carrera basado en ramos aprobados sobre el total en malla
    const avanceCarreraPorc = ((aprobados / totalRamosMalla) * 100).toFixed(1);
    const creditosAprobados = aprobados * 6;


    // 5️⃣ Mostrar métricas
    dash.innerHTML = `
      <div style="display:flex;gap:20px;flex-wrap:wrap;">
        <div style="flex:1;background:linear-gradient(135deg,#5f48cc,#7a66cc);padding:15px;border-radius:10px;">
          <p><strong>Créditos aprobados:</strong> ${creditosAprobados}</p>
        </div>
        <div style="flex:1;background:linear-gradient(135deg,#663399,#7b68ee);padding:15px;border-radius:10px;">
          <p><strong>Ramos reprobados:</strong> ${reprobados}</p>
        </div>
        <div style="flex:1;background:linear-gradient(135deg,#5f48cc,#836fff);padding:15px;border-radius:10px;">
          <p><strong>Ramos inscritos/en curso:</strong> ${inscritos}</p>
        </div>
      </div>
    `;

    avanceBox.innerHTML = `
      <div style="margin-top:15px;background:linear-gradient(135deg,#4b3db4,#7a66cc);padding:15px;border-radius:10px;">
        <p><strong>Avance de carrera:</strong> ${avanceCarreraPorc}%</p>
      </div>
    `;

    // 6️⃣ Renderizar tabla
    tbody.innerHTML = "";
    resumenCursos
      .sort((a, b) => a.period.localeCompare(b.period))
      .forEach((r) => {
        const row = document.createElement("tr");

        // Asignar clase según estado para que el CSS maneje los colores
        if (r.status === "APROBADO") row.classList.add("aprobado");
        else if (r.status === "REPROBADO") row.classList.add("reprobado");
        else if (r.status === "INSCRITO" || r.status === "EN_CURSO") row.classList.add("inscrito");

        row.style.borderRadius = "10px";
        row.style.transition = "transform 0.2s ease, box-shadow 0.2s ease";
        row.style.cursor = "pointer";

        row.onmouseenter = () => {
          row.style.transform = "scale(1.01)";
          row.style.boxShadow = "0 0 10px rgba(255,255,255,0.15)";
        };
        row.onmouseleave = () => {
          row.style.transform = "scale(1)";
          row.style.boxShadow = "none";
        };

        row.innerHTML = `
          <td style="padding:10px 12px;border-radius:10px 0 0 10px;">${r.codigo}</td>
          <td style="padding:10px;">${r.nombre}</td>
          <td style="padding:10px;">${r.status}</td>
          <td style="padding:10px;">${r.period}</td>
          <td style="padding:10px;text-align:center;">${r.intentos}</td>
          <td style="padding:10px;border-radius:0 10px 10px 0;">${r.inscriptionType || "-"}</td>
        `;
        tbody.appendChild(row);
      });

  } catch (err) {
    console.error("Error al cargar resumen:", err);
    main.innerHTML += `<p style="color:red;">Error al conectar con el servidor.</p>`;
  }
}

// =============================
// PROYECCIÓN MANUAL (solo ramos pendientes)
// =============================
if (window.location.pathname.includes("proyeccion-manual.html")) {
  const contenedor = document.getElementById("proyeccionContainer");
  const btnGuardar = document.getElementById("btnGuardarProyeccion");
  const btnVolver = document.getElementById("btnVolver");

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const carrera = JSON.parse(localStorage.getItem("carreraSeleccionada") || "null");

  if (!usuario || !carrera) {
    window.location.href = "index.html";
  }

  async function cargarRamosPendientes() {
    try {
      contenedor.innerHTML = "<p>Cargando ramos pendientes...</p>";

      // --- Llamar a las APIs ---
      const urlAvance = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
      const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;

      const [respAvance, respMalla] = await Promise.all([fetch(urlAvance), fetch(urlMalla)]);
      const avance = await respAvance.json();
      const malla = await respMalla.json();

      if (!Array.isArray(avance) || avance.length === 0) {
        contenedor.innerHTML = "<p>No se encontró avance para este estudiante.</p>";
        return;
      }

      // --- Obtener listas útiles ---
      const aprobados = avance.filter(r => r.status === "APROBADO").map(r => r.course);
      const enCurso = avance.filter(r => r.status === "INSCRITO" || r.status === "EN_CURSO").map(r => r.course);

      // --- Determinar ramos pendientes ---
      const pendientes = malla.filter((ramo) => {
        // Si ya está aprobado o inscrito → se excluye
        if (aprobados.includes(ramo.codigo) || enCurso.includes(ramo.codigo)) return false;

        // Si tiene prerrequisitos, validamos que todos estén aprobados o en curso
        if (ramo.prereq && ramo.prereq.trim() !== "") {
          const prereqs = ramo.prereq.split(",").map(p => p.trim());
          return prereqs.every(p => aprobados.includes(p) || enCurso.includes(p));
        }

        return true; // sin prerequisitos → disponible
      });

      // --- Mostrar resultados ---
      if (pendientes.length === 0) {
        contenedor.innerHTML = "<p>🎓 No hay ramos pendientes para proyectar. ¡Felicidades!</p>";
        return;
      }

      contenedor.innerHTML = "";
      pendientes.forEach((curso) => {
        const div = document.createElement("div");
        div.classList.add("curso");
        div.innerHTML = `
          <input type="checkbox" id="${curso.codigo}" />
          <label for="${curso.codigo}">
            <strong>${curso.asignatura}</strong><br>
            <small>${curso.codigo} — ${curso.creditos} créditos</small>
          </label>
        `;
        contenedor.appendChild(div);
      });
    } catch (err) {
      console.error("Error cargando ramos pendientes:", err);
      contenedor.innerHTML = "<p style='color:red;'>Error al cargar los ramos pendientes.</p>";
    }
  }

  cargarRamosPendientes();

  btnGuardar.addEventListener("click", () => {
    const seleccionados = [...document.querySelectorAll("input[type='checkbox']:checked")].map(
      (chk) => chk.id
    );
    localStorage.setItem("proyeccionManual", JSON.stringify(seleccionados));
    alert("Proyección manual guardada correctamente.");
  });

  btnVolver.addEventListener("click", () => {
    window.location.href = "inicio.html";
  });
}


// =============================
// PROYECCIÓN AUTOMÁTICA
// =============================
if (window.location.pathname.includes("proyeccion-automatica.html")) {
  const contenedor = document.getElementById("resultadoAuto");
  const btnGenerar = document.getElementById("btnGenerarAuto");
  const btnVolver = document.getElementById("btnVolver");

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const carrera = JSON.parse(localStorage.getItem("carreraSeleccionada") || "null");

  if (!usuario || !carrera) {
    window.location.href = "index.html";
  }

  btnGenerar.addEventListener("click", async () => {
    contenedor.innerHTML = "<p>Generando proyección automática...</p>";

    try {
      const urlAvance = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
      const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;

      const [respAvance, respMalla] = await Promise.all([fetch(urlAvance), fetch(urlMalla)]);
      const avance = await respAvance.json();
      const malla = await respMalla.json();

      // Obtener ramos aprobados
      const aprobados = avance.filter(r => r.status === "APROBADO").map(r => r.course);

      // Elegir ramos cuyos prerrequisitos estén cumplidos
      const disponibles = malla.filter((r) => {
        if (!r.prereq) return true;
        const prereqs = r.prereq.split(",");
        return prereqs.every(p => aprobados.includes(p));
      });

      // Limitar por créditos
      const seleccion = [];
      let totalCreditos = 0;
      for (const ramo of disponibles) {
        if (totalCreditos + ramo.creditos <= 35) {
          seleccion.push(ramo);
          totalCreditos += ramo.creditos;
        }
      }

      // Mostrar resultado
      contenedor.innerHTML = "";
      seleccion.forEach((r) => {
        const div = document.createElement("div");
        div.classList.add("curso");
        div.innerHTML = `
          <h4>${r.asignatura}</h4>
          <p>${r.codigo}</p>
          <p><strong>${r.creditos}</strong> créditos</p>
        `;
        contenedor.appendChild(div);
      });

      if (seleccion.length === 0) {
        contenedor.innerHTML = "<p>No hay ramos disponibles para proyectar.</p>";
      }
    } catch (err) {
      console.error(err);
      contenedor.innerHTML = "<p style='color:red;'>Error al generar la proyección.</p>";
    }
  });

  btnVolver.addEventListener("click", () => {
    window.location.href = "inicio.html";
  });
}
