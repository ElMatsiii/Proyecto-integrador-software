import { obtenerAvance, obtenerMalla, guardarProyeccion } from "../services/apiService.js";
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
  
  if (btnManual) {
    btnManual.addEventListener("click", async () => {
      if (accionesContainer) accionesContainer.style.display = "none";
      await mostrarMallaProyeccionManual(auth, carrera, contenedor);
    });
  }

  if (btnAuto) {
    btnAuto.addEventListener("click", async () => {
      if (accionesContainer) accionesContainer.style.display = "none";
      await generarProyeccionAutomatica(auth, carrera, contenedor);
    });
  }
}

function limpiarElementosAnteriores() {
  const selectores = [
    "#contadorCreditosProyeccion",
    ".header-semestre-actual",
    ".botones-navegacion-semestre",
    ".resumen-progreso-semestre"
  ];
  
  selectores.forEach(selector => {
    const elementos = document.querySelectorAll(selector);
    elementos.forEach(el => el.remove());
  });
}

async function mostrarMallaProyeccionManual(auth, carrera, contenedor) {
  try {
    limpiarElementosAnteriores();
    
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

    const ramosPendientes = malla.filter(
      (r) => obtenerEstado(r.codigo) === "pendiente"
    );

    const estadoProyeccion = {
      semestreActual: calcularSiguienteSemestre(semestreActual),
      semestreIndex: 0,
      semestresProyectados: [],
      aprobadosSimulados: new Set([
        ...Object.keys(estadoRamos).filter(k => 
          estadoRamos[k].estado === "aprobado" || estadoRamos[k].estado === "inscrito"
        )
      ]),
      ramosPendientes: [...ramosPendientes],
      todosLosRamos: [...malla]
    };

    mostrarSemestreManual(estadoProyeccion, contenedor, LIMITE_CREDITOS, carrera);

  } catch (err) {
    console.error("Error al cargar malla de proyección:", err);
    contenedor.innerHTML = `<p style="color:red;">Error al cargar malla curricular.</p>`;
  }
}

function mostrarSemestreManual(estadoProyeccion, contenedor, LIMITE_CREDITOS, carrera) {
  const { semestreActual, semestreIndex, semestresProyectados, aprobadosSimulados, todosLosRamos } = estadoProyeccion;

  limpiarElementosAnteriores();

  const cumplePrereq = (curso) => {
    if (!curso.prereq || curso.prereq.trim() === "") return true;
    const prereqs = curso.prereq.split(",").map((p) => normalizarCodigo(p));
    return prereqs.every(p => aprobadosSimulados.has(p));
  };

  const ramosDisponibles = todosLosRamos.filter(r => {
    const cod = normalizarCodigo(r.codigo);
    return !aprobadosSimulados.has(cod);
  });

  const niveles = {};
  ramosDisponibles.forEach((curso) => {
    if (!niveles[curso.nivel]) niveles[curso.nivel] = [];
    niveles[curso.nivel].push(curso);
  });

  contenedor.innerHTML = "";
  contenedor.classList.add("malla-proyeccion");

  const infoSemestre = document.createElement("div");
  infoSemestre.className = "header-semestre-actual";
  infoSemestre.style.cssText = `
    background: linear-gradient(135deg, #1a5569 0%, #2a7a94 100%);
    color: white;
    padding: 25px 30px;
    border-radius: 15px;
    margin: 0 0 30px 0;
    box-shadow: 0 4px 15px rgba(26, 85, 105, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
  `;
  infoSemestre.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
      <div style="flex: 1; min-width: 250px;">
        <h3 style="margin: 0 0 8px 0; font-size: 1.5rem; font-weight: 600;">
          ${formatearSemestre(semestreActual)}
        </h3>
        <p style="margin: 0; font-size: 0.95rem; opacity: 0.9;">
          Selecciona los ramos para este periodo (máx. ${LIMITE_CREDITOS} créditos)
        </p>
      </div>
      <div style="text-align: right;">
        <div style="background: rgba(255, 255, 255, 0.15); padding: 12px 20px; border-radius: 10px; backdrop-filter: blur(10px);">
          <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 4px;">Periodo</div>
          <div style="font-size: 1.3rem; font-weight: 700;">#${semestreIndex + 1}</div>
        </div>
      </div>
    </div>
  `;
  contenedor.before(infoSemestre);

  const contador = document.createElement("div");
  contador.id = "contadorCreditosProyeccion";
  contador.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 12px;
    margin: 0 0 25px 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    border-left: 5px solid #1a5569;
  `;
  contador.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #1a5569, #2a7a94); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
        </div>
        <div>
          <div style="font-size: 0.85rem; color: #666; margin-bottom: 2px;">Créditos seleccionados</div>
          <div style="font-size: 1.5rem; font-weight: 700; color: #1a5569;">
            <span id="creditosActuales">0</span> <span style="font-size: 1rem; font-weight: 400; color: #999;">/ ${LIMITE_CREDITOS}</span>
          </div>
        </div>
      </div>
      <div style="flex: 1; min-width: 200px; max-width: 400px;">
        <div style="background: #f0f0f0; height: 20px; border-radius: 10px; overflow: hidden;">
          <div id="barraProgreso" style="width: 0%; height: 100%; background: linear-gradient(90deg, #1a5569, #2a7a94); transition: all 0.3s ease; border-radius: 10px;"></div>
        </div>
      </div>
    </div>
  `;
  infoSemestre.after(contador);

  let creditosSeleccionados = 0;
  const seleccionados = new Set();

  const actualizarContador = () => {
    const porcentaje = (creditosSeleccionados / LIMITE_CREDITOS) * 100;
    document.getElementById("creditosActuales").textContent = creditosSeleccionados;
    
    const barra = document.getElementById("barraProgreso");
    if (barra) {
      barra.style.width = `${Math.min(porcentaje, 100)}%`;
      
      if (creditosSeleccionados > LIMITE_CREDITOS) {
        barra.style.background = "linear-gradient(90deg, #e74c3c, #c0392b)";
        document.getElementById("creditosActuales").style.color = "#e74c3c";
      } else if (creditosSeleccionados === LIMITE_CREDITOS) {
        barra.style.background = "linear-gradient(90deg, #f39c12, #e67e22)";
        document.getElementById("creditosActuales").style.color = "#f39c12";
      } else {
        barra.style.background = "linear-gradient(90deg, #1a5569, #2a7a94)";
        document.getElementById("creditosActuales").style.color = "#1a5569";
      }
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
        const desbloqueado = cumplePrereq(curso);
        const nombre = obtenerNombreRamo(curso.codigo, curso.asignatura);

        const div = document.createElement("div");
        div.classList.add("curso", "pendiente");
        div.dataset.codigo = curso.codigo;
        div.dataset.creditos = curso.creditos;
        div.style.cursor = desbloqueado ? "pointer" : "not-allowed";
        
        if (!desbloqueado) {
          div.style.opacity = "0.5";
          div.title = "Prerrequisitos no cumplidos";
        }

        div.innerHTML = `
          <h4>${nombre}</h4>
          <p>${curso.codigo}</p>
          <small>${curso.creditos} créditos</small>
        `;

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

        grid.appendChild(div);
      });

      bloque.appendChild(grid);
      contenedor.appendChild(bloque);
    });

  actualizarContador();

  const botonesContainer = document.createElement("div");
  botonesContainer.className = "botones-navegacion-semestre";
  botonesContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 30px 0;
  `;

  if (semestreIndex > 0) {
    const btnVolver = document.createElement("button");
    btnVolver.style.cssText = `
      background: white;
      color: #333;
      border: 2px solid #ddd;
      border-radius: 10px;
      padding: 15px 25px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    `;
    btnVolver.innerHTML = `<span>Semestre Anterior</span>`;
    btnVolver.onmouseover = () => {
      btnVolver.style.background = "#f8f9fa";
      btnVolver.style.borderColor = "#95a5a6";
      btnVolver.style.transform = "translateY(-2px)";
      btnVolver.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    };
    btnVolver.onmouseout = () => {
      btnVolver.style.background = "white";
      btnVolver.style.borderColor = "#ddd";
      btnVolver.style.transform = "translateY(0)";
      btnVolver.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
    };
    btnVolver.addEventListener("click", () => {
      const semestreAnterior = semestresProyectados.pop();
      estadoProyeccion.semestreIndex--;
      estadoProyeccion.semestreActual = calcularSemestreAnterior(estadoProyeccion.semestreActual);
      
      semestreAnterior.ramos.forEach(r => {
        aprobadosSimulados.delete(normalizarCodigo(r.codigo));
      });
      
      mostrarSemestreManual(estadoProyeccion, contenedor, LIMITE_CREDITOS, carrera);
    });
    botonesContainer.appendChild(btnVolver);
  }

  const btnSiguiente = document.createElement("button");
  btnSiguiente.style.cssText = `
    background: linear-gradient(135deg, #1a5569 0%, #2a7a94 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 15px 25px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(26, 85, 105, 0.3);
  `;
  btnSiguiente.innerHTML = `<span>Siguiente Semestre</span>`;
  btnSiguiente.onmouseover = () => {
    btnSiguiente.style.transform = "translateY(-2px)";
    btnSiguiente.style.boxShadow = "0 6px 16px rgba(26, 85, 105, 0.4)";
  };
  btnSiguiente.onmouseout = () => {
    btnSiguiente.style.transform = "translateY(0)";
    btnSiguiente.style.boxShadow = "0 4px 12px rgba(26, 85, 105, 0.3)";
  };
  btnSiguiente.addEventListener("click", () => {
    if (seleccionados.size === 0) {
      alert("Debes seleccionar al menos un ramo para continuar.");
      return;
    }

    const ramosSeleccionados = Array.from(seleccionados).map(codigo => {
      const ramo = todosLosRamos.find(r => r.codigo === codigo);
      return {
        codigo: codigo,
        nombre: obtenerNombreRamo(codigo, ramo?.asignatura),
        creditos: ramo?.creditos || 6,
        nivel: ramo?.nivel || 0
      };
    });

    semestresProyectados.push({
      semestre: semestreActual,
      ramos: ramosSeleccionados,
      creditos: creditosSeleccionados
    });

    seleccionados.forEach(cod => aprobadosSimulados.add(normalizarCodigo(cod)));

    estadoProyeccion.semestreIndex++;
    estadoProyeccion.semestreActual = calcularSiguienteSemestre(semestreActual);

    const ramosPendientesRestantes = todosLosRamos.filter(r => 
      !aprobadosSimulados.has(normalizarCodigo(r.codigo))
    );

    if (ramosPendientesRestantes.length === 0) {
      mostrarResumenFinalManual(semestresProyectados, contenedor, carrera);
    } else {
      mostrarSemestreManual(estadoProyeccion, contenedor, LIMITE_CREDITOS, carrera);
    }
  });
  botonesContainer.appendChild(btnSiguiente);

  const btnFinalizar = document.createElement("button");
  btnFinalizar.style.cssText = `
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
    color: white;
    border: none;
    border-radius: 10px;
    padding: 15px 25px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
  `;
  btnFinalizar.innerHTML = `<span>Finalizar y Guardar</span>`;
  btnFinalizar.onmouseover = () => {
    btnFinalizar.style.transform = "translateY(-2px)";
    btnFinalizar.style.boxShadow = "0 6px 16px rgba(39, 174, 96, 0.4)";
  };
  btnFinalizar.onmouseout = () => {
    btnFinalizar.style.transform = "translateY(0)";
    btnFinalizar.style.boxShadow = "0 4px 12px rgba(39, 174, 96, 0.3)";
  };
  btnFinalizar.addEventListener("click", () => {
    if (seleccionados.size === 0 && semestresProyectados.length === 0) {
      alert("Debes seleccionar al menos un ramo para guardar la proyección.");
      return;
    }

    if (seleccionados.size > 0) {
      const ramosSeleccionados = Array.from(seleccionados).map(codigo => {
        const ramo = todosLosRamos.find(r => r.codigo === codigo);
        return {
          codigo: codigo,
          nombre: obtenerNombreRamo(codigo, ramo?.asignatura),
          creditos: ramo?.creditos || 6,
          nivel: ramo?.nivel || 0
        };
      });

      semestresProyectados.push({
        semestre: semestreActual,
        ramos: ramosSeleccionados,
        creditos: creditosSeleccionados
      });
    }

    mostrarResumenFinalManual(semestresProyectados, contenedor, carrera);
  });
  botonesContainer.appendChild(btnFinalizar);

  contenedor.after(botonesContainer);

  const resumenProgreso = document.createElement("div");
  resumenProgreso.className = "resumen-progreso-semestre";
  resumenProgreso.style.cssText = `
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    padding: 20px;
    border-radius: 12px;
    margin-top: 20px;
    border-left: 5px solid #1a5569;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  `;
  resumenProgreso.innerHTML = `
    <div style="display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 20px; text-align: center;">
      <div>
        <div style="font-size: 1.5rem; font-weight: 700; color: #1a5569;">${semestresProyectados.length}</div>
        <div style="font-size: 0.85rem; color: #666;">Semestres completados</div>
      </div>
      <div style="width: 2px; height: 50px; background: #ddd;"></div>
      <div>
        <div style="font-size: 1.5rem; font-weight: 700; color: #1a5569;">${ramosDisponibles.length}</div>
        <div style="font-size: 0.85rem; color: #666;">Ramos pendientes</div>
      </div>
      <div style="width: 2px; height: 50px; background: #ddd;"></div>
      <div>
        <div style="font-size: 1.5rem; font-weight: 700; color: #1a5569;">${Math.round((semestresProyectados.length / (semestresProyectados.length + Math.ceil(ramosDisponibles.length / 5))) * 100)}%</div>
        <div style="font-size: 0.85rem; color: #666;">Progreso estimado</div>
      </div>
    </div>
  `;
  botonesContainer.after(resumenProgreso);
}

function mostrarResumenFinalManual(plan, contenedor, carrera) {
  limpiarElementosAnteriores();

  const headerResumen = document.createElement("div");
  headerResumen.className = "header-semestre-actual";
  headerResumen.style.cssText = `
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
    color: white;
    padding: 30px;
    border-radius: 15px;
    margin: 0 0 30px 0;
    text-align: center;
    box-shadow: 0 4px 20px rgba(39, 174, 96, 0.3);
  `;
  headerResumen.innerHTML = `
    <h2 style="margin: 0 0 10px 0; font-size: 2rem;">Proyección Completada</h2>
    <p style="margin: 0; font-size: 1.1rem; opacity: 0.95;">
      Revisa tu plan de estudios y guárdalo cuando estés listo
    </p>
  `;
  contenedor.before(headerResumen);

  contenedor.innerHTML = "";
  const mallaDiv = document.createElement("div");
  mallaDiv.classList.add("malla-proyeccion");

  plan.forEach((bloque, index) => {
    const bloqueDiv = document.createElement("div");
    bloqueDiv.classList.add("bloque-nivel");
    bloqueDiv.innerHTML = `
      <h3>Semestre ${index + 1}: ${formatearSemestre(bloque.semestre)}</h3>
      <p style="font-size:0.9rem; color:#666;">${bloque.creditos} créditos | ${bloque.ramos.length} ramos</p>
    `;
    const grid = document.createElement("div");
    grid.classList.add("malla-grid");

    bloque.ramos.forEach((r) => {
      const div = document.createElement("div");
      div.classList.add("curso", "seleccionado-auto");
      div.innerHTML = `
        <h4>${r.nombre}</h4>
        <p>${r.codigo}</p>
        <p>${r.creditos} créditos</p>
      `;
      grid.appendChild(div);
    });

    bloqueDiv.appendChild(grid);
    mallaDiv.appendChild(bloqueDiv);
  });

  const ramosTotales = plan.reduce((s, p) => s + p.ramos.length, 0);
  const creditosProyectados = plan.reduce((s, p) => s + p.creditos, 0);
  const fechaEgreso = calcularFechaEgreso(plan[0]?.semestre || 0, plan.length);

  const resumenWrapper = document.createElement("div");
  resumenWrapper.classList.add("resumen-wrapper");

  const resumenFinal = document.createElement("div");
  resumenFinal.classList.add("resumen-lateral");
  resumenFinal.innerHTML = `
    <div class="resumen-header-lateral">
      <h3>Resumen de Proyección Manual</h3>
    </div>
    <div class="resumen-body-lateral">
      <p><strong>Semestres proyectados:</strong> <span>${plan.length} semestres</span></p>
      <p><strong>Proyección inicia en:</strong> <span>${formatearSemestre(plan[0]?.semestre)}</span></p>
      <p><strong>Fecha estimada de egreso:</strong> <span>${fechaEgreso}</span></p>
      <p><strong>Total de ramos:</strong> <span>${ramosTotales} ramos</span></p>
      <p><strong>Créditos totales:</strong> <span>${creditosProyectados} créditos</span></p>
    </div>
  `;
  resumenWrapper.appendChild(resumenFinal);

  const layoutContainer = document.createElement("div");
  layoutContainer.classList.add("proyeccion-layout");
  layoutContainer.appendChild(mallaDiv);
  layoutContainer.appendChild(resumenWrapper);
  contenedor.appendChild(layoutContainer);

  const botonesFinales = document.createElement("div");
  botonesFinales.className = "botones-navegacion-semestre";
  botonesFinales.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin: 30px 0;
  `;

  const btnGuardar = document.createElement("button");
  btnGuardar.style.cssText = `
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 18px 30px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
  `;
  btnGuardar.innerHTML = `<span>Guardar Proyección</span>`;
  btnGuardar.onmouseover = () => {
    btnGuardar.style.transform = "translateY(-3px)";
    btnGuardar.style.boxShadow = "0 6px 20px rgba(39, 174, 96, 0.4)";
  };
  btnGuardar.onmouseout = () => {
    btnGuardar.style.transform = "translateY(0)";
    btnGuardar.style.boxShadow = "0 4px 15px rgba(39, 174, 96, 0.3)";
  };
  btnGuardar.addEventListener("click", () => guardarProyeccionManualFinal(plan, carrera));
  botonesFinales.appendChild(btnGuardar);

  const btnReiniciar = document.createElement("button");
  btnReiniciar.style.cssText = `
    background: white;
    color: #e67e22;
    border: 2px solid #e67e22;
    border-radius: 12px;
    padding: 18px 30px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  `;
  btnReiniciar.innerHTML = `<span>Reiniciar Proyección</span>`;
  btnReiniciar.onmouseover = () => {
    btnReiniciar.style.background = "#e67e22";
    btnReiniciar.style.color = "white";
    btnReiniciar.style.transform = "translateY(-3px)";
    btnReiniciar.style.boxShadow = "0 6px 15px rgba(230, 126, 34, 0.3)";
  };
  btnReiniciar.onmouseout = () => {
    btnReiniciar.style.background = "white";
    btnReiniciar.style.color = "#e67e22";
    btnReiniciar.style.transform = "translateY(0)";
    btnReiniciar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
  };
  btnReiniciar.addEventListener("click", () => location.reload());
  botonesFinales.appendChild(btnReiniciar);

  contenedor.after(botonesFinales);
}

async function guardarProyeccionManualFinal(plan, carrera) {
  const ramosSeleccionados = [];
  plan.forEach(bloque => {
    bloque.ramos.forEach(ramo => {
      ramosSeleccionados.push({
        ...ramo,
        semestre: bloque.semestre
      });
    });
  });

  const totalCreditos = ramosSeleccionados.reduce((sum, r) => sum + Number(r.creditos), 0);
  const fechaEgreso = calcularFechaEgreso(plan[0]?.semestre, plan.length);
  
  const nombreProyeccion = prompt(
    "Ingresa un nombre para esta proyección:", 
    `Proyección Manual - ${new Date().toLocaleDateString()}`
  );
  
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
    semestres_proyectados: plan.length,
    fecha_egreso_estimada: fechaEgreso,
    datos_completos: {
      plan: plan,
      ramos: ramosSeleccionados,
      fecha_creacion: new Date().toISOString()
    }
  };

  try {
    const resultado = await guardarProyeccion(proyeccionData);
    alert(
      `${resultado.mensaje}\n\n` +
      `Total: ${ramosSeleccionados.length} ramos en ${plan.length} semestres\n` +
      `Créditos: ${totalCreditos}\n` +
      `Egreso estimado: ${fechaEgreso}\n\n` +
      `Puedes ver tus proyecciones guardadas en la sección "Versiones"`
    );
    
    setTimeout(() => {
      window.location.href = "../html/versiones.html";
    }, 2000);
  } catch (error) {
    console.error("Error al guardar proyección:", error);
    alert("Error al guardar la proyección. Intenta nuevamente.");
  }
}

function calcularSiguienteSemestre(semestreActual) {
  const tipo = semestreActual % 100;
  if (tipo === 10) {
    return semestreActual + 10;
  } else {
    return (Math.floor(semestreActual / 100) + 1) * 100 + 10;
  }
}

function calcularSemestreAnterior(semestreActual) {
  const tipo = semestreActual % 100;
  if (tipo === 20) {
    return semestreActual - 10;
  } else {
    return (Math.floor(semestreActual / 100) - 1) * 100 + 20;
  }
}

function formatearSemestre(semestre) {
  if (!semestre) return "—";
  const año = Math.floor(semestre / 100);
  const tipo = semestre % 100;
  const nombre = tipo === 10 ? "Primer Semestre" : "Segundo Semestre";
  return `${nombre} ${año}`;
}

function calcularFechaEgreso(semestreInicio, cantidadSemestres) {
  const añoInicio = Math.floor(semestreInicio / 100);
  const tipoSemestre = semestreInicio % 100;
  const mesInicio = tipoSemestre === 10 ? 3 : 8;
  
  const mesesTotales = cantidadSemestres * 6;
  const fechaEgreso = new Date(añoInicio, mesInicio - 1);
  fechaEgreso.setMonth(fechaEgreso.getMonth() + mesesTotales);
  
  const opcionesFormato = { year: 'numeric', month: 'long' };
  return fechaEgreso.toLocaleDateString('es-CL', opcionesFormato);
}

async function generarProyeccionAutomatica(auth, carrera, contenedor) {
  try {
    contenedor.innerHTML = "<p>Generando proyección automática...</p>";

    const [avance, malla] = await Promise.all([
      obtenerAvance(auth.rut, carrera.codigo),
      obtenerMalla(carrera.codigo, carrera.catalogo),
    ]);

    if (!Array.isArray(malla) || !Array.isArray(avance)) {
      contenedor.innerHTML = "<p>No se encontraron datos.</p>";
      return;
    }

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

    const ramosPendientes = malla.filter(
      (r) => obtenerEstado(r.codigo) === "pendiente"
    );

    const aprobadosSimulados = new Set([
      ...Object.keys(estadoRamos).filter(k => 
        estadoRamos[k].estado === "aprobado" || estadoRamos[k].estado === "inscrito"
      )
    ]);

    const cumplePrereq = (curso) => {
      if (!curso.prereq || curso.prereq.trim() === "") return true;
      const prereqs = curso.prereq.split(",").map((p) => normalizarCodigo(p));
      return prereqs.every(p => aprobadosSimulados.has(p));
    };

    const planAutomatico = [];
    const LIMITE_CREDITOS = 30;
    let semestreNum = 1;

    while (ramosPendientes.length > 0) {
      const disponibles = ramosPendientes.filter(r => 
        cumplePrereq(r) && !aprobadosSimulados.has(normalizarCodigo(r.codigo))
      );

      if (disponibles.length === 0) break;

      disponibles.sort((a, b) => a.nivel - b.nivel);

      const ramosSemestre = [];
      let creditosSemestre = 0;

      for (const ramo of disponibles) {
        if (creditosSemestre + ramo.creditos <= LIMITE_CREDITOS) {
          ramosSemestre.push({
            codigo: ramo.codigo,
            nombre: obtenerNombreRamo(ramo.codigo, ramo.asignatura),
            creditos: ramo.creditos,
            nivel: ramo.nivel
          });
          creditosSemestre += ramo.creditos;
          aprobadosSimulados.add(normalizarCodigo(ramo.codigo));
          
          const index = ramosPendientes.findIndex(r => r.codigo === ramo.codigo);
          if (index > -1) ramosPendientes.splice(index, 1);
        }
      }

      if (ramosSemestre.length === 0) break;

      planAutomatico.push({
        semestre: semestreNum,
        ramos: ramosSemestre,
        creditos: creditosSemestre
      });

      semestreNum++;
    }

    mostrarResumenAutomatico(planAutomatico, contenedor, carrera);

  } catch (err) {
    console.error("Error en proyección automática:", err);
    contenedor.innerHTML = `<p style="color:red;">Error al generar proyección automática.</p>`;
  }
}

function mostrarResumenAutomatico(plan, contenedor, carrera) {
  limpiarElementosAnteriores();

  const headerResumen = document.createElement("div");
  headerResumen.className = "header-semestre-actual";
  headerResumen.style.cssText = `
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
    color: white;
    padding: 30px;
    border-radius: 15px;
    margin: 0 0 30px 0;
    text-align: center;
    box-shadow: 0 4px 20px rgba(39, 174, 96, 0.3);
  `;
  headerResumen.innerHTML = `
    <h2 style="margin: 0 0 10px 0; font-size: 2rem;">Proyección Automática Generada</h2>
    <p style="margin: 0; font-size: 1.1rem; opacity: 0.95;">
      Se ha generado una proyección óptima basada en prerrequisitos y límite de créditos
    </p>
  `;
  contenedor.before(headerResumen);

  contenedor.innerHTML = "";
  const mallaDiv = document.createElement("div");
  mallaDiv.classList.add("malla-proyeccion");

  plan.forEach((bloque) => {
    const bloqueDiv = document.createElement("div");
    bloqueDiv.classList.add("bloque-nivel");
    bloqueDiv.innerHTML = `
      <h3>Semestre ${bloque.semestre}</h3>
      <p style="font-size:0.9rem; color:#666;">${bloque.creditos} créditos | ${bloque.ramos.length} ramos</p>
    `;
    const grid = document.createElement("div");
    grid.classList.add("malla-grid");

    bloque.ramos.forEach((r) => {
      const div = document.createElement("div");
      div.classList.add("curso", "seleccionado-auto");
      div.innerHTML = `
        <h4>${r.nombre}</h4>
        <p>${r.codigo}</p>
        <p>${r.creditos} créditos</p>
      `;
      grid.appendChild(div);
    });

    bloqueDiv.appendChild(grid);
    mallaDiv.appendChild(bloqueDiv);
  });

  const ramosTotales = plan.reduce((s, p) => s + p.ramos.length, 0);
  const creditosProyectados = plan.reduce((s, p) => s + p.creditos, 0);

  const resumenWrapper = document.createElement("div");
  resumenWrapper.classList.add("resumen-wrapper");

  const resumenFinal = document.createElement("div");
  resumenFinal.classList.add("resumen-lateral");
  resumenFinal.innerHTML = `
    <div class="resumen-header-lateral">
      <h3>Resumen de Proyección Automática</h3>
    </div>
    <div class="resumen-body-lateral">
      <p><strong>Semestres proyectados:</strong> <span>${plan.length} semestres</span></p>
      <p><strong>Total de ramos:</strong> <span>${ramosTotales} ramos</span></p>
      <p><strong>Créditos totales:</strong> <span>${creditosProyectados} créditos</span></p>
      <p><strong>Promedio créditos/semestre:</strong> <span>${(creditosProyectados / plan.length).toFixed(1)}</span></p>
    </div>
  `;
  resumenWrapper.appendChild(resumenFinal);

  const layoutContainer = document.createElement("div");
  layoutContainer.classList.add("proyeccion-layout");
  layoutContainer.appendChild(mallaDiv);
  layoutContainer.appendChild(resumenWrapper);
  contenedor.appendChild(layoutContainer);

  const botonesFinales = document.createElement("div");
  botonesFinales.className = "botones-navegacion-semestre";
  botonesFinales.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin: 30px 0;
  `;

  const btnGuardar = document.createElement("button");
  btnGuardar.style.cssText = `
    background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 18px 30px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
  `;
  btnGuardar.innerHTML = `<span>Guardar Proyección</span>`;
  btnGuardar.onmouseover = () => {
    btnGuardar.style.transform = "translateY(-3px)";
    btnGuardar.style.boxShadow = "0 6px 20px rgba(39, 174, 96, 0.4)";
  };
  btnGuardar.onmouseout = () => {
    btnGuardar.style.transform = "translateY(0)";
    btnGuardar.style.boxShadow = "0 4px 15px rgba(39, 174, 96, 0.3)";
  };
  btnGuardar.addEventListener("click", () => guardarProyeccionAutomaticaFinal(plan, carrera));
  botonesFinales.appendChild(btnGuardar);

  const btnReiniciar = document.createElement("button");
  btnReiniciar.style.cssText = `
    background: white;
    color: #e67e22;
    border: 2px solid #e67e22;
    border-radius: 12px;
    padding: 18px 30px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  `;
  btnReiniciar.innerHTML = `<span>Reiniciar Proyección</span>`;
  btnReiniciar.onmouseover = () => {
    btnReiniciar.style.background = "#e67e22";
    btnReiniciar.style.color = "white";
    btnReiniciar.style.transform = "translateY(-3px)";
    btnReiniciar.style.boxShadow = "0 6px 15px rgba(230, 126, 34, 0.3)";
  };
  btnReiniciar.onmouseout = () => {
    btnReiniciar.style.background = "white";
    btnReiniciar.style.color = "#e67e22";
    btnReiniciar.style.transform = "translateY(0)";
    btnReiniciar.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.1)";
  };
  btnReiniciar.addEventListener("click", () => location.reload());
  botonesFinales.appendChild(btnReiniciar);

  contenedor.after(botonesFinales);
}

async function guardarProyeccionAutomaticaFinal(plan, carrera) {
  const ramosSeleccionados = [];
  plan.forEach(bloque => {
    bloque.ramos.forEach(ramo => {
      ramosSeleccionados.push({
        ...ramo,
        semestre: bloque.semestre
      });
    });
  });

  const totalCreditos = ramosSeleccionados.reduce((sum, r) => sum + Number(r.creditos), 0);
  
  const nombreProyeccion = prompt(
    "Ingresa un nombre para esta proyección:", 
    `Proyección Automática - ${new Date().toLocaleDateString()}`
  );
  
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
    fecha_egreso_estimada: null,
    datos_completos: {
      plan: plan,
      ramos: ramosSeleccionados,
      fecha_creacion: new Date().toISOString()
    }
  };

  try {
    const resultado = await guardarProyeccion(proyeccionData);
    alert(
      `${resultado.mensaje}\n\n` +
      `Total: ${ramosSeleccionados.length} ramos en ${plan.length} semestres\n` +
      `Créditos: ${totalCreditos}\n\n` +
      `Puedes ver tus proyecciones guardadas en la sección "Versiones"`
    );
    
    setTimeout(() => {
      window.location.href = "../html/versiones.html";
    }, 2000);
  } catch (error) {
    console.error("Error al guardar proyección:", error);
    alert("Error al guardar la proyección. Intenta nuevamente.");
  }
}