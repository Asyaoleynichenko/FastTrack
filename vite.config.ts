import fs from 'node:fs'
import path from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/** GitHub project pages are served from /<repo>/; Vite + router must use the same base. */
function resolveBase(): string {
  const explicit = process.env.VITE_BASE_PATH?.trim()
  if (explicit) {
    let b = explicit
    if (!b.startsWith('/')) b = `/${b}`
    if (!b.endsWith('/')) b = `${b}/`
    return b
  }
  const gh = process.env.GITHUB_REPOSITORY
  if (gh?.includes('/')) {
    return `/${gh.split('/')[1]}/`
  }
  return '/'
}

/** GitHub Pages serves 404.html for unknown paths; copy SPA shell so client routing works on refresh. */
function ghPagesSpaFallback(): import('vite').Plugin {
  return {
    name: 'gh-pages-spa-fallback',
    closeBundle() {
      const dist = path.resolve(__dirname, 'dist')
      const indexHtml = path.join(dist, 'index.html')
      if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, path.join(dist, '404.html'))
      }
    },
  }
}

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  base: resolveBase(),
  plugins: [
    figmaAssetResolver(),
    ghPagesSpaFallback(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
