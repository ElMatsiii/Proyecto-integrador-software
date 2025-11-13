import { obtenerAvance, obtenerMalla } from "../services/apiService.js";
import { storage } from "../services/storageService.js";
import { normalizarCodigo, mostrarError, obtenerNombreRamo } from "../services/utils.js";

export async function initProyeccion() {
  const main = document.querySelector("main");
  const auth = storage.requireAuth();
  const carrera = storage.getCarrera();
  const contenedor = document.getElementById("mallaProyeccionContainer");

  if (!auth || !carrera) {
    return (window.location.href = "index.html");
  }

  const btnManual = document.getElementById("btnIrManual");
  const btnAuto = document.getElementById("btnIrAutomatica");

  // Ocultar botones iniciales (se mostrarán según corresponda)
  const accionesContainer = document.querySelector(".acciones");
  if (accionesContainer) {
    accionesContainer.style.display = "none";
  }

  // Cargar malla inicial con colores de estado
  await mostrarMallaProyeccion(auth, carrera, contenedor);

  // Botón Automático: Genera nueva proyección
  btnAuto.addEventListener("click", () => {
    accionesContainer.style.display = "none";
    generarProyeccionAutomatica(auth, carrera, contenedor);
  });
}

// === LIMPIAR BOTONES PREVIOS ===
function limpiarBotones() {
  const botonesAEliminar = [
    "btnGuardarProyeccionManual",
    "btnGenerarAutomatica",
    "btnVolverManual",
    "btnGuardarProyeccionAutomatica"
  ];
  
  botonesAEliminar.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.remove();
  });
}

// === MOSTRAR MALLA CON ESTADOS Y MODO MANUAL (inicial) ===
async function mostrarMallaProyeccion(auth, carrera, contenedor) {
  try {
    // Limpiar todos los botones previos
    limpiarBotones();
    
    contenedor.innerHTML = "<p>Cargando malla curricular...</p>";

    const [avance, malla] = await Promise.all([
      obtenerAvance(auth.rut, carrera.codigo),
      obtenerMalla(carrera.codigo, carrera.catalogo),
    ]);

    if (!Array.isArray(malla) || !Array.isArray(avance)) {
      contenedor.innerHTML = "<p>No se encontraron datos.</p>";
      return;
    }

    const LIMITE_CREDITOS = 30;

    // Obtener fecha actual y calcular semestre actual
    const ahora = new Date();
    const año = ahora.getFullYear();
    const semestre = ahora.getMonth() < 6 ? "10" : "20";
    const semestreActual = parseInt(`${año}${semestre}`);

    // Clasificar estados de los ramos
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

    const obtenerEstado = (codigoMalla) => {
      const codNorm = normalizarCodigo(codigoMalla);
      if (estadoRamos[codNorm]) return estadoRamos[codNorm].estado;
      const similar = Object.keys(estadoRamos).find(
        (k) => k.includes(codNorm) || codNorm.includes(k)
      );
      return similar ? estadoRamos[similar].estado : "pendiente";
    };

    // Función para verificar prerrequisitos
    const prereqCumplidos = (curso) => {
      if (!curso.prereq || curso.prereq.trim() === "") return true;
      const prereqs = curso.prereq.split(",").map((p) => normalizarCodigo(p));
      return prereqs.every(
        (p) =>
          estadoRamos[p]?.estado === "aprobado" ||
          estadoRamos[p]?.estado === "inscrito"
      );
    };

    // Detectar ramos atrasados
    const esAtrasado = (curso) => {
      const cod = normalizarCodigo(curso.codigo);
      const estado = estadoRamos[cod];
      if (estado?.estado === "pendiente" && estado?.periodo) {
        return semestreActual - estado.periodo > 20;
      }
      return false;
    };

    // Agrupar por nivel
    const niveles = {};
    malla.forEach((curso) => {
      if (!niveles[curso.nivel]) niveles[curso.nivel] = [];
      niveles[curso.nivel].push(curso);
    });

    contenedor.innerHTML = "";
    contenedor.classList.add("malla-proyeccion");

    // ✅ ELIMINAR CONTADOR PREVIO Y CREAR UNO NUEVO ESTÁTICO
    let contadorExistente = document.getElementById("contadorCreditosProyeccion");
    if (contadorExistente) {
      contadorExistente.remove();
    }

    // Crear nuevo contador
    const contador = document.createElement("div");
    contador.id = "contadorCreditosProyeccion";
    contador.innerHTML = `<strong>Créditos seleccionados:</strong> <span id="creditosActuales">0</span> / ${LIMITE_CREDITOS}`;
    
    // Insertar al inicio del contenedor
    contenedor.insertAdjacentElement("beforebegin", contador);

    let creditosSeleccionados = 0;
    const seleccionados = new Set();

    const actualizarContador = () => {
      document.getElementById("creditosActuales").textContent = creditosSeleccionados;
      const contadorEl = document.getElementById("contadorCreditosProyeccion");
      if (creditosSeleccionados > LIMITE_CREDITOS) {
        contadorEl.style.background = "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)";
      } else if (creditosSeleccionados === LIMITE_CREDITOS) {
        contadorEl.style.background = "linear-gradient(135deg, #f39c12 0%, #e67e22 100%)";
      } else {
        contadorEl.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
      }
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
          const nombre = obtenerNombreRamo(curso.codigo, curso.asignatura);

          const div = document.createElement("div");
          div.classList.add("curso", estado);
          div.dataset.codigo = curso.codigo;
          div.dataset.creditos = curso.creditos;
          div.innerHTML = `
            <h4>${nombre}</h4>
            <p>${curso.codigo}</p>
            <small>${curso.creditos} créditos</small>
          `;

          // Solo ramos pendientes son seleccionables
          if (estado === "pendiente") {
            div.style.cursor = desbloqueado ? "pointer" : "not-allowed";
            if (!desbloqueado) {
              div.style.opacity = "0.5";
              div.title = "Prerrequisitos no cumplidos";
            }

            div.addEventListener("click", () => {
              if (!desbloqueado) {
                alert("Este ramo tiene prerrequisitos no cumplidos.");
                return;
              }

              const creditos = Number(curso.creditos) || 6;

              if (seleccionados.has(curso.codigo)) {
                // Deseleccionar
                seleccionados.delete(curso.codigo);
                div.classList.remove("seleccionado-auto");
                creditosSeleccionados -= creditos;
              } else {
                // Seleccionar
                if (creditosSeleccionados + creditos > LIMITE_CREDITOS) {
                  alert(`No puedes superar los ${LIMITE_CREDITOS} créditos.`);
                  return;
                }
                seleccionados.add(curso.codigo);
                div.classList.add("seleccionado-auto");
                creditosSeleccionados += creditos;
              }

              actualizarContador();
            });
          }

          // Marcar ramos atrasados
          if (atrasado && estado === "pendiente") {
            div.style.border = "3px dashed #e67e22";
            const badge = document.createElement("span");
            badge.textContent = "⚠️ Atrasado";
            badge.style.cssText = `
              position: absolute;
              top: 5px;
              right: 5px;
              background: #e67e22;
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 0.7rem;
            `;
            div.style.position = "relative";
            div.appendChild(badge);
          }

          grid.appendChild(div);
        });

        bloque.appendChild(grid);
        contenedor.appendChild(bloque);
      });

    actualizarContador();

    // Agregar estilos para selección (solo una vez)
    if (!document.getElementById("proyeccion-styles")) {
      const style = document.createElement("style");
      style.id = "proyeccion-styles";
      style.textContent = `
        .curso.seleccionado-auto {
          outline: 3px solid #007bff !important;
          transform: scale(1.05);
          box-shadow: 0 0 15px rgba(0, 123, 255, 0.5) !important;
        }
        
        .boton-proyeccion-centrado {
          display: block;
          margin: 30px auto;
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }
        
        .boton-proyeccion-centrado:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
        }
      `;
      document.head.appendChild(style);
    }

    // ✅ CREAR BOTÓN DE GUARDAR PROYECCIÓN DEBAJO DE LA MALLA
    const btnGuardarProyeccion = document.createElement("button");
    btnGuardarProyeccion.id = "btnGuardarProyeccionManual";
    btnGuardarProyeccion.className = "boton-proyeccion-centrado";
    btnGuardarProyeccion.textContent = "Guardar Proyección Manual";
    btnGuardarProyeccion.addEventListener("click", () => guardarProyeccionManual());
    
    contenedor.after(btnGuardarProyeccion);

    // ✅ CREAR BOTÓN DE PROYECCIÓN AUTOMÁTICA DEBAJO DEL BOTÓN DE GUARDAR
    const btnProyeccionAuto = document.createElement("button");
    btnProyeccionAuto.id = "btnGenerarAutomatica";
    btnProyeccionAuto.className = "boton-proyeccion-centrado";
    btnProyeccionAuto.textContent = "Generar Proyección Automática";
    btnProyeccionAuto.addEventListener("click", () => {
      generarProyeccionAutomatica(auth, carrera, contenedor);
    });
    
    btnGuardarProyeccion.after(btnProyeccionAuto);

    // Mensaje final (solo si no existe)
    let mensajeFinal = document.getElementById("mensajeProyeccionManual");
    if (mensajeFinal) {
      mensajeFinal.remove();
    }

    mensajeFinal = document.createElement("p");
    mensajeFinal.id = "mensajeProyeccionManual";
    mensajeFinal.style.cssText = `
      text-align: center;
      margin-top: 20px;
      font-size: 1.1rem;
      color: #555;
    `;
    mensajeFinal.innerHTML = `
      Haz clic en los ramos pendientes para seleccionarlos.<br>
      <small>Los ramos con prerrequisitos no cumplidos aparecen deshabilitados.</small>
    `;
    contador.after(mensajeFinal);

  } catch (err) {
    console.error("Error al cargar malla de proyección:", err);
    contenedor.innerHTML = `<p style="color:red;">Error al cargar malla curricular.</p>`;
  }
}

// === GUARDAR PROYECCIÓN MANUAL ===
function guardarProyeccionManual() {
  const seleccionados = Array.from(document.querySelectorAll(".curso.seleccionado-auto")).map(
    (el) => ({
      codigo: el.querySelector("p").textContent,
      nombre: el.querySelector("h4").textContent,
      creditos: el.dataset.creditos || "6"
    })
  );

  if (seleccionados.length === 0) {
    alert("Selecciona al menos un ramo para guardar la proyección.");
    return;
  }

  const proyeccion = {
    fecha: new Date().toISOString(),
    tipo: "manual",
    ramos: seleccionados,
    totalCreditos: seleccionados.reduce((sum, r) => sum + Number(r.creditos), 0)
  };

  localStorage.setItem("proyeccionManual", JSON.stringify(proyeccion));
  alert(`✅ Proyección manual guardada correctamente\n\n📚 ${seleccionados.length} ramos seleccionados\n📊 ${proyeccion.totalCreditos} créditos totales`);
}

// === GUARDAR PROYECCIÓN AUTOMÁTICA ===
function guardarProyeccionAutomatica(plan) {
  if (!plan || plan.length === 0) {
    alert("No hay proyección para guardar.");
    return;
  }

  const ramosSeleccionados = [];
  plan.forEach(bloque => {
    bloque.ramos.forEach(ramo => {
      ramosSeleccionados.push({
        codigo: ramo.codigo,
        nombre: obtenerNombreRamo(ramo.codigo, ramo.asignatura),
        creditos: ramo.creditos || 6,
        semestre: bloque.semestre
      });
    });
  });

  const proyeccion = {
    fecha: new Date().toISOString(),
    tipo: "automatica",
    ramos: ramosSeleccionados,
    totalCreditos: ramosSeleccionados.reduce((sum, r) => sum + Number(r.creditos), 0),
    semestres: plan.length
  };

  localStorage.setItem("proyeccionAutomatica", JSON.stringify(proyeccion));
  alert(`✅ Proyección automática guardada correctamente\n\n📚 ${ramosSeleccionados.length} ramos en ${plan.length} semestres\n📊 ${proyeccion.totalCreditos} créditos totales`);
}

// === PROYECCIÓN AUTOMÁTICA ===
async function generarProyeccionAutomatica(auth, carrera, contenedor) {
  try {
    // Limpiar todos los botones previos
    limpiarBotones();
    
    // Eliminar contador y mensaje de la vista manual
    const contador = document.getElementById("contadorCreditosProyeccion");
    const mensaje = document.getElementById("mensajeProyeccionManual");
    
    if (contador) contador.remove();
    if (mensaje) mensaje.remove();

    contenedor.innerHTML = "<p>Generando proyección automática...</p>";

    const [avance, malla] = await Promise.all([
      obtenerAvance(auth.rut, carrera.codigo),
      obtenerMalla(carrera.codigo, carrera.catalogo),
    ]);

    if (!Array.isArray(avance) || !Array.isArray(malla)) {
      contenedor.innerHTML = "<p>Error al cargar datos.</p>";
      return;
    }

    const MAX_CREDITOS = 30;

    // Clasificar estados
    const aprobados = new Set(
      avance.filter((r) => r.status === "APROBADO").map((r) => normalizarCodigo(r.course))
    );
    const inscritos = new Set(
      avance
        .filter((r) => ["INSCRITO", "EN_CURSO"].includes(r.status))
        .map((r) => normalizarCodigo(r.course))
    );
    const aprobadosSimulados = new Set([...aprobados, ...inscritos]);

    // Pendientes iniciales
    let pendientesRestantes = malla.filter(
      (r) => !aprobadosSimulados.has(normalizarCodigo(r.codigo))
    );

    // Calcular semestre de inicio
    const fecha = new Date();
    const año = fecha.getFullYear();
    const semestreActual = fecha.getMonth() < 6 ? 10 : 20;
    let semestreProyectado =
      semestreActual === 10 ? año * 100 + 20 : (año + 1) * 100 + 10;

    // Validación de prerrequisitos
    const cumplePrereq = (ramo) => {
      if (!ramo.prereq || ramo.prereq.trim() === "") return true;
      const prereqs = ramo.prereq.split(",").map((p) => normalizarCodigo(p));
      const prereqsValidos = prereqs.filter((p) =>
        malla.some((m) => normalizarCodigo(m.codigo) === p)
      );
      return prereqsValidos.every((p) => aprobadosSimulados.has(p));
    };

    const plan = [];

    // Generar semestres
    while (pendientesRestantes.length > 0) {
      let semestre = [];
      let creditosUsados = 0;
      let desbloqueados = pendientesRestantes.filter(cumplePrereq);
      let progreso = true;

      while (progreso && creditosUsados < MAX_CREDITOS && desbloqueados.length > 0) {
        progreso = false;
        for (const ramo of [...desbloqueados]) {
          const c = Number(ramo.creditos) || 6;
          const codigo = normalizarCodigo(ramo.codigo);
          if (!aprobadosSimulados.has(codigo) && creditosUsados + c <= MAX_CREDITOS) {
            semestre.push(ramo);
            creditosUsados += c;
            aprobadosSimulados.add(codigo);
            pendientesRestantes = pendientesRestantes.filter(
              (r) => normalizarCodigo(r.codigo) !== codigo
            );
            progreso = true;
          }
        }
        desbloqueados = pendientesRestantes.filter(cumplePrereq);
      }

      if (semestre.length === 0) {
        console.warn("No se pudieron desbloquear más ramos.");
        break;
      }

      plan.push({ semestre: semestreProyectado, ramos: semestre, creditos: creditosUsados });

      // Avanzar semestre
      semestreProyectado =
        semestreProyectado % 100 === 10
          ? semestreProyectado + 10
          : (Math.floor(semestreProyectado / 100) + 1) * 100 + 10;
    }

    // Renderizar
    contenedor.innerHTML = "";
    const mallaDiv = document.createElement("div");
    mallaDiv.classList.add("malla-proyeccion");

    plan.forEach((bloque) => {
      const bloqueDiv = document.createElement("div");
      bloqueDiv.classList.add("bloque-nivel");
      bloqueDiv.innerHTML = `
        <h3>Semestre ${bloque.semestre}</h3>
        <p style="font-size:0.9rem; color:#666;">${bloque.creditos} créditos</p>
      `;
      const grid = document.createElement("div");
      grid.classList.add("malla-grid");

      bloque.ramos.forEach((r) => {
        const nombre = obtenerNombreRamo(r.codigo, r.asignatura);
        const div = document.createElement("div");
        div.classList.add("curso", "seleccionado-auto");
        div.innerHTML = `
          <h4>${nombre}</h4>
          <p>${r.codigo}</p>
          <p>${r.creditos || 6} créditos</p>
        `;
        grid.appendChild(div);
      });

      bloqueDiv.appendChild(grid);
      mallaDiv.appendChild(bloqueDiv);
    });

    // Resumen lateral
    const totalMalla = malla.reduce((s, r) => s + (Number(r.creditos) || 0), 0);
    const creditosAprobados = [...aprobadosSimulados].reduce((s, c) => {
      const ramo = malla.find((r) => normalizarCodigo(r.codigo) === c);
      return s + (ramo ? Number(ramo.creditos) : 0);
    }, 0);
    const avanceFinal = (creditosAprobados / totalMalla) * 100;
    const ramosTotales = plan.reduce((s, p) => s + p.ramos.length, 0);

    const resumenWrapper = document.createElement("div");
    resumenWrapper.classList.add("resumen-wrapper");

    // Calcular fecha de egreso estimada
    const semestreInicio = plan[0]?.semestre || semestreProyectado;
    const añoInicio = Math.floor(semestreInicio / 100);
    const tipoSemestre = semestreInicio % 100;
    const mesInicio = tipoSemestre === 10 ? 3 : 8; // Marzo o Agosto
    
    const mesesTotales = plan.length * 6; // 6 meses por semestre
    const fechaEgreso = new Date(añoInicio, mesInicio - 1);
    fechaEgreso.setMonth(fechaEgreso.getMonth() + mesesTotales);
    
    const opcionesFormato = { year: 'numeric', month: 'long' };
    const fechaEgresoTexto = fechaEgreso.toLocaleDateString('es-CL', opcionesFormato);

    const resumenFinal = document.createElement("div");
    resumenFinal.classList.add("resumen-lateral");
    resumenFinal.innerHTML = `
      <div class="resumen-header-lateral">
        <h3>Resumen de Proyección Automática</h3>
      </div>
      <div class="resumen-body-lateral">
        <p><strong>Semestres proyectados:</strong> <span>${plan.length} semestres</span></p>
        <p><strong>Proyección inicia en:</strong> <span>${plan[0]?.semestre || "—"}</span></p>
        <p><strong>Fecha estimada de egreso:</strong> <span>${fechaEgresoTexto}</span></p>
        <p><strong>Ramos pendientes:</strong> <span>${ramosTotales} ramos</span></p>
        <p><strong>Créditos totales:</strong> <span>${plan.reduce((s, p) => s + p.creditos, 0)} créditos</span></p>
        <p style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 20px;">
          <strong>Avance al completar:</strong> <span>${avanceFinal.toFixed(1)}%</span>
        </p>
        <div class="barra-progreso-lateral">
          <div class="progreso-lateral" style="width:${avanceFinal.toFixed(1)}%">${avanceFinal.toFixed(1)}%</div>
        </div>
      </div>
    `;
    resumenWrapper.appendChild(resumenFinal);

    const layoutContainer = document.createElement("div");
    layoutContainer.classList.add("proyeccion-layout");
    layoutContainer.appendChild(mallaDiv);
    layoutContainer.appendChild(resumenWrapper);
    contenedor.appendChild(layoutContainer);

    // ✅ CREAR BOTÓN PARA GUARDAR PROYECCIÓN AUTOMÁTICA
    const btnGuardarAuto = document.createElement("button");
    btnGuardarAuto.id = "btnGuardarProyeccionAutomatica";
    btnGuardarAuto.className = "boton-proyeccion-centrado";
    btnGuardarAuto.textContent = "Guardar Proyección Automática";
    btnGuardarAuto.addEventListener("click", () => guardarProyeccionAutomatica(plan));
    
    contenedor.after(btnGuardarAuto);

    // ✅ CREAR BOTÓN PARA VOLVER A PROYECCIÓN MANUAL
    const btnVolverManual = document.createElement("button");
    btnVolverManual.id = "btnVolverManual";
    btnVolverManual.className = "boton-proyeccion-centrado";
    btnVolverManual.textContent = "Volver a Proyección Manual";
    btnVolverManual.addEventListener("click", () => {
      // Recargar la vista manual
      mostrarMallaProyeccion(auth, carrera, contenedor);
    });
    
    btnGuardarAuto.after(btnVolverManual);

  } catch (err) {
    console.error("Error en proyección automática:", err);
    contenedor.innerHTML = "<p style='color:red;'>Error al generar proyección automática.</p>";
  }
}