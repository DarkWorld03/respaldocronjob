# Usamos una imagen ligera de Node.js
FROM node:18-slim

# Instalamos Chromium para Puppeteer
RUN apt-get update && \
    apt-get install -y chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos todos los archivos del proyecto al contenedor
COPY . .

# Instalamos dependencias
RUN npm install

# Configuramos variable para que Puppeteer use Chromium instalado
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Ambiente de producción (opcional)
ENV NODE_ENV=production

# Comando para iniciar la app
CMD ["node", "server.js"]
