FROM node:22-alpine AS base
WORKDIR /var/www/html
RUN apk add --no-cache bash git

FROM base AS dev
ENV NODE_ENV=development
RUN mkdir -p node_modules .nuxt && chown -R node:node /var/www/html
USER node
CMD ["sh", "-c", "npm install && npx nuxt dev --host 0.0.0.0 --no-fork"]

FROM base AS test
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx nuxt prepare

FROM base AS build
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM base AS prod
ENV NODE_ENV=production
COPY --from=build --chown=node:node /var/www/html/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
