# Radar Partenaires — Front

Nuxt 4 / Vue 3 (Composition API) / TypeScript. Dashboard de l'outil de prospection ; l'API Symfony est dans le repo `api`.

## Dev

Tout tourne dans Docker, derrière Traefik (réseau externe `web`).

```bash
cp .env.example .env   # puis adapter
make up                # http://radarpartners.dev.local
make logs
make bash
```

Variables (`.env`) : `DOMAIN`, `NUXT_PUBLIC_SITE_URL`, `NUXT_API_BASE_URL` (appels serveur, `http://radarpartners-api`), `NUXT_PUBLIC_API_BASE_URL` (appels navigateur).

Entrée `radarpartners.dev.local` à ajouter au fichier hosts.
