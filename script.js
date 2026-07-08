// 1. CONFIGURACIÓN FIREBASE (LO QUE YA TENÍAS)
const firebaseConfig = {
  databaseURL: "https://control-familiar-760ec-default-rtdb.firebaseio.com/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const refTransacciones = db.ref('transacciones');
const refInversiones = db.ref('inversiones');

let transacciones = [];
let inversiones = [];

// 2. ESCUCHAR LA NUBE (AQUÍ ES DONDE LOS CELULARES SE SINCRONIZAN)
refTransacciones.on('value', (snapshot) => {
  const datos = snapshot.val();
  transacciones = datos ? Object.keys(datos).map(id => ({ id, ...datos[id] })) : [];
  renderizarTodo();
});

refInversiones.on('value', (snapshot) => {
  const datos = snapshot.val();
  inversiones = datos ? Object.keys(datos).map(id => ({ id, ...datos[id] })) : [];
  renderizarTodo();
});

// 3. LÓGICA DE RENDERIZADO (ESTO DIBUJA LA TABLA Y EL DASHBOARD)
function renderizarTodo() {
  const cuerpoHistorial = document.getElementById("cuerpoHistorial");
  cuerpoHistorial.innerHTML = "";
  
  // Unimos todo para mostrar en la tabla
  const todos = [...transacciones.map(t=>({...t, origen:'transacciones'})), ...inversiones.map(i=>({...i, origen:'inversiones'}))];
  
  todos.sort((a,b) => b.fechaRegistro - a.fechaRegistro).forEach(mov => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${mov.fecha}</td>
      <td>${mov.tipo || 'Inversión'}</td>
      <td>${mov.categoria || mov.tipoInversion}</td>
      <td>${mov.descripcion || '-'}</td>
      <td>${mov.miembro}</td>
      <td>${mov.monto} ${mov.moneda}</td>
      <td><button onclick="eliminar('${mov.id}', '${mov.origen}')">❌</button></td>
    `;
    cuerpoHistorial.appendChild(fila);
  });
  
  document.getElementById("contadorMovimientos").textContent = `${todos.length} registros`;
}

// 4. ENVÍO DE DATOS A LA NUBE
document.getElementById("formTransaccion").addEventListener('submit', (e) => {
  e.preventDefault();
  refTransacciones.push({
    tipo: document.getElementById("tipo").value,
    moneda: document.getElementById("monedaMovimiento").value,
    monto: document.getElementById("monto").value,
    categoria: document.getElementById("categoria").value,
    descripcion: document.getElementById("descripcion").value,
    miembro: document.getElementById("miembro").value,
    fecha: new Date().toLocaleDateString(),
    fechaRegistro: Date.now()
  });
  e.target.reset();
});

document.getElementById("formInversion").addEventListener('submit', (e) => {
  e.preventDefault();
  refInversiones.push({
    tipoInversion: document.getElementById("tipoInversion").value,
    moneda: document.getElementById("monedaInversion").value,
    monto: document.getElementById("montoInversion").value,
    descripcion: document.getElementById("descripcionInversion").value,
    miembro: document.getElementById("miembroInversion").value,
    fecha: new Date().toLocaleDateString(),
    fechaRegistro: Date.now()
  });
  e.target.reset();
});

// 5. FUNCIÓN ELIMINAR
window.eliminar = (id, origen) => {
  if(confirm("¿Borrar registro?")) db.ref(origen + '/' + id).remove();
};
