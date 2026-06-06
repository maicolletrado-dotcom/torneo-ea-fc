// 1. PEGA TUS CREDENCIALES DE FIREBASE AQUÍ
const firebaseConfig = {
  apiKey: "AIzaSyD5ioipBRwYstM65juLU7qQW4LJVSkAylI",
  authDomain: "torneo-ea-fc-26.firebaseapp.com",
  databaseURL: "https://torneo-ea-fc-26-default-rtdb.firebaseio.com",
  projectId: "torneo-ea-fc-26",
  storageBucket: "torneo-ea-fc-26.firebasestorage.app",
  messagingSenderId: "1080927146998",
  appId: "1:1080927146998:web:48f2b480f7ce138756add7",
  measurementId: "G-D6EDHSE957"
};

// 2. Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- TRANSICIÓN DE FASES EN EL PANEL ADMIN ---
const btnIniciarPartidos = document.getElementById('btn-iniciar-partidos');
const seccionSorteo = document.getElementById('seccion-sorteo');
const seccionPartidos = document.getElementById('seccion-partidos');
const tituloFase = document.getElementById('fase-titulo');

if (btnIniciarPartidos) {
    btnIniciarPartidos.addEventListener('click', () => {
        seccionSorteo.style.display = 'none';
        seccionPartidos.style.display = 'block';
        tituloFase.innerText = "Fase: Registro de Partidos";
    });
}

// --- LÓGICA DEL SORTEO (Escribir jugadores con estadísticas en cero) ---
const sorteoForm = document.getElementById('sorteo-form');
if (sorteoForm) {
    sorteoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nombre').value;
        const equipo = document.getElementById('equipo').value;
        const grupo = document.getElementById('grupo').value;
        const jugadorId = Date.now();

        // Se agregan todos los atributos necesarios para la tabla de posiciones
        db.ref('torneo/grupos/' + grupo + '/' + jugadorId).set({
            nombre: nombre,
            equipo: equipo,
            puntos: 0,
            pj: 0, // Partidos Jugados
            pg: 0, // Partidos Ganados
            pe: 0, // Partidos Empatados
            pp: 0, // Partidos Perdidos
            gf: 0, // Goles a Favor
            gc: 0, // Goles en Contra
            dg: 0  // Diferencia de Gol
        }).then(() => {
            alert('¡Jugador asignado correctamente al Grupo ' + grupo + '!');
            sorteoForm.reset();
        }).catch(error => console.error("Error:", error));
    });
}

// --- LÓGICA DE PARTIDOS: Llenar los selectores de equipos ---
const selectEquipoA = document.getElementById('equipo-a');
const selectEquipoB = document.getElementById('equipo-b');

if (selectEquipoA && selectEquipoB) {
    db.ref('torneo/grupos').on('value', (snapshot) => {
        const datos = snapshot.val();
        let optionsHTML = '<option value="">Selecciona un participante...</option>';
        
        if (datos) {
            Object.keys(datos).forEach(grupo => {
                Object.keys(datos[grupo]).forEach(id => {
                    const jugador = datos[grupo][id];
                    // El "value" guarda la ruta exacta en la base de datos (Ej: A/12345678)
                    optionsHTML += `<option value="${grupo}/${id}">[Grupo ${grupo}] ${jugador.nombre} (${jugador.equipo})</option>`;
                });
            });
        }
        selectEquipoA.innerHTML = optionsHTML;
        selectEquipoB.innerHTML = optionsHTML;
    });
}

// --- LÓGICA DE PARTIDOS: Calcular y Guardar Resultados ---
const resultadoForm = document.getElementById('resultado-form');
if (resultadoForm) {
    resultadoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rutaA = document.getElementById('equipo-a').value;
        const rutaB = document.getElementById('equipo-b').value;
        const golesA = parseInt(document.getElementById('goles-a').value);
        const golesB = parseInt(document.getElementById('goles-b').value);

        if (rutaA === rutaB) {
            alert("Selecciona dos participantes diferentes.");
            return;
        }

        // Función para actualizar las matemáticas de un jugador
        const actualizarStats = (ruta, golesFavor, golesContra) => {
            db.ref(`torneo/grupos/${ruta}`).once('value').then(snapshot => {
                let j = snapshot.val();
                j.pj += 1;
                j.gf += golesFavor;
                j.gc += golesContra;
                j.dg = j.gf - j.gc;

                if (golesFavor > golesContra) { 
                    j.pg += 1; j.puntos += 3; 
                } else if (golesFavor === golesContra) { 
                    j.pe += 1; j.puntos += 1; 
                } else { 
                    j.pp += 1; 
                }

                db.ref(`torneo/grupos/${ruta}`).update(j);
            });
        };

        // Se envían los datos cruzados para actualizar a ambos jugadores
        actualizarStats(rutaA, golesA, golesB);
        actualizarStats(rutaB, golesB, golesA);

        alert("¡Resultado guardado! La tabla se actualizó automáticamente.");
        document.getElementById('goles-a').value = '';
        document.getElementById('goles-b').value = '';
        document.getElementById('equipo-a').value = '';
        document.getElementById('equipo-b').value = '';
    });
}

// --- LÓGICA DE LA VISTA PÚBLICA (Leer datos y ordenar tabla) ---
const gruposContainer = document.getElementById('grupos-container');
if (gruposContainer) {
    db.ref('torneo/grupos').on('value', (snapshot) => {
        const datos = snapshot.val();
        gruposContainer.innerHTML = ''; 

        if (datos) {
            const letrasGrupos = ['A', 'B', 'C', 'D', 'E'];
            
            letrasGrupos.forEach(letra => {
                const grupoData = datos[letra];
                let htmlGrupo = `
                    <div class="tarjeta-grupo">
                        <h3>Grupo ${letra}</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Equipo</th>
                                    <th>PJ</th>
                                    <th>GF</th>
                                    <th>DG</th>
                                    <th>Pts</th>
                                </tr>
                            </thead>
                            <tbody>
                `;

                if (grupoData) {
                    // Ordenar por Puntos, luego por DG, luego por GF (Criterios del reglamento)
                    const jugadoresOrdenados = Object.values(grupoData).sort((a, b) => {
                        if (b.puntos !== a.puntos) return b.puntos - a.puntos;
                        if (b.dg !== a.dg) return b.dg - a.dg;
                        return b.gf - a.gf;
                    });

                    jugadoresOrdenados.forEach(jugador => {
                        htmlGrupo += `
                            <tr>
                                <td><strong>${jugador.equipo}</strong> <br><small style="color:#aaa;">${jugador.nombre}</small></td>
                                <td>${jugador.pj}</td>
                                <td>${jugador.gf}</td>
                                <td>${jugador.dg}</td>
                                <td style="font-weight:bold; color:var(--gold-accent);">${jugador.puntos}</td>
                            </tr>
                        `;
                    });
                } else {
                    htmlGrupo += `<tr><td colspan="5" style="text-align:center;">Esperando sorteo...</td></tr>`;
                }

                htmlGrupo += `</tbody></table></div>`;
                gruposContainer.innerHTML += htmlGrupo;
            });
        } else {
            gruposContainer.innerHTML = '<p>El torneo aún no ha comenzado.</p>';
        }
    });
}

// --- REINICIO DE BASE DE DATOS ---
const btnReset = document.getElementById('btn-reset');
if (btnReset) {
    btnReset.addEventListener('click', () => {
        if (confirm("¿Borrar TODOS los datos del torneo?")) {
            if (confirm("Acción irreversible. ¿Continuar?")) {
                db.ref('torneo/grupos').remove().then(() => {
                    alert("Base de datos limpia.");
                    location.reload(); // Recarga la página para reiniciar la interfaz
                });
            }
        }
    });
}