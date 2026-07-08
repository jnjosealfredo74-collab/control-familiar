/* ==========================================================================
   CONTROL FINANCIERO FAMILIAR - script.js (MULTIMONEDA: Bs / $)
   Toda la lógica: guardado en LocalStorage, cálculos y renderizado del DOM.
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. CLAVES DE LOCALSTORAGE Y ESTADO EN MEMORIA
// --------------------------------------------------------------------------
const CLAVE_TRANSACCIONES = "cff_transacciones"; // ingresos y gastos
const CLAVE_INVERSIONES = "cff_inversiones";      // inversiones

// Estos arreglos se mantienen sincronizados con LocalStorage en todo momento
let transacciones = [];
let inversiones = [];

// --------------------------------------------------------------------------
// 2. REFERENCIAS AL DOM
// --------------------------------------------------------------------------
const formTransaccion = document.getElementById("formTransaccion");
const formInversion = document.getElementById("formInversion");

const elTotalIngresos = document.getElementById("totalIngresos");
const elTotalGastos = document.getElementById("totalGastos");
const elBalanceActual = document.getElementById("balanceActual");
const elTotalInvertido = document.getElementById("totalInvertido");

const cuerpoHistorial = document.getElementById("cuerpoHistorial");
const estadoVacio = document.getElementById("estadoVacio");
const contadorMovimientos = document.getElementById("contadorMovimientos");

// --------------------------------------------------------------------------
// 3. PERSISTENCIA: LEER Y ESCRIBIR EN LOCALSTORAGE
// --------------------------------------------------------------------------

/** Carga transacciones e inversiones desde LocalStorage a memoria */
function cargarDatos() {
  const transaccionesGuardadas = localStorage.getItem(CLAVE_TRANSACCIONES);
  const inversionesGuardadas = localStorage.getItem(CLAVE_INVERSIONES);

  transacciones = transaccionesGuardadas ? JSON.parse(transaccionesGuardadas) : [];
  inversiones = inversionesGuardadas ? JSON.parse(inversionesGuardadas) : [];
}

/** Guarda el arreglo actual de transacciones en LocalStorage */
function guardarTransacciones() {
  localStorage.setItem(CLAVE_TRANSACCIONES, JSON.stringify(transacciones));
}

/** Guarda el arreglo actual de inversiones en LocalStorage */
function guardarInversiones() {
  localStorage.setItem(CLAVE_INVERSIONES, JSON.stringify(inversiones));
}

// --------------------------------------------------------------------------
// 4. UTILIDADES
// --------------------------------------------------------------------------

/** Genera un id único simple basado en timestamp + azar */
function generarId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/** Formatea números de manera limpia según la moneda */
function formatearCifra(numero, moneda) {
  const formato = moneda === "$" ? "en-US" : "es-BO";
  return numero.toLocaleString(formato, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ` ${moneda}`;
}

/** Devuelve la fecha actual en formato corto legible, ej: 08/07/2026 */
function fechaHoy() {
  const ahora = new Date();
  return ahora.toLocaleDateString("es-BO");
}

// --------------------------------------------------------------------------
// 5. CÁLCULOS: SUMAR / RESTAR BALANCES (SEPARADOS POR MONEDA)
// --------------------------------------------------------------------------

function calcularTotalesMultimoneda() {
  let totales = {
    ingresosBs: 0, ingresosUsd: 0,
    gastosBs: 0, gastosUsd: 0,
    invertidoBs: 0, invertidoUsd: 0,
    balanceBs: 0, balanceUsd: 0
  };

  // Sumar ingresos y gastos por moneda
  transacciones.forEach(t => {
    const monto = Number(t.monto);
    const moneda = t.moneda || "$"; // Compatibilidad con registros antiguos que no tenían campo moneda
    
    if (t.tipo === "ingreso") {
      if (moneda === "Bs") totales.ingresosBs += monto;
      else totales.ingresosUsd += monto;
    } else if (t.tipo === "gasto") {
      if (moneda === "Bs") totales.gastosBs += monto;
      else totales.gastosUsd += monto;
    }
  });

  // Sumar inversiones por moneda
  inversiones.forEach(inv => {
    const monto = Number(inv.monto);
    const moneda = inv.moneda || "$";
    
    if (moneda === "Bs") totales.invertidoBs += monto;
    else totales.invertidoUsd += monto;
  });

  // Balance = Ingresos - Gastos - Invertido
  totales.balanceBs = totales.ingresosBs - totales.gastosBs - totales.invertidoBs;
  totales.balanceUsd = totales.ingresosUsd - totales.gastosUsd - totales.invertidoUsd;

  return totales;
}

// --------------------------------------------------------------------------
// 6. RENDERIZADO: DASHBOARD (TARJETAS UNIFICADAS)
// --------------------------------------------------------------------------
function renderizarDashboard() {
  const t = calcularTotalesMultimoneda();

  // Pintamos los totales de ambas monedas combinados de forma elegante en cada panel
  elTotalIngresos.innerHTML = `${formatearCifra(t.ingresosBs, "Bs")} <span style="font-size:0.85rem; color:var(--texto-secundario); display:block; margin-top:2px;">/ ${formatearCifra(t.ingresosUsd, "$")}</span>`;
  elTotalGastos.innerHTML = `${formatearCifra(t.gastosBs, "Bs")} <span style="font-size:0.85rem; color:var(--texto-secundario); display:block; margin-top:2px;">/ ${formatearCifra(t.gastosUsd, "$")}</span>`;
  elTotalInvertido.innerHTML = `${formatearCifra(t.invertidoBs, "Bs")} <span style="font-size:0.85rem; color:var(--texto-secundario); display:block; margin-top:2px;">/ ${formatearCifra(t.invertidoUsd, "$")}</span>`;
  
  // Balance General con signo dinámico
  const signoBs = t.balanceBs >= 0 ? "+" : "";
  const signoUsd = t.balanceUsd >= 0 ? "+" : "";
  elBalanceActual.innerHTML = `${signoBs}${formatearCifra(t.balanceBs, "Bs")} <span style="font-size:0.85rem; color:var(--texto-secundario); display:block; margin-top:2px;">/ ${signoUsd}${formatearCifra(t.balanceUsd, "$")}</span>`;
}

// --------------------------------------------------------------------------
// 7. RENDERIZADO: HISTORIAL (TABLA)
// --------------------------------------------------------------------------

function obtenerMovimientosUnificados() {
  const movimientosTransacciones = transacciones.map((t) => ({
    ...t,
    origen: "transaccion",
    moneda: t.moneda || "$"
  }));

  const movimientosInversiones = inversiones.map((inv) => ({
    ...inv,
    tipo: "inversion",
    categoria: inv.tipoInversion,
    origen: "inversion",
    moneda: inv.moneda || "$"
  }));

  return [...movimientosTransacciones, ...movimientosInversiones].sort(
    (a, b) => b.creadoEn - a.creadoEn
  );
}

function renderizarHistorial() {
  const movimientos = obtenerMovimientosUnificados();

  cuerpoHistorial.innerHTML = "";

  if (movimientos.length === 0) {
    estadoVacio.style.display = "block";
  } else {
    estadoVacio.style.display = "none";
  }

  movimientos.forEach((mov) => {
    const fila = document.createElement("tr");

    if (mov.tipo === "ingreso") fila.classList.add("fila-ingreso");
    else if (mov.tipo === "gasto") fila.classList.add("fila-gasto");
    else fila.classList.add("fila-inversion");

    const etiquetaTipo =
      mov.tipo === "ingreso" ? "Ingreso" : mov.tipo === "gasto" ? "Gasto" : "Inversión";

    const claseBadge =
      mov.tipo === "ingreso"
        ? "badge--ingreso"
        : mov.tipo === "gasto"
        ? "badge--gasto"
        : "badge--inversion";

    const claseMonto =
      mov.tipo === "ingreso" ? "ingreso" : mov.tipo === "gasto" ? "gasto" : "inversion";

    const signo = mov.tipo === "gasto" ? "-" : mov.tipo === "ingreso" ? "+" : "";
    const monedaActiva = mov.moneda || "$";

    fila.innerHTML = `
      <td>${mov.fecha}</td>
      <td><span class="badge ${claseBadge}">${etiquetaTipo}</span></td>
      <td>${mov.categoria}</td>
      <td>${mov.descripcion || "-"}</td>
      <td>${mov.miembro}</td>
      <td class="col-monto">
        <span class="monto-cifra ${claseMonto}">${signo}${formatearCifra(mov.monto, monedaActiva)}</span>
      </td>
      <td class="col-accion">
        <button class="btn-delete" data-id="${mov.id}" data-origen="${mov.origen}">
          Eliminar
        </button>
      </td>
    `;

    cuerpoHistorial.appendChild(fila);
  });

  contadorMovimientos.textContent = `${movimientos.length} registro${movimientos.length === 1 ? "" : "s"}`;
}

function renderizarTodo() {
  renderizarDashboard();
  renderizarHistorial();
}

// --------------------------------------------------------------------------
// 8. EVENTOS: AGREGAR NUEVA TRANSACCIÓN (INGRESO / GASTO)
// --------------------------------------------------------------------------
formTransaccion.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const tipo = document.getElementById("tipo").value;
  const monto = parseFloat(document.getElementById("monto").value);
  const categoria = document.getElementById("categoria").value;
  const descripcion = document.getElementById("descripcion").value.trim();
  const miembro = document.getElementById("miembro").value.trim();
  // Intentar leer el select de moneda; si no existe en el HTML todavía, asigna Bolivianos por defecto
  const elMoneda = document.getElementById("monedaMovimiento");
  const moneda = elMoneda ? elMoneda.value : "Bs";

  if (!monto || monto <= 0 || !miembro) {
    alert("Por favor completa el monto y el miembro de la familia correctamente.");
    return;
  }

  const nuevaTransaccion = {
    id: generarId(),
    tipo, 
    monto,
    moneda, // Guardamos la moneda elegida
    categoria,
    descripcion,
    miembro,
    fecha: fechaHoy(),
    creadoEn: Date.now(), 
  };

  transacciones.push(nuevaTransaccion);
  guardarTransacciones();
  renderizarTodo();

  formTransaccion.reset();
});

// --------------------------------------------------------------------------
// 9. EVENTOS: AGREGAR NUEVA INVERSIÓN
// --------------------------------------------------------------------------
formInversion.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const monto = parseFloat(document.getElementById("montoInversion").value);
  const tipoInversion = document.getElementById("tipoInversion").value;
  const descripcion = document.getElementById("descripcionInversion").value.trim();
  const miembro = document.getElementById("miembroInversion").value.trim();
  const elMoneda = document.getElementById("monedaInversion");
  const moneda = elMoneda ? elMoneda.value : "Bs";

  if (!monto || monto <= 0 || !miembro) {
    alert("Por favor completa el monto y el miembro de la familia correctamente.");
    return;
  }

  const nuevaInversion = {
    id: generarId(),
    monto,
    moneda, // Guardamos la moneda elegida para la inversión
    tipoInversion, 
    descripcion,
    miembro,
    fecha: fechaHoy(),
    creadoEn: Date.now(),
  };

  inversiones.push(nuevaInversion);
  guardarInversiones();
  renderizarTodo();

  formInversion.reset();
});

// --------------------------------------------------------------------------
// 10. EVENTO: ELIMINAR UN REGISTRO DESDE EL HISTORIAL
// --------------------------------------------------------------------------
cuerpoHistorial.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".btn-delete");
  if (!boton) return;

  const id = boton.dataset.id;
  const origen = boton.dataset.origen;

  const confirmado = confirm("¿Seguro que quieres eliminar este registro? Esta acción no se puede deshacer.");
  if (!confirmado) return;

  if (origen === "transaccion") {
    transacciones = transacciones.filter((t) => t.id !== id);
    guardarTransacciones();
  } else {
    inverse = inversiones.filter((inv) => inv.id !== id);
    inversiones = inversiones.filter((inv) => inv.id !== id);
    guardarInversiones();
  }

  renderizarTodo();
});

// --------------------------------------------------------------------------
// 11. INICIALIZACIÓN: SE EJECUTA AL CARGAR LA PÁGINA
// --------------------------------------------------------------------------
function iniciarApp() {
  cargarDatos();
  renderizarTodo();
}

iniciarApp();

// ======================= FUNCIÓN PARA GENERAR Y DESCARGAR EXCEL REAL (.XLSX) MULTIMONEDA =======================
document.getElementById('btnExportarExcel').addEventListener('click', () => {
    const transaccionesGuardadas = localStorage.getItem(CLAVE_TRANSACCIONES);
    const inversionesGuardadas = localStorage.getItem(CLAVE_INVERSIONES);
    
    const transaccionesX = transaccionesGuardadas ? JSON.parse(transaccionesGuardadas) : [];
    const inversionesX = inversionesGuardadas ? JSON.parse(inversionesGuardadas) : [];
    
    if (transaccionesX.length === 0 && inversionesX.length === 0) {
        alert("Bro, no tienes ningún dato registrado todavía para exportar.");
        return;
    }

    const wb = XLSX.utils.book_new();

    if (transaccionesX.length > 0) {
        const datosTransacciones = transaccionesX.map(t => ({
            "Fecha": t.fecha,
            "Tipo": t.tipo.toUpperCase(),
            "Categoría": t.categoria,
            "Descripción": t.descripcion || '-',
            "Miembro Familiar": t.miembro,
            "Monto": Number(t.monto),
            "Moneda": t.moneda || '$'
        }));
        
        const wsTransacciones = XLSX.utils.json_to_sheet(datosTransacciones);
        const maxAnchos = [{"wch": 12}, {"wch": 10}, {"wch": 15}, {"wch": 25}, {"wch": 18}, {"wch": 12}, {"wch": 10}];
        wsTransacciones['!cols'] = maxAnchos;
        XLSX.utils.book_append_sheet(wb, wsTransacciones, "Transacciones");
    }

    if (inversionesX.length > 0) {
        const datosInversiones = inversionesX.map(i => ({
            "Fecha": i.fecha || '-',
            "Tipo de Inversión": i.tipoInversion,
            "Descripción": i.descripcionInversion || '-',
            "Miembro Familiar": i.miembro,
            "Monto Invertido": Number(i.monto),
            "Moneda": i.moneda || '$'
        }));
        
        const wsInversiones = XLSX.utils.json_to_sheet(datosInversiones);
        const maxAnchosInv = [{"wch": 12}, {"wch": 20}, {"wch": 25}, {"wch": 18}, {"wch": 15}, {"wch": 10}];
        wsInversiones['!cols'] = maxAnchosInv;
        XLSX.utils.book_append_sheet(wb, wsInversiones, "Inversiones");
    }

    const fechaHoyArchivo = new Date().toLocaleDateString().replace(/\//g, '-');
    XLSX.writeFile(wb, `Control_Financiero_Familia_${fechaHoyArchivo}.xlsx`);
});