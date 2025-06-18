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
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  const filePath = path.join(folderPath, `${fecha}.json`);

  // Obtener todos los archivos JSON en data y ordenarlos de más reciente a más antiguo
  const archivos = fs.readdirSync(folderPath).filter(f => f.endsWith(".json")).sort((a, b) => b.localeCompare(a));

  // Función para extraer jugadores con id y puntos numéricos desde un objeto data
  const formatearJugadores = (players) => players.map(jugador => ({
    id: jugador.id,
    name: jugador.name,
    points: Number(jugador.points.toString().replace(/[^0-9]/g, "")) || 0,
  }));

  const jugadoresHoy = formatearJugadores(data.players);

  // 1. Si todos tienen 0 puntos hoy, no guardar
  const todosCero = jugadoresHoy.every(j => j.points === 0);
  if (todosCero) {
    console.log("⚠️ Todos los jugadores tienen 0 puntos. No se guardó archivo.");
    return;
  }

  // Leer archivo base fijo (opcional)
  const archivoBaseNombre = "2025-06-14.json"; // si quieres quitar esta comparación, comenta las líneas que la usan
  const filePathBase = path.join(folderPath, archivoBaseNombre);
  let jugadoresBase = null;

  if (fs.existsSync(filePathBase)) {
    try {
      const rawBase = fs.readFileSync(filePathBase, "utf-8");
      const datosBase = JSON.parse(rawBase);
      jugadoresBase = formatearJugadores(datosBase.players);
    } catch (err) {
      console.warn("⚠️ Error leyendo archivo base:", err.message);
    }
  }

  // Leer el archivo más reciente, si existe
  let jugadoresUltimoArchivo = null;
  if (archivos.length > 0) {
    try {
      const rawUltimo = fs.readFileSync(path.join(folderPath, archivos[0]), "utf-8");
      const datosUltimo = JSON.parse(rawUltimo);
      jugadoresUltimoArchivo = formatearJugadores(datosUltimo.players);
    } catch (err) {
      console.warn("⚠️ Error leyendo último archivo:", err.message);
    }
  }

  // Función para comparar arrays de jugadores (solo jugadores comunes)
  const jugadoresComunesEntre = (base, nuevo) => {
    const dictBase = {};
    base.forEach(j => { dictBase[j.id] = j.points; });

    return nuevo.filter(j => dictBase.hasOwnProperty(j.id));
  };

  const todosIguales = (base, nuevo) => {
    const dictBase = {};
    base.forEach(j => { dictBase[j.id] = j.points; });

    return nuevo.every(j => dictBase[j.id] === j.points);
  };

  // Comparar con archivo base fijo (si existe)
  if (jugadoresBase) {
    const comunesBase = jugadoresComunesEntre(jugadoresBase, jugadoresHoy);
    if (comunesBase.length === 0) {
      console.log("⚠️ No hay jugadores en común con el archivo base. No se guardó archivo.");
      return;
    }
    if (todosIguales(jugadoresBase, comunesBase)) {
      console.log("ℹ️ Los puntos son iguales al archivo base, temporada no ha comenzado. No se guardó archivo.");
      return;
    }
  }

  // Comparar con último archivo guardado (si existe)
  if (jugadoresUltimoArchivo) {
    const comunesUltimo = jugadoresComunesEntre(jugadoresUltimoArchivo, jugadoresHoy);
    if (comunesUltimo.length === 0) {
      console.log("⚠️ No hay jugadores en común con el último archivo guardado. No se guardó archivo.");
      return;
    }
    if (todosIguales(jugadoresUltimoArchivo, comunesUltimo)) {
      console.log("ℹ️ Los puntos son iguales al último archivo guardado. No se guardó archivo.");
      return;
    }
  }

  // Guardar archivo
  guardarArchivo(filePath, fecha, jugadoresHoy);
}

function guardarArchivo(ruta, fecha, jugadores) {
  fs.writeFileSync(
    ruta,
    JSON.stringify({ date: fecha, players: jugadores }, null, 2)
  );
  console.log(`✅ Datos guardados correctamente: ${ruta}`);
}

module.exports = guardarDatosDiarios;
