const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const scrapeGuildData = require("./scraperGuild");
const scrapeAllGuilds = require("./scraperAllGuilds");
const guardarDatosDiarios = require("./guardarDatosDiarios");

const app = express();
app.use(cors());

// Endpoint para tu guild específica
app.get("/guild-data", async (req, res) => {
    try {
        const data = await scrapeGuildData();
        if (!data || !data.players.length) {
            throw new Error("❌ No se encontraron datos de la guild.");
        }
        console.log("✅ Datos enviados al cliente:", JSON.stringify(data, null, 2));
        res.json(data);
    } catch (error) {
        console.error("❌ Error en el servidor (/guild-data):", error);
        res.status(500).json({ error: "Error interno al recuperar datos." });
    }
});

// Endpoint para todas las guilds
app.get("/guilds", async (req, res) => {
    try {
        console.log("🔍 Procesando solicitud a /guilds...");
        const data = await scrapeAllGuilds();

        if (!data || data.length === 0) {
            console.error("❌ No se encontraron guilds en scrapeAllGuilds.");
            return res.status(500).json({ error: "No se encontraron guilds." });
        }

        console.log("✅ Datos de todas las guilds enviados correctamente.");
        res.json(data);
    } catch (error) {
        console.error("❌ Error en el servidor (/guilds):", error);
        res.status(500).json({ error: "Error interno al recuperar datos de todas las guilds." });
    }
});

// Endpoint para ejecutar manualmente el guardado diario
app.get("/ejecutar-scraper", async (req, res) => {
    try {
        await guardarDatosDiarios();
        res.send("✅ Scraper ejecutado correctamente.");
    } catch (error) {
        console.error("❌ Error ejecutando el scraper diario:", error);
        res.status(500).send("❌ Error ejecutando el scraper.");
    }
});

// Función para procesar el historial de puntos por día
function procesarGuildData() {
    const dataFolder = path.join(__dirname, "data");

    if (!fs.existsSync(dataFolder)) {
        return { dias: [], jugadores: [] };
    }

    const archivos = fs.readdirSync(dataFolder)
        .filter(f => f.endsWith(".json") && f !== "2025-06-14.json") // Ignorar base vieja
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

    // Rellenar vacíos con el último valor conocido
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

// Endpoint para consultar los datos históricos
app.get("/guild-data-historico", (req, res) => {
    try {
        const data = procesarGuildData();
        res.json(data);
    } catch (error) {
        console.error("❌ Error procesando datos históricos:", error);
        res.status(500).json({ error: "Error procesando datos históricos." });
    }
});

// Puerto que usará Render o localmente 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
