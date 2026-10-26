// https://nuxt.com/docs/api/configuration/nuxt-config
// Lue au build : les robots d'aperçu (LinkedIn…) n'exécutent pas le JavaScript d'une SPA.
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ?? ''
const title = 'Radar Partenaires'
const description = 'Outil de prospection pour développeur freelance : veille d\'offres par email, score explicable, assistant sur modèle local. Démo en lecture seule, données fictives.'

export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  ssr: false,
  devtools: { enabled: true },
  app: {
    head: {
      title,
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [
        { name: 'description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: title },
        { property: 'og:title', content: `${title} · outil de prospection pour freelance` },
        { property: 'og:description', content: description },
        { property: 'og:url', content: siteUrl },
        { property: 'og:image', content: `${siteUrl}/og-image.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Radar Partenaires, outil de prospection : démo en lecture seule' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
    },
  },
  css: ['~/assets/css/main.css'],
  // Thème sombre uniquement, sans bascule (clé de stockage dédiée : ignore un ancien choix « clair »).
  colorMode: { preference: 'dark', fallback: 'dark', storageKey: 'radar-color-mode' },
  runtimeConfig: {
    public: { apiBaseUrl: '', demoMode: false },
  },
  compatibilityDate: '2025-07-15',
  vite: {
    server: { allowedHosts: [process.env.DOMAIN ?? 'localhost'] },
  },
  eslint: {
    config: { stylistic: true },
  },
})
