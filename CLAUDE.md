# CLAUDE.md — Radar Partenaires (front)

Contexte métier, domaine, pipeline et conventions : voir `../api/CLAUDE.md` (repo `api`, dossier voisin).

- Nuxt 4, TypeScript, Vue 3 Composition API, ESLint.
- Dev dans Docker (`make up`, `make bash`), jamais de Node local. Commandes npm : `docker exec radarpartners-front npm ...`.
- L'API se consomme via `NUXT_API_BASE_URL` (serveur) et `NUXT_PUBLIC_API_BASE_URL` (navigateur) : ne jamais coder d'URL en dur.
- Code et commits en anglais, commentaires courts. Ne jamais committer sans validation explicite.
- UI : Nuxt UI v4 (Tailwind 4), SPA (`ssr: false`). Types de l'API dans `app/types/api.ts`, libellés dans `app/utils/labels.ts`. Avant de conclure : `npm run lint`, `npm run typecheck` (`nuxt typecheck`), `npm test` (dans le conteneur). Détails : `../api/docs/front.md`.
