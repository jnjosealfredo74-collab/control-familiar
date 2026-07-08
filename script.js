// Configuración de la Nube (Firebase)
const firebaseConfig = {
  databaseURL: "https://control-familiar-760ec-default-rtdb.firebaseio.com/"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const refTransacciones = db.ref('transacciones');
const refInversiones = db.ref('inversiones');

let transacciones = [];
let inversiones = [];

// Escuchar cambios en tiempo real
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

// Funciones para guardar
function agregarTransaccion(nueva) { refTransacciones.push(nueva); }
function agregarInversion(nueva) { refInversiones.push(nueva); }
function eliminarRegistro(id, tipo) { db.ref(tipo + '/' + id).remove(); }

// ... [Aquí mantienes tus funciones de renderizarTodo, calcularTotales y el exportador de Excel que ya tenías] ...
// NOTA: Solo asegúrate de que los formularios llamen a "agregarTransaccion" y "agregarInversion" en lugar de "guardarTransacciones"
