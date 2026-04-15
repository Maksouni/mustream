# syntax=docker/dockerfile:1
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.mjs ./
ENV MUSIC_DIR=/music
ENV PORT=3000
ENV NAVIDROME_URL=http://navidrome:4533
EXPOSE 3000
CMD ["node", "server.mjs"]
