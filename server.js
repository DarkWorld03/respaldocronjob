require("dotenv").config(); // 👈 NECESARIO para leer .env

const express = require("express");
const cors = require("cors");
const guardarDatosDiarios = require("./guardarDatosDiarios");

const app = express();
app.use(cors());

// ========================
// ENDPOINT: /ejecutar-scraper
// Ejecuta el scraper y envía los datos por Telegram
// ========================
app.get("/ejecutar-scraper", async (req, res) => {
  try {
    await guardarDatosDiarios();
    res.send("✅ Scraper ejecutado y datos enviados por Telegram.");
  } catch (error) {
    console.error("❌ Error ejecutando el scraper:", error);
    res.status(500).send("❌ Error ejecutando el scraper.");
  }
});

// ========================
// INICIAR SERVIDOR
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
