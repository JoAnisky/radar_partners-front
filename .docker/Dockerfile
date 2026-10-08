FROM node:22-alpine AS base
WORKDIR /var/www/html
RUN apk add --no-cache bash git

FROM base AS dev
ENV NODE_ENV=development
RUN mkdir -p node_modules .nuxt && chown -R node:node /var/www/html
USER node
CMD ["sh", "-c", "npm install && npx nuxt dev --host 0.0.0.0"]
