const fs = require("fs");
const path = require("path");
const scrapeGuildData = require("./scraperGuild");

async function guardarDatosDiarios() {
  const data = await scrapeGuildData();

  if (!data || !data.players || data.players.length === 0) {
    console.error("❌ No se pudo obtener información válida del scraper.");
    return;
  }

  // Fecha actual
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const fecha = `${yyyy}-${mm}-${dd}`;

  const folderPath = path.join(__dirname, "data");
  const filePath = path.join(folderPath, `${fecha}.json`);
  const archivoBaseNombre = "2025-06-14.json"; // último día vieja season
  const filePathBase = path.join(folderPath, archivoBaseNombre);

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  const jugadoresHoy = data.players.map((jugador) => ({
    id: jugador.id,
    name: jugador.name,
    points: Number(jugador.points.replace(/[^0-9]/g, "")),
  }));

  // 1. Si todos tienen 0 puntos hoy, no guardar
  const todosCero = jugadoresHoy.every((j) => j.points === 0);
  if (todosCero) {
    console.log("⚠️ Todos los jugadores tienen 0 puntos. No se guardó archivo.");
    return;
  }

  // 2. Cargar archivo base
  let jugadoresBase = null;
  if (fs.existsSync(filePathBase)) {
    try {
      const rawBase = fs.readFileSync(filePathBase, "utf-8");
      const datosBase = JSON.parse(rawBase);
      jugadoresBase = datosBase.players.map((j) => ({
        id: j.id,
        points: Number(j.points),
      }));
    } catch (err) {
      console.warn("⚠️ Error leyendo archivo base:", err.message);
    }
  } else {
    console.log(`⚠️ Archivo base ${archivoBaseNombre} no encontrado, guardando archivo del día.`);
    guardarArchivo(filePath, fecha, jugadoresHoy);
    return;
  }

  // 3. Ignorar jugadores nuevos o eliminados (comparar solo los comunes)
  const dictBase = {};
  jugadoresBase.forEach((j) => {
    dictBase[j.id] = j.points;
  });

  const jugadoresComunes = jugadoresHoy.filter((j) => dictBase.hasOwnProperty(j.id));

  if (jugadoresComunes.length === 0) {
    console.log("⚠️ No hay jugadores en común con el archivo base. No se guardó archivo.");
    return;
  }

  const todosIgualesBase = jugadoresComunes.every((j) => dictBase[j.id] === j.points);

  if (todosIgualesBase) {
    console.log("ℹ️ Los puntos son iguales al archivo base, temporada no ha comenzado. No se guardó archivo.");
    return;
  }

  // 4. Guardar si hay cambios válidos en jugadores comunes
  guardarArchivo(filePath, fecha, jugadoresHoy);
}

function guardarArchivo(ruta, fecha, jugadores) {
  fs.writeFileSync(
    ruta,
    JSON.stringify({ date: fecha, players: jugadores }, null, 2)
  );
  console.log(`✅ Datos guardados correctamente: ${ruta}`);
}

guardarDatosDiarios();
