// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  ssr: false,
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  // Thème sombre uniquement, sans bascule (clé de stockage dédiée : ignore un ancien choix « clair »).
  colorMode: { preference: 'dark', fallback: 'dark', storageKey: 'radar-color-mode' },
  runtimeConfig: {
    public: { apiBaseUrl: '' },
  },
  compatibilityDate: '2025-07-15',
  vite: {
    server: { allowedHosts: [process.env.DOMAIN ?? 'localhost'] },
  },
  eslint: {
    config: { stylistic: true },
  },
})
