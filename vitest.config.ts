import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// L'entrée virtuelle de @nuxt/test-utils est vue par Vite comme `/node_modules/...` (racine du disque) :
// ses imports relatifs sont donc résolus depuis le projet pour qu'ils trouvent les fichiers de Nuxt.
const resolveNuxtEntryImports = {
  name: 'resolve-nuxt-entry-imports',
  enforce: 'pre' as const,
  resolveId(id: string, importer?: string) {
    if (id.startsWith('.') && importer?.startsWith('/node_modules/nuxt/dist/app/')) {
      return resolve(rootDir, `.${dirname(importer)}`, id)
    }
  },
}

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        plugins: [resolveNuxtEntryImports],
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.test.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: { rootDir, domEnvironment: 'happy-dom' },
          },
        },
      }),
    ],
  },
})
