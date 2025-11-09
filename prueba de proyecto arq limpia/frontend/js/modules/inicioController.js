import { obtenerAvance, obtenerMalla } from "../services/apiService.js";
import { storage } from "../services/storageService.js";
import { normalizarCodigo, obtenerNombreRamo } from "../services/utils.js";

// 🔹 Utilidad para formatear períodos
function nombrePeriodo(p) {
  if (!p || String(p).length < 6) return p || "—";
  const y = String(p).slice(0, 4);
  const code = String(p).slice(-2);
  const s =
    code === "10" ? "Primer semestre" :
    code === "20" ? "Segundo semestre" :
    code === "15" ? "Invierno/Verano" : "Otro";
  return `${y} (${s})`;
}

// 🔹 Función para obtener nombre hardcodeado basado en el código
function obtenerNombreHardcodeado(codigo) {
  if (!codigo || codigo === "—") return "Curso sin nombre";
  
  const codigoLimpio = normalizarCodigo(codigo);
  
  if (codigoLimpio.startsWith("DCTE")) return "Curso de Formación General";
  if (codigoLimpio.startsWith("UNFP")) return "Curso de Formación Profesional";
  if (codigoLimpio.startsWith("SSED")) return "Curso de Inglés o Comunicación";
  if (codigoLimpio.startsWith("ECIN")) return "Curso de Ingeniería o Programación";
  if (codigoLimpio.startsWith("DCCB")) return "Curso de Ciencias Básicas";
  
  return "Curso sin nombre";
}

export function initInicio() {
  document.addEventListener("DOMContentLoaded", async () => {
    const auth = storage.requireAuth();
    const carrera = storage.getCarrera();
    if (!carrera) return window.location.replace("../html/index.html");

    // Referencias DOM
    const nombreCarreraEl = document.getElementById("nombreCarrera");
    const semestreActualEl = document.getElementById("semestreActual");
    const contenedorRamos = document.getElementById("contenedorRamos");
    const totalCreditosEl = document.getElementById("totalCreditos");
    const estadoCreditosEl = document.getElementById("estadoCreditos");
    const filtroSemestre = document.getElementById("filtroSemestre");
    const selectCarrera = document.getElementById("selectCarrera");

    // Selector de carrera
    if (selectCarrera) {
      selectCarrera.innerHTML = "";
      (auth.carreras || []).forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.codigo;
        opt.textContent = `${c.nombre} (${c.catalogo})`;
        if (c.codigo === carrera.codigo) opt.selected = true;
        selectCarrera.appendChild(opt);
      });
      selectCarrera.addEventListener("change", () => {
        const nueva = (auth.carreras || []).find(
          (c) => c.codigo === selectCarrera.value
        );
        if (nueva) {
          storage.setCarrera(nueva);
          location.reload();
        }
      });
    }

    // Mostrar nombre de carrera
    nombreCarreraEl.textContent = carrera.nombre || "Carrera actual";

    try {
      // 🔹 Obtener avance académico y malla curricular en paralelo
      const [avance, malla] = await Promise.all([
        obtenerAvance(auth.rut, carrera.codigo),
        obtenerMalla(carrera.codigo, carrera.catalogo)
      ]);

      if (!Array.isArray(avance) || avance.length === 0) {
        contenedorRamos.innerHTML = "<p>No se encontró avance académico.</p>";
        return;
      }

      // 🔹 Crear mapa de la malla para enriquecer datos
      const mallaPorCodigo = {};
      malla.forEach((ramo) => {
        const codigoNormalizado = normalizarCodigo(ramo.codigo);
        mallaPorCodigo[codigoNormalizado] = ramo;
      });

      // 🔹 Enriquecer avance con datos de la malla
      const avanceEnriquecido = avance.map((registro) => {
        // Normalizar campos de diferentes APIs
        const codigoCurso = registro.course || registro.codigo_asignatura || "—";
        const nombreAvance = registro.course_name || registro.asignatura || registro.nombre_asignatura || "Sin nombre";
        const estado = registro.status || registro.estado || "—";
        const periodo = registro.period || registro.periodo || "SIN_PERIODO";
        
        const codigoNormalizado = normalizarCodigo(codigoCurso);
        const datosMalla = mallaPorCodigo[codigoNormalizado];
        
        // 🔹 Obtener nombre usando múltiples fuentes
        let nombreFinal;
        
        // Primero intentar con la función existente
        const nombreMalla = datosMalla?.asignatura;
        const nombreDesdeFuncion = obtenerNombreRamo(codigoCurso, nombreMalla || nombreAvance);
        
        // Si el nombre es genérico o vacío, usar nombres hardcodeados
        if (!nombreDesdeFuncion || 
            nombreDesdeFuncion === "Sin nombre" || 
            nombreDesdeFuncion === "Curso sin nombre" ||
            nombreDesdeFuncion.trim() === "") {
          nombreFinal = obtenerNombreHardcodeado(codigoCurso);
        } else {
          nombreFinal = nombreDesdeFuncion;
        }
        
        return {
          codigo: codigoCurso,
          nombre: nombreFinal,
          creditos: datosMalla?.creditos || registro.credits || registro.creditos || 0,
          periodo: periodo,
          estado: estado
        };
      });

      // 🔹 Agrupar por período y eliminar duplicados POR SEMESTRE
      const porPeriodo = {};
      
      avanceEnriquecido.forEach((registro) => {
        const periodo = registro.periodo;
        const codigoCurso = registro.codigo;
        
        // Si el periodo no existe, crearlo
        if (!porPeriodo[periodo]) {
          porPeriodo[periodo] = {
            cursos: [],
            cursosVistos: new Set() // 👈 Set para rastrear códigos únicos
          };
        }

        // Solo agregar si NO ha sido visto en este periodo
        if (!porPeriodo[periodo].cursosVistos.has(codigoCurso)) {
          porPeriodo[periodo].cursos.push(registro);
          porPeriodo[periodo].cursosVistos.add(codigoCurso);
        }
      });

      // 🔹 Crear filtro de períodos (ordenados del más reciente al más antiguo)
      const periodos = Object.keys(porPeriodo).sort((a, b) => b.localeCompare(a));
      filtroSemestre.innerHTML = "";
      periodos.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = nombrePeriodo(p);
        filtroSemestre.appendChild(opt);
      });

      // 🔹 Renderizador de período
      function renderPeriodo(periodo) {
        const datoPeriodo = porPeriodo[periodo];
        if (!datoPeriodo) {
          contenedorRamos.innerHTML = "<p>No hay datos para este semestre.</p>";
          return;
        }

        const cursos = datoPeriodo.cursos;
        contenedorRamos.innerHTML = "";
        let total = 0, aprob = 0, repro = 0;

        cursos.forEach((c) => {
          total += c.creditos;
          if (c.estado === "APROBADO") aprob += c.creditos;
          if (c.estado === "REPROBADO") repro += c.creditos;

          // Color según estado (solo INSCRITO, no EN_CURSO)
          const color =
            c.estado === "APROBADO"
              ? "#c8e6c9"
              : c.estado === "INSCRITO"
              ? "#fff9c4"
              : c.estado === "REPROBADO"
              ? "#ffcdd2"
              : "#e1bee7";

          const card = document.createElement("div");
          card.classList.add("ramo-card");
          card.style.background = color;
          card.innerHTML = `
            <h4>${c.nombre}</h4>
            <p><strong>Periodo:</strong> ${nombrePeriodo(periodo)}</p>
            <p><strong>Código:</strong> ${c.codigo}</p>
            <p><strong>Créditos:</strong> ${c.creditos}</p>
            <p><strong>Estado:</strong> ${c.estado}</p>
          `;
          contenedorRamos.appendChild(card);
        });

        // Mostrar estadísticas del semestre
        totalCreditosEl.textContent = total;
        estadoCreditosEl.innerHTML = `
          <p><strong>Aprobados:</strong> ${aprob} créditos</p>
          <p><strong>Reprobados:</strong> ${repro} créditos</p>
          <p style="color:${total > 35 ? "red" : "green"}">
            ${total > 35 ? "⚠️ Límite excedido" : "✅ Dentro del límite de créditos"}
          </p>
        `;
      }

      // Mostrar el primer período (más reciente)
      if (periodos[0]) {
        semestreActualEl.textContent = nombrePeriodo(periodos[0]);
        renderPeriodo(periodos[0]);
      }

      // Listener para cambio de semestre
      filtroSemestre.addEventListener("change", (e) =>
        renderPeriodo(e.target.value)
      );

    } catch (err) {
      console.error("Error al cargar historial:", err);
      contenedorRamos.innerHTML = `<p style="color:red;">Error al cargar historial académico.</p>`;
    }
  });
}