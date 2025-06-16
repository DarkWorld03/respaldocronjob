# Usa una imagen base con Node.js y Chromium
FROM ghcr.io/puppeteer/puppeteer:latest

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia todos los archivos al contenedor
COPY . .

# Instala las dependencias
RUN npm install

# Expone el puerto 3000
EXPOSE 3000

# Comando para iniciar tu app (ajusta si usas otro archivo de entrada)
CMD ["npm", "start"]
