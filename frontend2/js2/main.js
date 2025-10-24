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
}
  // --- MALLA ---
  if (page.includes("malla.html") && usuario && carreraSeleccionada) {
    cargarMalla(carreraSeleccionada);
  }

  // --- AVANCE / RESUMEN ---
  if (page.includes("resumen.html") && usuario && carreraSeleccionada) {
    mostrarAvance(usuario, carreraSeleccionada);
  }
  // --- PROYECCIONES ---
  if (window.location.pathname.includes("proyecciones.html")) {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
    const carrera = JSON.parse(localStorage.getItem("carreraSeleccionada") || "null");

    if (!usuario || !carrera) {
      window.location.href = "index.html";
    } else {
      mostrarMallaProyeccion(usuario, carrera);
    }

    document.getElementById("btnManual").addEventListener("click", () => {
      window.location.href = "proyeccion-manual.html";
    });

    document.getElementById("btnAuto").addEventListener("click", () => {
      window.location.href = "proyeccion-automatica.html";
    });
  }

});

// =============================
// Selector de carrera → Mostrar Ramos Inicio (versión mejorada)
// =============================
async function mostrarRamosInicio(usuario, carrera, selectSemestre, contenedor, infoCreditos) {
  try {
    //Obtener avance académico
    const url = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
    const response = await fetch(url);
    const avance = await response.json();

    if (!Array.isArray(avance) || avance.length === 0) {
      contenedor.innerHTML = "<p>No se encontraron ramos.</p>";
      return;
    }

    //Identificar los semestres únicos
    const semestres = [...new Set(avance.map(r => r.period))].sort();
    const semestreActual = semestres[semestres.length - 1];
    let semestreSeleccionado = semestreActual;

    //lenar el dropdown de semestres
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

    //Obtener malla para obtener nombres de ramos
    const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;
    const responseMalla = await fetch(urlMalla);
    const malla = await responseMalla.json();

    //Crear mapa de nombres con normalización completa
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

    //Función robusta para buscar el nombre del ramo
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

    //Renderizar los ramos sin duplicados dentro de cada semestre
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

    //Mostrar por defecto el semestre más reciente
    renderRamos(semestreSeleccionado);
    selectSemestre.addEventListener("change", (e) => renderRamos(e.target.value));

  } catch (err) {
    console.error("Error al mostrar ramos:", err);
    contenedor.innerHTML = `<p style="color:red;">Error al cargar los ramos.</p>`;
  }
}

// =============================
// Función para cargar Malla
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
    //Obtener avance académico
    const urlAvance = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
    const respAvance = await fetch(urlAvance);
    const data = await respAvance.json();

    if (!Array.isArray(data) || data.length === 0) {
      main.innerHTML += `<p>No se encontró información académica para esta carrera.</p>`;
      return;
    }

    //Obtener malla (para nombres)
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

    // 3️Agrupar por curso para calcular intentos y obtener el más reciente
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

    //Calcular métricas con base en todos los intentos (no solo el último)
    let totalRamosMalla = 0;
    try {
      // Intentamos obtener la cantidad de ramos de la malla real
      totalRamosMalla = Array.isArray(malla) ? malla.length : resumenCursos.length;
    } catch {
      totalRamosMalla = resumenCursos.length;
    }

    //Ramos aprobados → al menos un intento aprobado
    const aprobados = Object.values(agrupados).filter(intentos =>
      intentos.some(r => r.status === "APROBADO")
    ).length;

    //Ramos reprobados → al menos un intento reprobado
    const reprobados = Object.values(agrupados).filter(intentos =>
      intentos.some(r => r.status === "REPROBADO")
    ).length;

    //Ramos inscritos → al menos un intento en curso
    const inscritos = Object.values(agrupados).filter(intentos =>
      intentos.some(r => ["INSCRITO", "EN_CURSO"].includes(r.status))
    ).length;

    //Avance de carrera basado en ramos aprobados sobre el total en malla
    const avanceCarreraPorc = ((aprobados / totalRamosMalla) * 100).toFixed(1);
    const creditosAprobados = aprobados * 6;


    //Mostrar métricas
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

    //Renderizar tabla
    tbody.innerHTML = "";
    resumenCursos
      .sort((a, b) => a.period.localeCompare(b.period))
      .forEach((r) => {
        const row = document.createElement("tr");

        //Asignar clase según estado para que el CSS maneje los colores
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
// NUEVA SECCIÓN: PROYECCIONES UNIFICADAS
// =============================
if (window.location.pathname.includes("proyecciones.html")) {
  const contenedor = document.getElementById("contenedorProyeccion");
  const btnIrManual = document.getElementById("btnIrManual");
  const btnIrAutomatica = document.getElementById("btnIrAutomatica");

  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const carrera = JSON.parse(localStorage.getItem("carreraSeleccionada") || "null");

  if (!usuario || !carrera) {
    window.location.href = "index.html";
  }

  // Botón Proyección Manual
  btnIrManual.addEventListener("click", async () => {
    contenedor.innerHTML = "<h3>Proyección Manual</h3><p>Cargando ramos pendientes...</p>";

    try {
      const urlAvance = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
      const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;
      const [respAvance, respMalla] = await Promise.all([fetch(urlAvance), fetch(urlMalla)]);
      const avance = await respAvance.json();
      const malla = await respMalla.json();

      const aprobados = avance.filter(r => r.status === "APROBADO").map(r => r.course);
      const enCurso = avance.filter(r => r.status === "INSCRITO" || r.status === "EN_CURSO").map(r => r.course);

      const pendientes = malla.filter((ramo) => {
        if (aprobados.includes(ramo.codigo) || enCurso.includes(ramo.codigo)) return false;
        if (ramo.prereq && ramo.prereq.trim() !== "") {
          const prereqs = ramo.prereq.split(",").map(p => p.trim());
          return prereqs.every(p => aprobados.includes(p) || enCurso.includes(p));
        }
        return true;
      });

      if (pendientes.length === 0) {
        contenedor.innerHTML = "<p>🎓 No hay ramos pendientes para proyectar. ¡Felicidades!</p>";
        return;
      }

      contenedor.innerHTML = `
        <h3>Proyección Manual</h3>
        <div class="proyeccion-grid" id="listaPendientes"></div>
        <div class="acciones">
          <button id="btnGuardarManual">Guardar Proyección</button>
        </div>
      `;

      const lista = document.getElementById("listaPendientes");
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
        lista.appendChild(div);
      });

      document.getElementById("btnGuardarManual").addEventListener("click", () => {
        const seleccionados = [...document.querySelectorAll("input[type='checkbox']:checked")].map(chk => chk.id);
        localStorage.setItem("proyeccionManual", JSON.stringify(seleccionados));
        alert("Proyección manual guardada correctamente.");
      });
    } catch (err) {
      console.error(err);
      contenedor.innerHTML = "<p style='color:red;'>Error al cargar los ramos pendientes.</p>";
    }
  });

  // Botón Proyección Automática
  btnIrAutomatica.addEventListener("click", async () => {
    contenedor.innerHTML = "<h3>Proyección Automática</h3><p>Generando...</p>";

    try {
      const urlAvance = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
      const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;
      const [respAvance, respMalla] = await Promise.all([fetch(urlAvance), fetch(urlMalla)]);
      const avance = await respAvance.json();
      const malla = await respMalla.json();

      const aprobados = avance.filter(r => r.status === "APROBADO").map(r => r.course);
      const disponibles = malla.filter(r => {
        if (!r.prereq) return true;
        const prereqs = r.prereq.split(",");
        return prereqs.every(p => aprobados.includes(p));
      });

      const seleccion = [];
      let totalCreditos = 0;
      for (const ramo of disponibles) {
        if (totalCreditos + ramo.creditos <= 35) {
          seleccion.push(ramo);
          totalCreditos += ramo.creditos;
        }
      }

      if (seleccion.length === 0) {
        contenedor.innerHTML = "<p>No hay ramos disponibles para proyectar.</p>";
        return;
      }

      contenedor.innerHTML = `
        <h3>Proyección Automática</h3>
        <div class="proyeccion-grid" id="listaAuto"></div>
      `;

      const listaAuto = document.getElementById("listaAuto");
      seleccion.forEach((r) => {
        const div = document.createElement("div");
        div.classList.add("curso");
        div.innerHTML = `
          <h4>${r.asignatura}</h4>
          <p>${r.codigo}</p>
          <p><strong>${r.creditos}</strong> créditos</p>
        `;
        listaAuto.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      contenedor.innerHTML = "<p style='color:red;'>Error al generar la proyección automática.</p>";
    }
  });
}

// =============================
// VISUALIZAR MALLA EN PROYECCIONES
// =============================
async function mostrarMallaProyeccion(usuario, carrera) {
  const contenedor = document.getElementById("contenedorMallaProyeccion");
  contenedor.innerHTML = "<p>Cargando malla...</p>";

  try {
    // Obtener datos de malla y avance del estudiante
    const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;
    const urlAvance = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;

    const [respMalla, respAvance] = await Promise.all([fetch(urlMalla), fetch(urlAvance)]);
    const malla = await respMalla.json();
    const avance = await respAvance.json();

    if (!Array.isArray(malla) || !Array.isArray(avance)) {
      contenedor.innerHTML = "<p>Error al cargar los datos de la malla.</p>";
      return;
    }

    // Mapear estado de cada ramo según avance
    const estadoRamos = {};
    avance.forEach(r => {
      const codigo = r.course.trim().toUpperCase();
      if (r.status === "APROBADO") estadoRamos[codigo] = "aprobado";
      else if (r.status === "REPROBADO") estadoRamos[codigo] = "reprobado";
      else if (r.status === "INSCRITO" || r.status === "EN_CURSO") estadoRamos[codigo] = "inscrito";
    });

    // Agrupar la malla por semestre
    const mallaPorNivel = {};
    malla.forEach(r => {
      const nivel = r.nivel || "Sin nivel";
      if (!mallaPorNivel[nivel]) mallaPorNivel[nivel] = [];
      mallaPorNivel[nivel].push(r);
    });

    // Renderizar la malla
    contenedor.innerHTML = "";
    const nivelesOrdenados = Object.keys(mallaPorNivel).sort((a, b) => a - b);

    nivelesOrdenados.forEach(nivel => {
      const columna = document.createElement("div");
      columna.classList.add("bloque-nivel");

      const titulo = document.createElement("h3");
      titulo.textContent = `Semestre ${nivel}`;
      columna.appendChild(titulo);

      const grid = document.createElement("div");
      grid.classList.add("malla-grid");

      mallaPorNivel[nivel].forEach(ramo => {
        const div = document.createElement("div");
        div.classList.add("curso");

        const codigo = ramo.codigo.trim().toUpperCase();
        const estado = estadoRamos[codigo] || "pendiente";
        div.classList.add(estado);

        div.innerHTML = `
          <h4>${ramo.asignatura}</h4>
          <p>${codigo}</p>
          <p>${ramo.creditos} créditos</p>
        `;
        grid.appendChild(div);
      });

      columna.appendChild(grid);
      contenedor.appendChild(columna);
    });
  } catch (error) {
    console.error("Error al cargar malla de proyección:", error);
    contenedor.innerHTML = "<p style='color:red;'>Error al cargar la malla de proyección.</p>";
  }
}

// =============================
// VISUALIZAR MALLA EN PROYECCIONES
// =============================
async function mostrarMallaProyeccion(usuario, carrera) {
  const contenedor = document.getElementById("contenedorMallaProyeccion");
  contenedor.innerHTML = "<p>Cargando malla...</p>";

  try {
    // Obtener datos de malla y avance del estudiante
    const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;
    const urlAvance = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;

    const [respMalla, respAvance] = await Promise.all([fetch(urlMalla), fetch(urlAvance)]);
    const malla = await respMalla.json();
    const avance = await respAvance.json();

    if (!Array.isArray(malla) || !Array.isArray(avance)) {
      contenedor.innerHTML = "<p>Error al cargar los datos de la malla.</p>";
      return;
    }

    // Mapear estado de cada ramo según avance
    const estadoRamos = {};
    avance.forEach(r => {
      const codigo = r.course.trim().toUpperCase();
      if (r.status === "APROBADO") estadoRamos[codigo] = "aprobado";
      else if (r.status === "REPROBADO") estadoRamos[codigo] = "reprobado";
      else if (r.status === "INSCRITO" || r.status === "EN_CURSO") estadoRamos[codigo] = "inscrito";
    });

    // Agrupar la malla por semestre
    const mallaPorNivel = {};
    malla.forEach(r => {
      const nivel = r.nivel || "Sin nivel";
      if (!mallaPorNivel[nivel]) mallaPorNivel[nivel] = [];
      mallaPorNivel[nivel].push(r);
    });

    // Renderizar la malla
    contenedor.innerHTML = "";
    const nivelesOrdenados = Object.keys(mallaPorNivel).sort((a, b) => a - b);

    nivelesOrdenados.forEach(nivel => {
      const columna = document.createElement("div");
      columna.classList.add("bloque-nivel");

      const titulo = document.createElement("h3");
      titulo.textContent = `Semestre ${nivel}`;
      columna.appendChild(titulo);

      const grid = document.createElement("div");
      grid.classList.add("malla-grid");

      mallaPorNivel[nivel].forEach(ramo => {
        const div = document.createElement("div");
        div.classList.add("curso");

        const codigo = ramo.codigo.trim().toUpperCase();
        const estado = estadoRamos[codigo] || "pendiente";
        div.classList.add(estado);

        div.innerHTML = `
          <h4>${ramo.asignatura}</h4>
          <p>${codigo}</p>
          <p>${ramo.creditos} créditos</p>
        `;
        grid.appendChild(div);
      });

      columna.appendChild(grid);
      contenedor.appendChild(columna);
    });
  } catch (error) {
    console.error("Error al cargar malla de proyección:", error);
    contenedor.innerHTML = "<p style='color:red;'>Error al cargar la malla de proyección.</p>";
  }
}

// =============================
// VISUALIZAR MALLA EN PROYECCIONES
// =============================
async function mostrarMallaProyeccion(usuario, carrera) {
  const contenedor = document.getElementById("contenedorMallaProyeccion");
  contenedor.innerHTML = "<p>Cargando malla...</p>";

  try {
    // Obtener datos de malla y avance del estudiante
    const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;
    const urlAvance = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;

    const [respMalla, respAvance] = await Promise.all([fetch(urlMalla), fetch(urlAvance)]);
    const malla = await respMalla.json();
    const avance = await respAvance.json();

    if (!Array.isArray(malla) || !Array.isArray(avance)) {
      contenedor.innerHTML = "<p>Error al cargar los datos de la malla.</p>";
      return;
    }

    // Mapear estado de cada ramo según avance
    const estadoRamos = {};
    avance.forEach(r => {
      const codigo = r.course.trim().toUpperCase();
      if (r.status === "APROBADO") estadoRamos[codigo] = "aprobado";
      else if (r.status === "REPROBADO") estadoRamos[codigo] = "reprobado";
      else if (r.status === "INSCRITO" || r.status === "EN_CURSO") estadoRamos[codigo] = "inscrito";
    });

    // Agrupar la malla por semestre
    const mallaPorNivel = {};
    malla.forEach(r => {
      const nivel = r.nivel || "Sin nivel";
      if (!mallaPorNivel[nivel]) mallaPorNivel[nivel] = [];
      mallaPorNivel[nivel].push(r);
    });

    // Renderizar la malla
    contenedor.innerHTML = "";
    const nivelesOrdenados = Object.keys(mallaPorNivel).sort((a, b) => a - b);

    nivelesOrdenados.forEach(nivel => {
      const columna = document.createElement("div");
      columna.classList.add("bloque-nivel");

      const titulo = document.createElement("h3");
      titulo.textContent = `Semestre ${nivel}`;
      columna.appendChild(titulo);

      const grid = document.createElement("div");
      grid.classList.add("malla-grid");

      mallaPorNivel[nivel].forEach(ramo => {
        const div = document.createElement("div");
        div.classList.add("curso");

        const codigo = ramo.codigo.trim().toUpperCase();
        const estado = estadoRamos[codigo] || "pendiente";
        div.classList.add(estado);

        div.innerHTML = `
          <h4>${ramo.asignatura}</h4>
          <p>${codigo}</p>
          <p>${ramo.creditos} créditos</p>
        `;
        grid.appendChild(div);
      });

      columna.appendChild(grid);
      contenedor.appendChild(columna);
    });
  } catch (error) {
    console.error("Error al cargar malla de proyección:", error);
    contenedor.innerHTML = "<p style='color:red;'>Error al cargar la malla de proyección.</p>";
  }
}

// =============================
// PROYECCIÓN MANUAL INTEGRADA EN MALLA
// =============================
async function mostrarMallaProyeccion(usuario, carrera) {
  const contenedor = document.getElementById("mallaProyeccionContainer");
  const botonManual = document.getElementById("btnManual");
  const botonAuto = document.getElementById("btnAuto");
  const limiteCreditos = 30;

  try {
    contenedor.innerHTML = "<p>Cargando malla curricular...</p>";

    // Obtener datos de malla y avance
    const urlMalla = `http://localhost:3000/api/malla?codigo=${carrera.codigo}&catalogo=${carrera.catalogo}`;
    const urlAvance = `https://puclaro.ucn.cl/eross/avance/avance.php?rut=${usuario.rut}&codcarrera=${carrera.codigo}`;
    const [respMalla, respAvance] = await Promise.all([fetch(urlMalla), fetch(urlAvance)]);

    const malla = await respMalla.json();
    const avance = await respAvance.json();

    if (!Array.isArray(malla) || !Array.isArray(avance)) {
      contenedor.innerHTML = "<p>No se encontraron datos.</p>";
      return;
    }

    // Normalizar códigos
    const normalizarCodigo = (codigo) =>
      codigo?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "") || "";

    // Determinar el semestre actual del usuario
    const ahora = new Date();
    const año = ahora.getFullYear();
    const semestre = ahora.getMonth() < 6 ? "10" : "20";
    const semestreActual = parseInt(`${año}${semestre}`);

    // Mapear ramos y estados
    const estadoRamos = {};
    avance.forEach((r) => {
      const cod = normalizarCodigo(r.course);
      const periodo = parseInt(r.period);
      let estado = "pendiente";
      if (r.status === "APROBADO") estado = "aprobado";
      else if (r.status === "REPROBADO") estado = "reprobado";
      else if (r.status === "INSCRITO" || r.status === "EN_CURSO") estado = "inscrito";

      if (!estadoRamos[cod] || periodo > estadoRamos[cod].periodo) {
        estadoRamos[cod] = { estado, periodo };
      }
    });

    // Determinar los pendientes y prerequisitos
    const obtenerEstado = (codigoMalla) => {
      const codNorm = normalizarCodigo(codigoMalla);
      if (estadoRamos[codNorm]) return estadoRamos[codNorm].estado;
      const similar = Object.keys(estadoRamos).find(
        (k) => k.includes(codNorm) || codNorm.includes(k)
      );
      return similar ? estadoRamos[similar].estado : "pendiente";
    };

    // Agrupar malla por nivel
    const niveles = {};
    malla.forEach((curso) => {
      if (!niveles[curso.nivel]) niveles[curso.nivel] = [];
      niveles[curso.nivel].push(curso);
    });

    // Renderizar malla
    contenedor.innerHTML = "";
    contenedor.classList.add("malla-proyeccion");

    // Contador y alerta
    const contador = document.createElement("p");
    contador.style.margin = "10px 0";
    contador.innerHTML = `<strong>Créditos seleccionados:</strong> 0 / ${limiteCreditos}`;
    contenedor.before(contador);

    // Estado interno de selección
    let creditosSeleccionados = 0;
    const seleccionados = new Set();

    const actualizarContador = () => {
      contador.innerHTML = `<strong>Créditos seleccionados:</strong> ${creditosSeleccionados} / ${limiteCreditos}`;
    };

    // Función para saber si un ramo está desbloqueado por prerequisitos
    const prereqCumplidos = (curso) => {
      if (!curso.prereq) return true;
      const prereqs = curso.prereq.split(",").map((p) => normalizarCodigo(p));
      return prereqs.every(
        (p) =>
          estadoRamos[p]?.estado === "aprobado" ||
          estadoRamos[p]?.estado === "inscrito"
      );
    };

    // Función para saber si está "atrasado"
    const esAtrasado = (curso) => {
      const cod = normalizarCodigo(curso.codigo);
      const estado = estadoRamos[cod];
      if (estado?.estado === "pendiente" && estado?.periodo) {
        return semestreActual - estado.periodo > 20; // diferencia de +2 semestres
      }
      return false;
    };

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
          const estado = obtenerEstado(curso.codigo);
          const desbloqueado = prereqCumplidos(curso);
          const atrasado = esAtrasado(curso);

          const div = document.createElement("div");
          div.classList.add("curso", estado);
          div.innerHTML = `
            <h4>${curso.asignatura}</h4>
            <p>${curso.codigo}</p>
            <small>${curso.creditos} créditos</small>
          `;

          // Pendiente (solo seleccionable si desbloqueado)
          if (estado === "pendiente") {
            div.style.cursor = desbloqueado ? "pointer" : "not-allowed";
            if (!desbloqueado) div.style.opacity = "0.5";

            // Click para seleccionar
            div.addEventListener("click", () => {
              if (!desbloqueado) return alert("Prerrequisitos no cumplidos.");
              if (seleccionados.has(curso.codigo)) {
                seleccionados.delete(curso.codigo);
                div.classList.remove("seleccionado");
                creditosSeleccionados -= curso.creditos;
              } else {
                if (creditosSeleccionados + curso.creditos > limiteCreditos) {
                  alert(`No puedes superar los ${limiteCreditos} créditos.`);
                  return;
                }
                seleccionados.add(curso.codigo);
                div.classList.add("seleccionado");
                creditosSeleccionados += curso.creditos;
              }
              actualizarContador();
            });
          }

          // Atrasados (obligatorios)
          if (atrasado) {
            div.classList.add("obligatorio");
            seleccionados.add(curso.codigo);
            creditosSeleccionados += curso.creditos;
          }

          grid.appendChild(div);
        });

        bloque.appendChild(grid);
        contenedor.appendChild(bloque);
      });

    actualizarContador();

    // Estilo visual
    const style = document.createElement("style");
    style.textContent = `
      .curso.seleccionado {
        outline: 3px solid #007bff;
        transform: scale(1.05);
      }
      .curso.obligatorio {
        border: 3px dashed #e67e22 !important;
        position: relative;
      }
      .curso.obligatorio::after {
        content: "📘 Obligatorio";
        position: absolute;
        bottom: 5px;
        font-size: 0.7rem;
        color: #e67e22;
      }
    `;
    document.head.appendChild(style);

    // Botón para guardar proyección
    botonManual.addEventListener("click", () => {
      const listaSeleccion = Array.from(seleccionados);
      if (listaSeleccion.length === 0) {
        alert("Selecciona al menos un ramo para proyectar.");
        return;
      }
      localStorage.setItem("proyeccionManual", JSON.stringify(listaSeleccion));
      alert("Proyección manual guardada correctamente.");
    });
  } catch (err) {
    console.error("Error al cargar proyección manual:", err);
    contenedor.innerHTML = `<p style="color:red;">Error al cargar malla curricular.</p>`;
  }
}
