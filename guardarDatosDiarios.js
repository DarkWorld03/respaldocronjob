require("dotenv").config();
const fs = require("fs");
const path = require("path");
const scrapeGuildData = require("./scraperGuild");
const axios = require("axios");
const FormData = require("form-data");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function enviarArchivoTelegram(filePath) {
  const form = new FormData();
  form.append("chat_id", CHAT_ID);
  form.append("document", fs.createReadStream(filePath));

  try {
    const res = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, form, {
      headers: form.getHeaders(),
    });
    console.log("✅ Archivo enviado por Telegram correctamente.");
  } catch (err) {
    console.error("❌ Error enviando archivo por Telegram:", err.message);
  }
}

async function guardarDatosDiarios() {
  console.log("🔄 Ejecutando guardarDatosDiarios...");

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

  // Formatear jugadores
  const players = data.players.map(jugador => ({
    id: jugador.id,
    name: jugador.name,
    points: Number(jugador.points.toString().replace(/[^0-9]/g, "")) || 0,
  }));

  const mensaje = {
    date: fecha,
    players
  };

  // Crear carpeta data si no existe
  const folderPath = path.join(__dirname, "data");
  if (!fs.existsSync(folderPath)) {
    console.log("📂 Carpeta 'data' no existe, creando...");
    try {
      fs.mkdirSync(folderPath);
      console.log("✅ Carpeta 'data' creada.");
    } catch (err) {
      console.error("❌ Error creando carpeta 'data':", err.message);
      return;
    }
  }

  // Guardar archivo JSON
  const filePath = path.join(folderPath, `${fecha}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(mensaje, null, 2));
    console.log(`✅ Archivo guardado correctamente: ${filePath}`);
  } catch (err) {
    console.error("❌ Error guardando archivo JSON:", err.message);
    return;
  }

  // Enviar archivo JSON por Telegram
  await enviarArchivoTelegram(filePath);
}

// Ejecutar la función si se corre este archivo directamente
if (require.main === module) {
  guardarDatosDiarios().then(() => {
    console.log("🔚 Ejecución finalizada.");
  }).catch(err => {
    console.error("❌ Error inesperado:", err);
  });
}

module.exports = guardarDatosDiarios;
