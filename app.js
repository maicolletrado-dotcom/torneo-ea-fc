// 1. Configuración de Firebase (Reemplaza con TUS credenciales)
const firebaseConfig = {
  apiKey: "AIzaSyD5ioipBRwYstM65juLU7qQW4LJVSkAylI",
  authDomain: "torneo-ea-fc-26.firebaseapp.com",
  projectId: "torneo-ea-fc-26",
  storageBucket: "torneo-ea-fc-26.firebasestorage.app",
  messagingSenderId: "1080927146998",
  appId: "1:1080927146998:web:48f2b480f7ce138756add7",
  measurementId: "G-D6EDHSE957"
};

// 2. Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- LÓGICA DEL ADMINISTRADOR (Escribir datos) ---
const sorteoForm = document.getElementById('sorteo-form');
if (sorteoForm) {
    sorteoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const nombre = document.getElementById('nombre').value;
        const equipo = document.getElementById('equipo').value;
        const grupo = document.getElementById('grupo').value;

        // Crear un ID único para el jugador basado en la fecha exacta
        const jugadorId = Date.now();

        // Guardar en la base de datos bajo el nodo del grupo correspondiente
        db.ref('torneo/grupos/' + grupo + '/' + jugadorId).set({
            nombre: nombre,
            equipo: equipo,
            puntos: 0,
            golesFavor: 0,
            golesContra: 0
        }).then(() => {
            alert('¡Jugador asignado correctamente al Grupo ' + grupo + '!');
            sorteoForm.reset();
        }).catch((error) => {
            console.error("Error al guardar: ", error);
            alert("Hubo un error al guardar. Revisa la consola.");
        });
    });
}

// --- LÓGICA DE LA VISTA PÚBLICA (Leer datos en tiempo real) ---
const gruposContainer = document.getElementById('grupos-container');
if (gruposContainer) {
    // Escuchar cambios en el nodo 'torneo/grupos'
    db.ref('torneo/grupos').on('value', (snapshot) => {
        const datos = snapshot.val();
        gruposContainer.innerHTML = ''; // Limpiar contenedor antes de actualizar

        if (datos) {
            // Recorrer los grupos (A, B, C, D, E)
            const letrasGrupos = ['A', 'B', 'C', 'D', 'E'];
            
            letrasGrupos.forEach(letra => {
                const grupoData = datos[letra];
                
                let htmlGrupo = `
                    <div class="tarjeta-grupo">
                        <h3>Grupo ${letra}</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Participante</th>
                                    <th>Selección</th>
                                    <th>Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                if (grupoData) {
                    // Convertir el objeto del grupo en un array para mostrarlo
                    Object.values(grupoData).forEach(jugador => {
                        htmlGrupo += `
                            <tr>
                                <td>${jugador.nombre}</td>
                                <td><strong>${jugador.equipo}</strong></td>
                                <td>${jugador.puntos}</td>
                            </tr>
                        `;
                    });
                } else {
                    htmlGrupo += `<tr><td colspan="3">Esperando sorteo...</td></tr>`;
                }

                htmlGrupo += `
                            </tbody>
                        </table>
                    </div>
                `;
                
                gruposContainer.innerHTML += htmlGrupo;
            });
        } else {
            gruposContainer.innerHTML = '<p>El sorteo aún no ha comenzado. Esperando asignaciones...</p>';
        }
    });
}

// --- LÓGICA PARA REINICIAR LA BASE DE DATOS ---
const btnReset = document.getElementById('btn-reset');
if (btnReset) {
    btnReset.addEventListener('click', () => {
        // Ventana de confirmación doble para evitar accidentes críticos
        const seguro = confirm("¿Estás seguro de que quieres borrar TODOS los datos del torneo?");
        
        if (seguro) {
            const reconfirmar = confirm("Esta acción NO se puede deshacer. ¿Continuar y limpiar la base de datos?");
            if (reconfirmar) {
                // Eliminar el nodo completo de grupos
                db.ref('torneo/grupos').remove()
                    .then(() => {
                        alert("¡Base de datos en cero! Lista para empezar de nuevo.");
                    })
                    .catch((error) => {
                        console.error("Error al borrar los datos: ", error);
                        alert("Error al intentar reiniciar. Revisa la consola.");
                    });
            }
        }
    });
}