// ==========================================================================
// CONFIGURACIÓN DE FIREBASE (CONEXIÓN EN LA NUBE EN TIEMPO REAL)
// ==========================================================================
// REEMPLAZA esta URL con la que te dé tu consola de Firebase Realtime Database:
const BASE_DATOS_URL = "https://control-familiar-760ec-default-rtdb.firebaseio.com/";

const firebaseConfig = {
  databaseURL: BASE_DATOS_URL
};

// Inicializar la conexión con Google Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Referencias de los contenedores en la nube
const refTransacciones = db.ref('transacciones');
const refInversiones = db.ref('inversiones');

// Variables globales actualizadas dinámicamente desde la red
let transacciones = [];
let inversiones = [];

// ==========================================================================
// REFERENCIAS AL DOM (SISTEMA ORIGINAL)
// ==========================================================================
const formTransaccion = document.getElementById("formTransaccion");
const formInversion = document.getElementById("formInversion");

const elTotalIngresos = document.getElementById("totalIngresos");
const elTotalGastos = document.getElementById("totalGastos");
const elBalanceActual = document.getElementById("balanceActual");
const elTotalInvertido = document.getElementById("totalInvertido");

const cuerpoHistorial = document.getElementById("cuerpoHistorial");
const estadoVacio = document.getElementById("estadoVacio");
const contadorMovimientos = document.getElementById("contadorMovimientos");

// ==========================================================================
// ESCUCHAR CAMBIOS EN TIEMPO REAL (SINCRONIZACIÓN AUTOMÁTICA MULTI-CELULAR)
// ==========================================================================
refTransacciones.on('value', (snapshot) => {
  const datos = snapshot.val();
  // Transformar la estructura de Firebase asignándole su ID único a cada fila
  transacciones = datos ? Object.keys(datos).map(id => ({ id, ...datos[id] })) : [];
  actualizarInterfaz();
});

refInversiones.on('value', (snapshot) => {
  const datos = snapshot.val();
  inversiones = datos ? Object.keys(datos).map(id => ({ id, ...datos[id] })) : [];
  actualizarInterfaz();
});

// ==========================================================================
// LÓGICA DE PROCESAMIENTO Y CÁLCULOS MULTIMONEDA (Bs / $)
// ==========================================================================
function actualizarInterfaz() {
  // Limpiar el historial en pantalla
  cuerpoHistorial.innerHTML = "";
  
  let incBs = 0, incUsd = 0;
  let gastBs = 0, gastUsd = 0;
  let invBs = 0, invUsd = 0;

  // 1. Renderizar Transacciones en la Tabla
  const totalRegistros = transacciones.length + inversiones.length;

  if (totalRegistros === 0) {
    estadoVacio.style.display = "block";
    contadorMovimientos.textContent = "0 registros";
  } else {
    estadoVacio.style.display = "none";
    contadorMovimientos.textContent = `${totalRegistros} registro(s) totales`;

    // Renderizar Transacciones
    const listaTransaccionesOrdenada = [...transacciones].reverse();
    listaTransaccionesOrdenada.forEach((t) => {
      const montoNum = parseFloat(t.monto) || 0;
      
      if (t.tipo === 'ingreso') {
        if (t.moneda === 'Bs') incBs += montoNum;
        else incUsd += montoNum;
      } else if (t.tipo === 'gasto') {
        if (t.moneda === 'Bs') gastBs += montoNum;
        else gastUsd += montoNum;
      }

      const fila = document.createElement("tr");
      const claseMonto = t.tipo === "ingreso" ? "monto-ingreso" : "monto-gasto";
      const simboloMoneda = t.moneda === "Bs" ? "Bs" : "$";
      const claseBadge = t.tipo === "ingreso" ? "badge--ingreso" : "badge--gasto";

      fila.innerHTML = `
        <td>${t.fecha || ''}</td>
        <td><span class="badge ${claseBadge}">${t.tipo}</span></td>
        <td>${t.categoria || ''}</td>
        <td>${t.descripcion || '-'}</td>
        <td><strong>${t.miembro || ''}</strong></td>
        <td class="col-monto ${claseMonto}">${simboloMoneda} ${montoNum.toFixed(2)}</td>
        <td>
          <button class="btn-delete" onclick="eliminarTransaccion('${t.id}')">❌ Borrar</button>
        </td>
      `;
      cuerpoHistorial.appendChild(fila);
    });

    // Renderizar Inversiones en la misma tabla de historial (o puedes separarlas si prefieres)
    const listaInversionesOrdenada = [...inversiones].reverse();
    listaInversionesOrdenada.forEach((i) => {
      const montoInv = parseFloat(i.montoInversion) || 0;
      if (i.monedaInversion === 'Bs') invBs += montoInv;
      else invUsd += montoInv;

      const fila = document.createElement("tr");
      const simboloMoneda = i.monedaInversion === "Bs" ? "Bs" : "$";

      fila.innerHTML = `
        <td>${i.fecha || ''}</td>
        <td><span class="badge" style="background-color: #2563eb; color: white;">inversión</span></td>
        <td>${i.tipoInversion || ''}</td>
        <td>${i.descripcionInversion || '-'}</td>
        <td><strong>${i.miembroInversion || ''}</strong></td>
        <td class="col-monto" style="color: #2563eb;">${simboloMoneda} ${montoInv.toFixed(2)}</td>
        <td>
          <button class="btn-delete" onclick="eliminarInversion('${i.id}')">❌ Borrar</button>
        </td>
      `;
      cuerpoHistorial.appendChild(fila);
    });
  }

  // 3. Calcular balances finales independientes
  const balBs = incBs - gastBs;
  const balUsd = incUsd - gastUsd;

  // 4. Pintar las tarjetas resumen del Dashboard
  elTotalIngresos.innerHTML = `${incBs.toFixed(2)} Bs <span style="font-size:0.9rem; color:var(--texto-secundario);">/ ${incUsd.toFixed(2)} $</span>`;
  elTotalGastos.innerHTML = `${gastBs.toFixed(2)} Bs <span style="font-size:0.9rem; color:var(--texto-secundario);">/ ${gastUsd.toFixed(2)} $</span>`;
  elBalanceActual.innerHTML = `${balBs.toFixed(2)} Bs <span style="font-size:0.9rem; color:var(--texto-secundario);">/ ${balUsd.toFixed(2)} $</span>`;
  elTotalInvertido.innerHTML = `${invBs.toFixed(2)} Bs <span style="font-size:0.9rem; color:var(--texto-secundario);">/ ${invUsd.toFixed(2)} $</span>`;
}

// ==========================================================================
// CAPTURA DE FORMULARIOS Y ENVÍO DIRECTO A LA NUBE
// ==========================================================================
formTransaccion.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const nuevoMovimiento = {
    fecha: new Date().toLocaleDateString('es-ES'),
    tipo: document.getElementById('tipo').value,
    moneda: document.getElementById('monedaMovimiento').value,
    monto: parseFloat(document.getElementById('monto').value),
    categoria: document.getElementById('categoria').value,
    descripcion: document.getElementById('descripcion').value || '-',
    miembro: document.getElementById('miembro').value
  };

  refTransacciones.push(nuevoMovimiento);
  formTransaccion.reset();
});

formInversion.addEventListener('submit', (e) => {
  e.preventDefault();

  const nuevaInversion = {
    fecha: new Date().toLocaleDateString('es-ES'),
    monedaInversion: document.getElementById('monedaInversion').value,
    montoInversion: parseFloat(document.getElementById('montoInversion').value),
    tipoInversion: document.getElementById('tipoInversion').value,
    descripcionInversion: document.getElementById('descripcionInversion').value || '-',
    miembroInversion: document.getElementById('miembroInversion').value
  };

  refInversiones.push(nuevaInversion);
  formInversion.reset();
});

// ==========================================================================
// ELIMINACIÓN DE REGISTROS EN LA NUBE
// ==========================================================================
window.eliminarTransaccion = function(id) {
  if (confirm("¿Seguro que quieres borrar este registro de la base de datos familiar, bro?")) {
    db.ref('transacciones/' + id).remove();
  }
};

window.eliminarInversion = function(id) {
  if (confirm("¿Seguro que quieres borrar esta inversión de la base de datos familiar, bro?")) {
    db.ref('inversiones/' + id).remove();
  }
};

// ==========================================================================
// DESCARGA DE EXCEL NATIVO MULTIPESTAÑA (.XLSX REAL)
// ==========================================================================
document.getElementById('btnExportarExcel').addEventListener('click', () => {
  if (transacciones.length === 0 && inversiones.length === 0) {
    alert("Bro, no hay datos en la nube para exportar en este momento.");
    return;
  }

  // Crear libro de trabajo vacío
  const wb = XLSX.utils.book_new();

  // Añadir pestaña de Transacciones si existen registros
  if (transacciones.length > 0) {
    const matrizTransacciones = transacciones.map(t => ({
      'Fecha': t.fecha || '',
      'Tipo': (t.tipo || '').toUpperCase(),
      'Categoría': t.categoria || '',
      'Descripción': t.descripcion || '-',
      'Miembro Familiar': t.miembro || '',
      'Monto': Number(t.monto) || 0,
      'Moneda': t.moneda || 'Bs'
    }));
    const wsTransacciones = XLSX.utils.json_to_sheet(matrizTransacciones);
    XLSX.utils.book_append_sheet(wb, wsTransacciones, 'Transacciones');
  }

  // Añadir pestaña de Inversiones si existen registros
  if (inversiones.length > 0) {
    const matrizInversiones = inversiones.map(i => ({
      'Fecha': i.fecha || '',
      'Tipo de Inversión': i.tipoInversion || '',
      'Descripción': i.descripcionInversion || '-',
      'Miembro Familiar': i.miembroInversion || '',
      'Monto Invertido': Number(i.montoInversion) || 0,
      'Moneda': i.monedaInversion || 'Bs'
    }));
    const wsInversiones = XLSX.utils.json_to_sheet(matrizInversiones);
    XLSX.utils.book_append_sheet(wb, wsInversiones, 'Inversiones');
  }

  // Guardar archivo binario nativo de Excel (.xlsx) con pestañas separadas
  const fechaHoy = new Date().toISOString().slice(0,10).replace(/-/g, '_');
  XLSX.writeFile(wb, `Contabilidad_Familiar_${fechaHoy}.xlsx`);
});
