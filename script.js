// ==========================================================================
// CONFIGURACIÓN DE FIREBASE
// ==========================================================================
const firebaseConfig = {
  databaseURL: "https://control-familiar-760ec-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const refTransacciones = db.ref('transacciones');
const refInversiones = db.ref('inversiones');

let transacciones = [];
let inversiones = [];

// ==========================================================================
// ESCUCHAR CAMBIOS EN TIEMPO REAL
// ==========================================================================
refTransacciones.on('value', (snapshot) => {
  const datos = snapshot.val();
  transacciones = datos ? Object.keys(datos).map(id => ({ id, ...datos[id] })) : [];
  actualizarInterfaz();
});

refInversiones.on('value', (snapshot) => {
  const datos = snapshot.val();
  inversiones = datos ? Object.keys(datos).map(id => ({ id, ...datos[id] })) : [];
  actualizarInterfaz();
});

// ==========================================================================
// LÓGICA DE ACTUALIZACIÓN DE INTERFAZ
// ==========================================================================
function actualizarInterfaz() {
  const cuerpoHistorial = document.getElementById("cuerpoHistorial");
  const estadoVacio = document.getElementById("estadoVacio");
  const contadorMovimientos = document.getElementById("contadorMovimientos");
  
  cuerpoHistorial.innerHTML = "";
  
  let incBs = 0, incUsd = 0, gastBs = 0, gastUsd = 0, invBs = 0, invUsd = 0;

  // Procesar Transacciones
  const listaOrdenada = [...transacciones].reverse();
  listaOrdenada.forEach((t) => {
    const m = parseFloat(t.monto) || 0;
    if (t.tipo === 'ingreso') t.moneda === 'Bs' ? incBs += m : incUsd += m;
    else t.moneda === 'Bs' ? gastBs += m : gastUsd += m;

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${t.fecha}</td>
      <td><span class="badge badge--${t.tipo}">${t.tipo}</span></td>
      <td>${t.categoria}</td>
      <td>${t.descripcion || '-'}</td>
      <td><strong>${t.miembro}</strong></td>
      <td class="col-monto">${t.moneda} ${m.toFixed(2)}</td>
      <td><button class="btn-delete" onclick="eliminarTransaccion('${t.id}')">❌</button></td>
    `;
    cuerpoHistorial.appendChild(fila);
  });

  // Procesar Inversiones
  inversiones.forEach((i) => {
    const m = parseFloat(i.montoInversion) || 0;
    i.monedaInversion === 'Bs' ? invBs += m : invUsd += m;
  });

  // Actualizar Dashboard
  document.getElementById("totalIngresos").innerHTML = `${incBs.toFixed(2)} Bs / ${incUsd.toFixed(2)} $`;
  document.getElementById("totalGastos").innerHTML = `${gastBs.toFixed(2)} Bs / ${gastUsd.toFixed(2)} $`;
  document.getElementById("balanceActual").innerHTML = `${(incBs - gastBs - invBs).toFixed(2)} Bs / ${(incUsd - gastUsd - invUsd).toFixed(2)} $`;
  document.getElementById("totalInvertido").innerHTML = `${invBs.toFixed(2)} Bs / ${invUsd.toFixed(2)} $`;
  
  contadorMovimientos.textContent = `${transacciones.length + inversiones.length} registros`;
  estadoVacio.style.display = (transacciones.length + inversiones.length) === 0 ? "block" : "none";
}

// ==========================================================================
// EVENTOS DE FORMULARIOS Y ELIMINACIÓN
// ==========================================================================
document.getElementById("formTransaccion").addEventListener('submit', (e) => {
  e.preventDefault();
  refTransacciones.push({
    fecha: new Date().toLocaleDateString('es-ES'),
    tipo: document.getElementById('tipo').value,
    moneda: document.getElementById('monedaMovimiento').value,
    monto: parseFloat(document.getElementById('monto').value),
    categoria: document.getElementById('categoria').value,
    descripcion: document.getElementById('descripcion').value || '-',
    miembro: document.getElementById('miembro').value
  });
  e.target.reset();
});

document.getElementById("formInversion").addEventListener('submit', (e) => {
  e.preventDefault();
  refInversiones.push({
    fecha: new Date().toLocaleDateString('es-ES'),
    monedaInversion: document.getElementById('monedaInversion').value,
    montoInversion: parseFloat(document.getElementById('montoInversion').value),
    tipoInversion: document.getElementById('tipoInversion').value,
    descripcionInversion: document.getElementById('descripcionInversion').value || '-',
    miembroInversion: document.getElementById('miembroInversion').value
  });
  e.target.reset();
});

window.eliminarTransaccion = (id) => {
  if(confirm("¿Borrar este registro?")) db.ref('transacciones/' + id).remove();
};
