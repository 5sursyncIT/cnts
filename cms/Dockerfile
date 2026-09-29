# CMS Strapi du portail (contenu éditorial) — servi sous https://cnts.gouv.sn/cms
FROM node:20-slim AS build
WORKDIR /opt/app
ENV NODE_OPTIONS=--no-network-family-autoselection
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# L'URL publique est figée dans le panneau d'administration au moment du build.
ARG PUBLIC_URL=https://cnts.gouv.sn/cms
ENV PUBLIC_URL=${PUBLIC_URL} NODE_ENV=production
RUN npm run build && npm prune --omit=dev

FROM node:20-slim
WORKDIR /opt/app
ENV NODE_ENV=production
COPY --from=build /opt/app ./
RUN mkdir -p public/uploads && chown -R node:node public/uploads
USER node
EXPOSE 1337
CMD ["npm", "run", "start"]
