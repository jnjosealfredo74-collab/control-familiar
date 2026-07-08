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

  // Unimos ambos arrays para la tabla
  const lista = [
    ...transacciones.map(t => ({ ...t, origen: 'transacciones' })),
    ...inversiones.map(i => ({ ...i, origen: 'inversiones' }))
  ];

  // Ordenar por fecha (asumiendo que Firebase guarda los IDs en orden, o simplemente ordenar)
  lista.reverse().forEach((item) => {
    const esInversion = item.origen === 'inversiones';
    const m = parseFloat(esInversion ? item.montoInversion : item.monto) || 0;
    const mon = esInversion ? item.monedaInversion : item.moneda;
    const tipo = esInversion ? 'Inversión' : item.tipo;
    const cat = esInversion ? item.tipoInversion : item.categoria;
    const desc = esInversion ? item.descripcionInversion : item.descripcion;
    const miembro = esInversion ? item.miembroInversion : item.miembro;

    // Sumar totales
    if (!esInversion) {
      if (item.tipo === 'ingreso') mon === 'Bs' ? incBs += m : incUsd += m;
      else mon === 'Bs' ? gastBs += m : gastUsd += m;
    } else {
      mon === 'Bs' ? invBs += m : invUsd += m;
    }

    // Dibujar fila
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${item.fecha}</td>
      <td><span class="badge">${tipo}</span></td>
      <td>${cat}</td>
      <td>${desc || '-'}</td>
      <td><strong>${miembro}</strong></td>
      <td class="col-monto">${mon} ${m.toFixed(2)}</td>
      <td><button class="btn-delete" onclick="eliminar('${item.id}', '${item.origen}')">❌</button></td>
    `;
    cuerpoHistorial.appendChild(fila);
  });

  // Actualizar Dashboard
  document.getElementById("totalIngresos").innerHTML = `${incBs.toFixed(2)} Bs / ${incUsd.toFixed(2)} $`;
  document.getElementById("totalGastos").innerHTML = `${gastBs.toFixed(2)} Bs / ${gastUsd.toFixed(2)} $`;
  document.getElementById("balanceActual").innerHTML = `${(incBs - gastBs - invBs).toFixed(2)} Bs / ${(incUsd - gastUsd - invUsd).toFixed(2)} $`;
  document.getElementById("totalInvertido").innerHTML = `${invBs.toFixed(2)} Bs / ${invUsd.toFixed(2)} $`;
  
  contadorMovimientos.textContent = `${lista.length} registros`;
  estadoVacio.style.display = lista.length === 0 ? "block" : "none";
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

window.eliminar = (id, origen) => {
  if (confirm("¿Seguro que quieres borrar este registro?")) {
    db.ref(origen + '/' + id).remove();
  }
};
