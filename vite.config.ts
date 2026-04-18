import fs from 'node:fs'
import path from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/**
 * Public path for built assets. Must match how GitHub Pages serves the site:
 * - Project site: `https://user.github.io/<repo>/` → base `/<repo>/`
 * - User/org site (`<user>.github.io` repo): root URL → base `/`
 *
 * In CI, `VITE_BASE_PATH` comes from `actions/configure-pages` output `base_path`
 * (empty string at site root). If unset, we infer from `GITHUB_REPOSITORY` except
 * for `*.github.io` repos, which are always root.
 */
function resolveBase(): string {
  const fromPages = process.env.VITE_BASE_PATH
  if (fromPages !== undefined) {
    const trimmed = fromPages.trim()
    if (trimmed === '') return '/'
    let b = trimmed
    if (!b.startsWith('/')) b = `/${b}`
    if (!b.endsWith('/')) b = `${b}/`
    return b
  }

  const gh = process.env.GITHUB_REPOSITORY
  if (gh?.includes('/')) {
    const repo = gh.split('/')[1] ?? ''
    if (/^.+\.github\.io$/i.test(repo)) return '/'
    return `/${repo}/`
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
