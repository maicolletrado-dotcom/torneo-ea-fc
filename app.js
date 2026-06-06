// 1. Pega aquí tu configuración de Firebase
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    databaseURL: "https://TU_PROYECTO-default-rtdb.firebaseio.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
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

        // Crear un ID único para el jugador basado en la fecha
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
            gruposContainer.innerHTML = '<p>El sorteo aún no ha comenzado.</p>';
        }
    });
}