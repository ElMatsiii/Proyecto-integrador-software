import { obtenerAvance, obtenerMalla } from "../services/apiService.js";
import { guardarProyeccion } from "../services/apiService.js";
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

  const accionesContainer = document.querySelector(".acciones");
  if (accionesContainer) {
    accionesContainer.style.display = "none";
  }

  await mostrarMallaProyeccion(auth, carrera, contenedor);

  btnAuto.addEventListener("click", () => {
    accionesContainer.style.display = "none";
    generarProyeccionAutomatica(auth, carrera, contenedor);
  });
}

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

async function mostrarMallaProyeccion(auth, carrera, contenedor) {
  try {
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

    const ahora = new Date();
    const año = ahora.getFullYear();
    const semestre = ahora.getMonth() < 6 ? "10" : "20";
    const semestreActual = parseInt(`${año}${semestre}`);

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

    const prereqCumplidos = (curso) => {
      if (!curso.prereq || curso.prereq.trim() === "") return true;
      const prereqs = curso.prereq.split(",").map((p) => normalizarCodigo(p));
      return prereqs.every(
        (p) =>
          estadoRamos[p]?.estado === "aprobado" ||
          estadoRamos[p]?.estado === "inscrito"
      );
    };

    const esAtrasado = (curso) => {
      const cod = normalizarCodigo(curso.codigo);
      const estado = estadoRamos[cod];
      if (estado?.estado === "pendiente" && estado?.periodo) {
        return semestreActual - estado.periodo > 20;
      }
      return false;
    };

    const niveles = {};
    malla.forEach((curso) => {
      if (!niveles[curso.nivel]) niveles[curso.nivel] = [];
      niveles[curso.nivel].push(curso);
    });

    contenedor.innerHTML = "";
    contenedor.classList.add("malla-proyeccion");

    let contadorExistente = document.getElementById("contadorCreditosProyeccion");
    if (contadorExistente) {
      contadorExistente.remove();
    }

    const contador = document.createElement("div");
    contador.id = "contadorCreditosProyeccion";
    contador.innerHTML = `<strong>Créditos seleccionados:</strong> <span id="creditosActuales">0</span> / ${LIMITE_CREDITOS}`;
    
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
                seleccionados.delete(curso.codigo);
                div.classList.remove("seleccionado-auto");
                creditosSeleccionados -= creditos;
              } else {
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

          if (atrasado && estado === "pendiente") {
            div.style.border = "3px dashed #e67e22";
            const badge = document.createElement("span");
            badge.textContent = "Atrasado";
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

    const btnGuardarProyeccion = document.createElement("button");
    btnGuardarProyeccion.id = "btnGuardarProyeccionManual";
    btnGuardarProyeccion.className = "boton-proyeccion-centrado";
    btnGuardarProyeccion.textContent = "Guardar Proyección Manual";
    btnGuardarProyeccion.addEventListener("click", () => guardarProyeccionManual(malla, seleccionados, carrera));
    
    contenedor.after(btnGuardarProyeccion);

    const btnProyeccionAuto = document.createElement("button");
    btnProyeccionAuto.id = "btnGenerarAutomatica";
    btnProyeccionAuto.className = "boton-proyeccion-centrado";
    btnProyeccionAuto.textContent = "Generar Proyección Automática";
    btnProyeccionAuto.addEventListener("click", () => {
      generarProyeccionAutomatica(auth, carrera, contenedor);
    });
    
    btnGuardarProyeccion.after(btnProyeccionAuto);

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

async function guardarProyeccionManual(malla, seleccionados, carrera) {
  const seleccionadosArray = Array.from(seleccionados);
  
  if (seleccionadosArray.length === 0) {
    alert("Selecciona al menos un ramo para guardar la proyección.");
    return;
  }

  const ramosSeleccionados = seleccionadosArray.map((codigo) => {
    const ramo = malla.find(r => r.codigo === codigo);
    return {
      codigo: codigo,
      nombre: obtenerNombreRamo(codigo, ramo?.asignatura),
      creditos: ramo?.creditos || 6,
      nivel: ramo?.nivel || 0
    };
  });

  const totalCreditos = ramosSeleccionados.reduce((sum, r) => sum + Number(r.creditos), 0);
  
  const nombreProyeccion = prompt("Ingresa un nombre para esta proyección:", `Proyección Manual - ${new Date().toLocaleDateString()}`);
  
  if (!nombreProyeccion) {
    alert("Debe ingresar un nombre para la proyección");
    return;
  }

  const proyeccionData = {
    codigo_carrera: carrera.codigo,
    tipo: "manual",
    nombre: nombreProyeccion,
    total_creditos: totalCreditos,
    total_ramos: ramosSeleccionados.length,
    semestres_proyectados: 1,
    fecha_egreso_estimada: null,
    datos_completos: {
      ramos: ramosSeleccionados,
      fecha_creacion: new Date().toISOString()
    }
  };

  try {
    const resultado = await guardarProyeccion(proyeccionData);
    alert(`${resultado.mensaje}\n\n ${ramosSeleccionados.length} ramos seleccionados\n${totalCreditos} créditos totales\n\nPuedes ver tus proyecciones guardadas en la sección "Versiones"`);
  } catch (error) {
    console.error("Error al guardar proyección:", error);
    alert("Error al guardar la proyección. Intenta nuevamente.");
  }
}

async function guardarProyeccionAutomatica(plan, carrera) {
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
        semestre: bloque.semestre,
        nivel: ramo.nivel
      });
    });
  });

  const totalCreditos = ramosSeleccionados.reduce((sum, r) => sum + Number(r.creditos), 0);
  
  const semestreInicio = plan[0]?.semestre || 0;
  const añoInicio = Math.floor(semestreInicio / 100);
  const tipoSemestre = semestreInicio % 100;
  const mesInicio = tipoSemestre === 10 ? 3 : 8;
  
  const mesesTotales = plan.length * 6;
  const fechaEgreso = new Date(añoInicio, mesInicio - 1);
  fechaEgreso.setMonth(fechaEgreso.getMonth() + mesesTotales);
  
  const opcionesFormato = { year: 'numeric', month: 'long' };
  const fechaEgresoTexto = fechaEgreso.toLocaleDateString('es-CL', opcionesFormato);
  
  const nombreProyeccion = prompt("Ingresa un nombre para esta proyección:", `Proyección Automática - ${new Date().toLocaleDateString()}`);
  
  if (!nombreProyeccion) {
    alert("Debe ingresar un nombre para la proyección");
    return;
  }

  const proyeccionData = {
    codigo_carrera: carrera.codigo,
    tipo: "automatica",
    nombre: nombreProyeccion,
    total_creditos: totalCreditos,
    total_ramos: ramosSeleccionados.length,
    semestres_proyectados: plan.length,
    fecha_egreso_estimada: fechaEgresoTexto,
    datos_completos: {
      plan: plan,
      ramos: ramosSeleccionados,
      fecha_creacion: new Date().toISOString()
    }
  };

  try {
    const resultado = await guardarProyeccion(proyeccionData);
    alert(`${resultado.mensaje}\n\n${ramosSeleccionados.length} ramos en ${plan.length} semestres\n${totalCreditos} créditos totales\nEgreso estimado: ${fechaEgresoTexto}\n\nPuedes ver tus proyecciones guardadas en la sección "Versiones"`);
  } catch (error) {
    console.error("Error al guardar proyección:", error);
    alert("Error al guardar la proyección. Intenta nuevamente.");
  }
}

async function generarProyeccionAutomatica(auth, carrera, contenedor) {
  try {
    limpiarBotones();

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

    const aprobados = new Set(
      avance.filter((r) => r.status === "APROBADO").map((r) => normalizarCodigo(r.course))
    );
    const inscritos = new Set(
      avance
        .filter((r) => ["INSCRITO", "EN_CURSO"].includes(r.status))
        .map((r) => normalizarCodigo(r.course))
    );
    const aprobadosSimulados = new Set([...aprobados, ...inscritos]);

    let pendientesRestantes = malla.filter(
      (r) => !aprobadosSimulados.has(normalizarCodigo(r.codigo))
    );

    const fecha = new Date();
    const año = fecha.getFullYear();
    const semestreActual = fecha.getMonth() < 6 ? 10 : 20;
    let semestreProyectado =
      semestreActual === 10 ? año * 100 + 20 : (año + 1) * 100 + 10;

    const cumplePrereq = (ramo) => {
      if (!ramo.prereq || ramo.prereq.trim() === "") return true;
      const prereqs = ramo.prereq.split(",").map((p) => normalizarCodigo(p));
      const prereqsValidos = prereqs.filter((p) =>
        malla.some((m) => normalizarCodigo(m.codigo) === p)
      );
      return prereqsValidos.every((p) => aprobadosSimulados.has(p));
    };

    const plan = [];

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

      semestreProyectado =
        semestreProyectado % 100 === 10
          ? semestreProyectado + 10
          : (Math.floor(semestreProyectado / 100) + 1) * 100 + 10;
    }

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

    const totalMalla = malla.reduce((s, r) => s + (Number(r.creditos) || 0), 0);
    const creditosAprobados = [...aprobadosSimulados].reduce((s, c) => {
      const ramo = malla.find((r) => normalizarCodigo(r.codigo) === c);
      return s + (ramo ? Number(ramo.creditos) : 0);
    }, 0);
    const avanceFinal = (creditosAprobados / totalMalla) * 100;
    const ramosTotales = plan.reduce((s, p) => s + p.ramos.length, 0);

    const resumenWrapper = document.createElement("div");
    resumenWrapper.classList.add("resumen-wrapper");

    const semestreInicio = plan[0]?.semestre || semestreProyectado;
    const añoInicio = Math.floor(semestreInicio / 100);
    const tipoSemestre = semestreInicio % 100;
    const mesInicio = tipoSemestre === 10 ? 3 : 8;
    
    const mesesTotales = plan.length * 6;
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

    const btnGuardarAuto = document.createElement("button");
    btnGuardarAuto.id = "btnGuardarProyeccionAutomatica";
    btnGuardarAuto.className = "boton-proyeccion-centrado";
    btnGuardarAuto.textContent = "Guardar Proyección Automática";
    btnGuardarAuto.addEventListener("click", () => guardarProyeccionAutomatica(plan, carrera));
    
    contenedor.after(btnGuardarAuto);

    const btnVolverManual = document.createElement("button");
    btnVolverManual.id = "btnVolverManual";
    btnVolverManual.className = "boton-proyeccion-centrado";
    btnVolverManual.textContent = "Volver a Proyección Manual";
    btnVolverManual.addEventListener("click", () => {
      mostrarMallaProyeccion(auth, carrera, contenedor);
    });
    
    btnGuardarAuto.after(btnVolverManual);

  } catch (err) {
    console.error("Error en proyección automática:", err);
    contenedor.innerHTML = "<p style='color:red;'>Error al generar proyección automática.</p>";
  }
}