// Función para cambiar de sección
function mostrarSeccion(seccionId) {
    document.querySelectorAll('.seccion').forEach(seccion => {
        seccion.classList.remove('activa');
    });
    document.getElementById(seccionId).classList.add('activa');

    // Resaltar el botón activo
    document.querySelectorAll("nav button").forEach(button => {
        button.classList.remove("activo");
    });
    document.querySelector(`button[onclick="mostrarSeccion('${seccionId}')"]`).classList.add("activo");
}

// Función para mostrar diferencia de puntos (con colores rojo/verde)
function mostrarDiferencia(actual, arriba, abajo) {
    const difArriba = arriba !== null ? actual - arriba : null;
    const difAbajo = abajo !== null ? actual - abajo : null;
    return `
        <div style="color: #e63946; font-size: 14px; line-height: 1.2;">
            ${difArriba !== null ? (difArriba >= 0 ? "+" : "") + difArriba : "-"}
        </div>
        <div style="color: #06d6a0; font-size: 14px; line-height: 1.2;">
            ${difAbajo !== null ? (difAbajo >= 0 ? "+" : "") + difAbajo : "-"}
        </div>
    `;
}

// Variables globales para guilds y guild principal
let guildsGlobal = [];
window.mainGuildName = "";

// Cargar datos de todas las guilds y tabla global
function cargarDatosGuilds() {
    fetch("https://axie-guild-data.onrender.com/guilds")
        .then(response => response.json())
        .then(data => {
            const guildsTable = document.getElementById("guildsTable");
            guildsTable.innerHTML = "";

            if (!data || data.length === 0) {
                const noDataRow = document.createElement("tr");
                noDataRow.innerHTML = `<td colspan="4">No hay datos disponibles</td>`;
                guildsTable.appendChild(noDataRow);
                return;
            }

            const guilds = data.map(g => ({
                ...g,
                numericPoints: parseInt(g.points.replace(/,/g, "")) || 0
            })).sort((a, b) => b.numericPoints - a.numericPoints);

            guildsGlobal = guilds;

            guilds.forEach((guild, index) => {
                const arriba = index > 0 ? guilds[index - 1].numericPoints : null;
                const abajo = index < guilds.length - 1 ? guilds[index + 1].numericPoints : null;

                const tr = document.createElement("tr");
                tr.style.height = "60px";

                tr.innerHTML = `
                    <td style="text-align: center;">${index + 1}</td>
                    <td>
                        <div class="flex-name-img">
                            <img src="${guild.logo}" alt="${guild.name}" width="50" height="50" loading="lazy" style="max-height: 50px;">
                            <a href="${guild.url}" target="_blank" rel="noopener noreferrer">${guild.name}</a>
                        </div>
                    </td>
                    <td style="text-align: center; font-weight: bold;">${guild.points}</td>
                    <td style="text-align: center;">${mostrarDiferencia(guild.numericPoints, arriba, abajo)}</td>
                `;

                guildsTable.appendChild(tr);
            });

            if (window.mainGuildName) {
                actualizarTopGuild(window.mainGuildName);
            }
        })
        .catch(error => console.error("❌ Error obteniendo datos de todas las guilds:", error));
}

// Cargar datos de jugadores y encabezado de la guild
function cargarDatosJugadores() {
    fetch("https://axie-guild-data.onrender.com/guild-data")
        .then(response => response.json())
        .then(data => {
            document.getElementById("guildName").innerText = data.guildName || "Nombre Desconocido";
            document.getElementById("guildLogo").src = "https://cdn.skymavis.com/mavisx/dlc-central/remote-config/classic-m/custom-guild-avatar/mGfOIl8T.png";
            window.mainGuildName = data.guildName;

            if (guildsGlobal.length > 0) {
                actualizarTopGuild(data.guildName);
            }

            const playersTable = document.getElementById("playersTable");
            playersTable.innerHTML = "";

            const players = data.players.map(p => ({
                ...p,
                numericPoints: parseInt(p.points.replace(/,/g, "")) || 0
            }));

            players.forEach((player, index) => {
                const arriba = index > 0 ? players[index - 1].numericPoints : null;
                const abajo = index < players.length - 1 ? players[index + 1].numericPoints : null;

                const row = document.createElement("tr");
                row.style.height = "60px";

                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>
                        <div class="flex-name-img">
                            <a href="https://axieclassic.com/profile/${player.id}" target="_blank" rel="noopener noreferrer">${player.name}</a>
                        </div>
                    </td>
                    <td class="points">${player.points}</td>
                    <td>${mostrarDiferencia(player.numericPoints, arriba, abajo)}</td>
                `;

                playersTable.appendChild(row);
            });
        })
        .catch(error => console.error("❌ Error al obtener los datos:", error));
}

// Función para mostrar el Top de la guild principal
function actualizarTopGuild(guildName) {
    const index = guildsGlobal.findIndex(g => g.name === guildName);
    document.getElementById("guildRank").innerText =
        index !== -1 ? `Top #${index + 1}` : "Ranking no disponible";
}

// Función para formatear número con coma cada 3 dígitos
function formatearNumero(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Función para cargar y mostrar datos históricos en la tabla 'puntos'
async function cargarDatosHistoricos() {
    const thead = document.getElementById("historicoThead");
    const tbody = document.getElementById("historicoTbody");

    thead.innerHTML = "";
    tbody.innerHTML = "";

    try {
        const res = await fetch("https://axie-guild-data.onrender.com/guild-data-historico");
        if (!res.ok) throw new Error("Error al obtener datos históricos");
        const data = await res.json();

        const { dias, jugadores } = data;

        if (dias.length === 0 || jugadores.length === 0) {
            thead.innerHTML = `<tr><th colspan="${dias.length + 4}">No hay datos históricos disponibles</th></tr>`;
            return;
        }

        const trHead = document.createElement("tr");
        trHead.innerHTML = `
            <th>Nombre</th>
            <th>Total</th>
            <th>Promedio</th>
            ${dias.map(dia => `<th>${dia}</th>`).join("")}
        `;
        thead.appendChild(trHead);

        jugadores.forEach(j => {
            const tr = document.createElement("tr");

            // Color para promedio según el valor
            const colorPromedio = j.promedio <= 15 ? "#e63946" : "#06d6a0";

            tr.innerHTML = `
                <td><a href="https://axieclassic.com/profile/${j.id}" target="_blank" rel="noopener noreferrer" style="color: #4ab3ff;">${j.name}</a></td>
                <td style="font-weight:bold; text-align:center; color:#1db954;">${formatearNumero(j.total)}</td>
                <td style="text-align:center; color:${colorPromedio};">${formatearNumero(j.promedio)}</td>
                ${j.puntosDiarios.map(puntosDia => `<td style="text-align:center;">${formatearNumero(puntosDia)}</td>`).join("")}
            `;

            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("❌ Error cargando datos históricos:", error);
        thead.innerHTML = `<tr><th colspan="4">Error al cargar datos históricos</th></tr>`;
    }
}

// Función para mostrar sección y cargar datos si es la pestaña puntos
function onMostrarSeccion(seccionId) {
    mostrarSeccion(seccionId);
    if (seccionId === "puntos") {
        cargarDatosHistoricos();
    }
}

// Cambiar eventos onclick de los botones para usar onMostrarSeccion
document.querySelectorAll("nav button").forEach(button => {
    const seccionId = button.getAttribute("onclick").match(/'(.*)'/)[1];
    button.onclick = () => onMostrarSeccion(seccionId);
});

// Mostrar por defecto la sección "nikeladim" y cargar sus datos
mostrarSeccion("nikeladim");
cargarDatosJugadores();

// Cargar la lista de guilds al cargar la página
document.addEventListener("DOMContentLoaded", cargarDatosGuilds);

// ✅ EXPORTAR TABLA HISTÓRICA A EXCEL Y PDF
function exportarExcel() {
    const tabla = document.getElementById("guildDataTable") || document.getElementById("historicoTbody").parentElement;
    const wb = XLSX.utils.table_to_book(tabla, { sheet: "Guild Data" });
    XLSX.writeFile(wb, "guild-data.xlsx");
}

function exportarPDF() {
    const doc = new jspdf.jsPDF('landscape');
    doc.setFontSize(14);
    doc.text("Guild Data", 14, 15);

    const tabla = document.getElementById("guildDataTable") || document.getElementById("historicoTbody").parentElement;
    const filas = Array.from(tabla.querySelectorAll("tr")).map(row =>
        Array.from(row.querySelectorAll("th, td")).map(cell => cell.innerText.trim())
    );

    const cabecera = filas.shift();
    doc.autoTable({
        head: [cabecera],
        body: filas,
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8 }
    });

    doc.save("guild-data.pdf");
}

