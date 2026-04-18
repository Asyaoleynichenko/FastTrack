import fs from 'node:fs'
import path from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

/**
 * Path prefix for the SPA (no trailing slash), empty string at site root.
 * CI: `VITE_BASE_PATH` from `actions/configure-pages` `base_path` (`""` at root).
 * Fallback: repo segment of `GITHUB_REPOSITORY`, except `*.github.io` user/org sites.
 */
function resolveRouterBasename(): string {
  const fromPages = process.env.VITE_BASE_PATH
  if (fromPages !== undefined) {
    const trimmed = fromPages.trim()
    if (trimmed === '') return ''
    let b = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return b.replace(/\/$/, '') || ''
  }

  const gh = process.env.GITHUB_REPOSITORY
  if (gh?.includes('/')) {
    const repo = gh.split('/')[1] ?? ''
    if (/^.+\.github\.io$/i.test(repo)) return ''
    return `/${repo}`
  }
  return ''
}

/** With `base: './'`, deep URLs ending in `/` would resolve `./assets` under the wrong folder; `<base>` fixes that. */
function injectPagesBaseHref(basenameNoSlash: string): import('vite').Plugin {
  const href = basenameNoSlash ? `${basenameNoSlash}/` : '/'
  return {
    name: 'inject-pages-base-href',
    transformIndexHtml(html) {
      if (/<base\s/i.test(html)) return html
      return html.replace(/<head\s*>/i, `<head>\n    <base href="${href}" />`)
    },
  }
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

export default defineConfig(({ command }) => {
  const isProdBuild = command === 'build'
  const routerBasename = isProdBuild ? resolveRouterBasename() : ''

  return {
    // Dev/preview: `/`. Production: relative asset URLs + `<base href>` so deep routes still load JS/CSS.
    base: isProdBuild ? './' : '/',
    define: {
      __ROUTER_BASENAME__: JSON.stringify(routerBasename),
    },
    plugins: [
      ...(isProdBuild ? [injectPagesBaseHref(routerBasename)] : []),
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
  }
})
