# Utilisation de Node.js 18 Alpine (léger)
FROM node:18-alpine

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    postgresql-client \
    python3 \
    make \
    g++

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY client/package*.json ./client/

# Installer les dépendances backend (production only, sans warnings)
RUN npm ci --omit=dev --quiet

# Installer les dépendances frontend
RUN cd client && npm ci --quiet

# Copier tout le code source
COPY . .

# Build le frontend pour la production (sans logs verbeux)
RUN cd client && npm run build --quiet

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Changer le propriétaire des fichiers
RUN chown -R nodejs:nodejs /app

# Utiliser l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1

# Commande de démarrage
CMD ["node", "server/index.js"]
