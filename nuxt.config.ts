// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  ssr: false,
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
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
