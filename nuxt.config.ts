// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: { apiBaseUrl: '' },
  },
  vite: {
    server: { allowedHosts: [process.env.DOMAIN ?? 'localhost'] },
  },
})
