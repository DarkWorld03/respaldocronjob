const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const scrapeGuildData = require("./scraperGuild");
const scrapeAllGuilds = require("./scraperAllGuilds");
const guardarDatosDiarios = require("./guardarDatosDiarios");

const app = express();
app.use(cors());

// ========================
// Función: actualizar archivo latest.json
// ========================
function guardarLatest(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✅ Archivo actualizado: ${filePath}`);
}

// ========================
// ENDPOINT: /guild-data
// ========================
app.get("/guild-data", async (req, res) => {
  const latestPath = path.join(__dirname, "guild", "latest.json");

  // 1. Leer datos guardados
  if (fs.existsSync(latestPath)) {
    try {
      const json = fs.readFileSync(latestPath, "utf-8");
      res.json(JSON.parse(json));
    } catch (err) {
      console.warn("⚠️ Error leyendo latest.json de guild:", err.message);
      res.status(500).json({ error: "Error leyendo datos locales." });
    }
  } else {
    res.status(503).json({ error: "Datos no disponibles aún." });
  }

  // 2. Ejecutar scraper en segundo plano para actualizar latest
  try {
    const datos = await scrapeGuildData();
    if (datos?.players?.length) {
      guardarLatest(latestPath, datos);
    }
  } catch (err) {
    console.error("❌ Error actualizando guild-data en segundo plano:", err.message);
  }
});

// ========================
// ENDPOINT: /guilds
// ========================
app.get("/guilds", async (req, res) => {
  const latestPath = path.join(__dirname, "allguilds", "latest.json");

  // 1. Responder con datos guardados
  if (fs.existsSync(latestPath)) {
    try {
      const json = fs.readFileSync(latestPath, "utf-8");
      res.json(JSON.parse(json));
    } catch (err) {
      console.warn("⚠️ Error leyendo latest.json de allguilds:", err.message);
      res.status(500).json({ error: "Error leyendo datos locales." });
    }
  } else {
    res.status(503).json({ error: "Datos no disponibles aún." });
  }

  // 2. Ejecutar scraper en segundo plano para actualizar latest
  try {
    const datos = await scrapeAllGuilds();
    if (datos?.length) {
      guardarLatest(latestPath, datos);
    }
  } catch (err) {
    console.error("❌ Error actualizando guilds en segundo plano:", err.message);
  }
});

// ========================
// ENDPOINT: /ejecutar-scraper (guardarDatosDiarios)
// ========================
app.get("/ejecutar-scraper", async (req, res) => {
  try {
    await guardarDatosDiarios();
    res.send("✅ Scraper ejecutado correctamente.");
  } catch (error) {
    console.error("❌ Error ejecutando el scraper diario:", error);
    res.status(500).send("❌ Error ejecutando el scraper.");
  }
});

// ========================
// Función: procesar datos históricos
// ========================
function procesarGuildData() {
  const dataFolder = path.join(__dirname, "data");

  if (!fs.existsSync(dataFolder)) {
    return { dias: [], jugadores: [] };
  }

  const archivos = fs.readdirSync(dataFolder)
    .filter(f => f.endsWith(".json") && f !== "2025-06-14.json")
    .sort();

  if (archivos.length === 0) return { dias: [], jugadores: [] };

  const dias = archivos.map(f => f.replace(".json", ""));
  const historico = {};

  archivos.forEach((file, fileIndex) => {
    const contenido = JSON.parse(fs.readFileSync(path.join(dataFolder, file), "utf-8"));

    contenido.players.forEach(p => {
      if (!historico[p.id]) {
        historico[p.id] = {
          id: p.id,
          name: p.name,
          puntos: []
        };
      }
      const puntos = typeof p.points === "string"
        ? parseInt(p.points.replace(/,/g, ""), 10) || 0
        : Number(p.points) || 0;
      historico[p.id].puntos[fileIndex] = puntos;
    });
  });

  // Rellenar vacíos
  for (const jugador of Object.values(historico)) {
    for (let i = 0; i < dias.length; i++) {
      if (jugador.puntos[i] === undefined) {
        jugador.puntos[i] = i === 0 ? 0 : jugador.puntos[i - 1];
      }
    }
  }

  const jugadores = Object.values(historico).map(j => {
    const total = j.puntos.at(-1);
    const promedio = j.puntos.length ? Math.round(total / j.puntos.length) : 0;
    const puntosDiarios = j.puntos.map((val, i, arr) => i === 0 ? val : val - arr[i - 1]);

    return {
      id: j.id,
      name: j.name,
      total,
      promedio,
      puntosDiarios
    };
  });

  return {
    dias,
    jugadores
  };
}

// ========================
// ENDPOINT: /guild-data-historico
// ========================
app.get("/guild-data-historico", (req, res) => {
  try {
    const data = procesarGuildData();
    res.json(data);
  } catch (error) {
    console.error("❌ Error procesando datos históricos:", error);
    res.status(500).json({ error: "Error procesando datos históricos." });
  }
});

// ========================
// INICIAR SERVIDOR
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
