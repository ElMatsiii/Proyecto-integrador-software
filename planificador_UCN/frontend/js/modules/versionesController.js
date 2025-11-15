import { obtenerProyecciones, eliminarProyeccion, obtenerProyeccion } from "../services/apiService.js";
import { storage } from "../services/storageService.js";
import { mostrarError } from "../services/utils.js";

export async function initVersiones() {
  const main = document.querySelector("main");
  const auth = storage.requireAuth();
  const carrera = storage.getCarrera();

  if (!auth || !carrera) {
    return window.location.href = "index.html";
  }

  main.innerHTML = `
    <h2>Versiones de Planificación</h2>
    <p><strong>Carrera:</strong> ${carrera.nombre}</p>
    <div id="proyeccionesContainer">
      <p>Cargando proyecciones...</p>
    </div>
  `;

  try {
    const proyecciones = await obtenerProyecciones(carrera.codigo);
    const contenedor = document.getElementById("proyeccionesContainer");

    if (!proyecciones || proyecciones.length === 0) {
      contenedor.innerHTML = `
        <p style="text-align: center; color: #666; margin: 40px 0;">
          No tienes proyecciones guardadas aún.<br>
          <small>Ve a la sección de "Proyecciones" para crear una.</small>
        </p>
      `;
      return;
    }

    contenedor.innerHTML = `
      <ul class="lista-versiones" id="listaProyecciones"></ul>
    `;

    const lista = document.getElementById("listaProyecciones");
    
    proyecciones.forEach((proy) => {
      const fecha = new Date(proy.fecha_creacion);
      const fechaFormateada = fecha.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const tipoIcono = proy.tipo === 'manual' ? '✏️' : '🤖';
      const tipoBadge = proy.tipo === 'manual' 
        ? '<span class="badge-tipo manual">Manual</span>' 
        : '<span class="badge-tipo automatica">Automática</span>';

      const li = document.createElement("li");
      li.className = "proyeccion-item";
      li.innerHTML = `
        <div class="proyeccion-header">
          <h3>${tipoIcono} ${proy.nombre}</h3>
          ${tipoBadge}
        </div>
        <div class="proyeccion-info">
          <p><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
          <p><strong>📚 Ramos:</strong> ${proy.total_ramos} ramos</p>
          <p><strong>📊 Créditos:</strong> ${proy.total_creditos} créditos</p>
          ${proy.semestres_proyectados ? `<p><strong>📆 Semestres:</strong> ${proy.semestres_proyectados}</p>` : ''}
          ${proy.fecha_egreso_estimada ? `<p><strong>🎓 Egreso estimado:</strong> ${proy.fecha_egreso_estimada}</p>` : ''}
        </div>
        <div class="proyeccion-acciones">
          <button class="btn-ver" data-id="${proy.id}">👁️ Ver detalle</button>
          <button class="btn-eliminar" data-id="${proy.id}">🗑️ Eliminar</button>
        </div>
      `;
      lista.appendChild(li);
    });

    // Event listeners para los botones
    document.querySelectorAll(".btn-ver").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        await mostrarDetalleProyeccion(id);
      });
    });

    document.querySelectorAll(".btn-eliminar").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.dataset.id;
        await eliminarProyeccionConfirmada(id);
      });
    });

  } catch (error) {
    console.error("Error al cargar proyecciones:", error);
    mostrarError("Error al cargar las proyecciones guardadas", main);
  }
}

async function mostrarDetalleProyeccion(id) {
  try {
    const proyeccion = await obtenerProyeccion(id);
    
    if (!proyeccion) {
      alert("No se pudo cargar el detalle de la proyección");
      return;
    }

    const datos = proyeccion.datos_completos;
    let detalleHTML = `
      <div class="modal-overlay" id="modalDetalle">
        <div class="modal-content">
          <div class="modal-header">
            <h2>${proyeccion.nombre}</h2>
            <button class="btn-cerrar-modal" onclick="document.getElementById('modalDetalle').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div class="detalle-resumen">
              <p><strong>Tipo:</strong> ${proyeccion.tipo === 'manual' ? 'Manual ✏️' : 'Automática 🤖'}</p>
              <p><strong>Total de ramos:</strong> ${proyeccion.total_ramos}</p>
              <p><strong>Total de créditos:</strong> ${proyeccion.total_creditos}</p>
              ${proyeccion.semestres_proyectados ? `<p><strong>Semestres proyectados:</strong> ${proyeccion.semestres_proyectados}</p>` : ''}
              ${proyeccion.fecha_egreso_estimada ? `<p><strong>Fecha de egreso estimada:</strong> ${proyeccion.fecha_egreso_estimada}</p>` : ''}
            </div>
            <h3>Ramos seleccionados:</h3>
            <div class="tabla-ramos-container">
              <table class="tabla-ramos-detalle">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Créditos</th>
                    ${proyeccion.tipo === 'automatica' ? '<th>Semestre</th>' : ''}
                  </tr>
                </thead>
                <tbody>
    `;

    if (datos.ramos && Array.isArray(datos.ramos)) {
      datos.ramos.forEach(ramo => {
        detalleHTML += `
          <tr>
            <td>${ramo.codigo}</td>
            <td>${ramo.nombre}</td>
            <td>${ramo.creditos}</td>
            ${proyeccion.tipo === 'automatica' ? `<td>${ramo.semestre || '—'}</td>` : ''}
          </tr>
        `;
      });
    }

    detalleHTML += `
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Agregar estilos del modal si no existen
    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.textContent = `
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 15px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 2px solid #e9ecef;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 15px 15px 0 0;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .btn-cerrar-modal {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 1.5rem;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          cursor: pointer;
          transition: background 0.3s;
        }

        .btn-cerrar-modal:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .modal-body {
          padding: 30px;
        }

        .detalle-resumen {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 25px;
        }

        .detalle-resumen p {
          margin: 10px 0;
          font-size: 1rem;
        }

        .modal-body h3 {
          margin: 25px 0 15px 0;
          color: #333;
          font-size: 1.3rem;
        }

        .tabla-ramos-container {
          overflow-x: auto;
        }

        .tabla-ramos-detalle {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 10px;
          overflow: hidden;
        }

        .tabla-ramos-detalle th {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }

        .tabla-ramos-detalle td {
          padding: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .tabla-ramos-detalle tr:last-child td {
          border-bottom: none;
        }

        .tabla-ramos-detalle tr:hover {
          background: #f8f9fa;
        }

        @media (prefers-color-scheme: dark) {
          .modal-content {
            background: #1c1c1c;
            color: #e0e0e0;
          }

          .detalle-resumen {
            background: #2a2a2a;
          }

          .modal-body h3 {
            color: #e0e0e0;
          }

          .tabla-ramos-detalle {
            background: #2a2a2a;
          }

          .tabla-ramos-detalle td {
            border-color: #444;
            color: #e0e0e0;
          }

          .tabla-ramos-detalle tr:hover {
            background: #333;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Insertar el modal en el DOM
    document.body.insertAdjacentHTML('beforeend', detalleHTML);

  } catch (error) {
    console.error("Error al mostrar detalle:", error);
    alert("Error al cargar el detalle de la proyección");
  }
}

async function eliminarProyeccionConfirmada(id) {
  const confirmacion = confirm("¿Estás seguro de que deseas eliminar esta proyección? Esta acción no se puede deshacer.");
  
  if (!confirmacion) return;

  try {
    await eliminarProyeccion(id);
    alert("✅ Proyección eliminada correctamente");
    // Recargar la página para actualizar la lista
    window.location.reload();
  } catch (error) {
    console.error("Error al eliminar proyección:", error);
    alert("❌ Error al eliminar la proyección. Intenta nuevamente.");
  }
}