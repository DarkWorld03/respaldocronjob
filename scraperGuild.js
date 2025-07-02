const puppeteer = require("puppeteer");
const fs = require("fs");

async function scrapeGuildData() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Bloquear recursos no esenciales
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "stylesheet", "font", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto("https://axieclassic.com/guilds/mGfOIl8T", {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    try {
      // Ampliamos los timeouts y añadimos control de error
      await page.waitForSelector('a[href^="/profile/"]', { timeout: 60000 });
      await page.waitForSelector("span.text-base.font-semibold", { timeout: 60000 });
    } catch (err) {
      const html = await page.content();
      fs.writeFileSync("error-page.html", html);
      console.error("❌ No se encontró el selector. HTML guardado en error-page.html");
      throw err;
    }

    // Tiempo adicional de espera por si la página carga lento
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const guildData = await page.evaluate(() => {
      const guildName =
        document.querySelector("h2.text-center.text-2xl.font-bold.text-neutral-100")?.innerText ||
        "Nombre no encontrado";

      const players = Array.from(document.querySelectorAll('a[href^="/profile/"]')).map((player, index) => {
        const pointsElements = document.querySelectorAll("span.text-base.font-semibold");
        return {
          name: player.innerText.trim() || "Sin nombre",
          id: player.getAttribute("href")?.replace("/profile/", "") || "ID desconocido",
          points: pointsElements[index]?.innerText.trim() || "0",
        };
      });

      return { guildName, players };
    });

    await browser.close();
    return guildData;
  } catch (error) {
    console.error("❌ Error en `scraperGuild.js`:", error);
    return null;
  }
}

module.exports = scrapeGuildData;


