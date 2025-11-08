import { obtenerAvance } from "../services/apiService.js";
import { storage } from "../services/storageService.js";

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
      // 🔹 Obtener avance académico real
      const avance = await obtenerAvance(auth.rut, carrera.codigo);
      if (!Array.isArray(avance) || avance.length === 0) {
        contenedorRamos.innerHTML = "<p>No se encontró avance académico.</p>";
        return;
      }

      // 🔹 Agrupar por período
      const porPeriodo = {};
      avance.forEach((r) => {
        const periodo = r.periodo || "SIN_PERIODO";
        if (!porPeriodo[periodo]) porPeriodo[periodo] = [];
        porPeriodo[periodo].push(r);
      });

      // 🔹 Crear filtro de períodos
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
        const cursos = porPeriodo[periodo] || [];
        contenedorRamos.innerHTML = "";
        let total = 0, aprob = 0, repro = 0;

        cursos.forEach((c) => {
          // Normalizamos nombres de campos
          const codigo = c.course || c.codigo_asignatura || c.cod_asignatura || "—";
          const nombre =
            c.course_name || c.asignatura || c.nombre_asignatura || "Sin nombre";
          const estado = c.status || c.estado || "—";
          const creditos = Number(c.credits || c.creditos || 0);
          total += creditos;
          if (estado === "APROBADO") aprob += creditos;
          if (estado === "REPROBADO") repro += creditos;

          const color =
            estado === "APROBADO"
              ? "#c8e6c9"
              : estado === "INSCRITO"
              ? "#fff9c4"
              : estado === "REPROBADO"
              ? "#ffcdd2"
              : "#e1bee7";

          const card = document.createElement("div");
          card.classList.add("ramo-card");
          card.style.background = color;
          card.innerHTML = `
            <h4>${nombre}</h4>
            <p><strong>Periodo:</strong> ${periodo}</p>
            <p><strong>Código:</strong> ${codigo}</p>
            <p><strong>Créditos:</strong> ${creditos}</p>
            <p><strong>Estado:</strong> ${estado}</p>
          `;
          contenedorRamos.appendChild(card);
        });

        totalCreditosEl.textContent = total;
        estadoCreditosEl.innerHTML = `
          <p><strong>Aprobados:</strong> ${aprob} créditos</p>
          <p><strong>Reprobados:</strong> ${repro} créditos</p>
          <p style="color:${total > 35 ? "red" : "green"}">
            ${total > 35 ? "⚠️ Límite excedido" : "Dentro del límite de créditos"}
          </p>
        `;
      }

      // Mostrar el primer período (más reciente)
      if (periodos[0]) {
        semestreActualEl.textContent = periodos[0];
        renderPeriodo(periodos[0]);
      }

      filtroSemestre.addEventListener("change", (e) =>
        renderPeriodo(e.target.value)
      );
    } catch (err) {
      console.error(err);
      contenedorRamos.innerHTML = `<p style="color:red;">Error al cargar historial.</p>`;
    }
  });
}
