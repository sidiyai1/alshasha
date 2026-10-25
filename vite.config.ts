import { cpSync, createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import type { Connect, Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const hosting = JSON.parse(readFileSync(new URL('./firebase.json', import.meta.url), 'utf8')) as {
  hosting: { headers: { source: string; headers: { key: string; value: string }[] }[] }
}

const pdfjsRoot = resolve('node_modules/pdfjs-dist')
const pdfjsMounts = [
  ['/pdfjs/wasm', resolve(pdfjsRoot, 'wasm')],
  ['/pdfjs/cmaps', resolve(pdfjsRoot, 'cmaps')],
  ['/pdfjs/standard_fonts', resolve(pdfjsRoot, 'standard_fonts')],
] as const

function contentSecurityPolicy(): string {
  const headers = hosting.hosting.headers.find((entry) => entry.source === '**')?.headers ?? []
  const policy = headers.find((header) => header.key === 'Content-Security-Policy')
  if (!policy) throw new Error('Content-Security-Policy is missing from firebase.json')
  return policy.value
}

function servePdfjs(directory: string): Connect.NextHandleFunction {
  return (req, res, next) => {
    const raw = decodeURIComponent((req.url ?? '/').split('?')[0] ?? '/')
    const name = raw.replace(/^\/+/, '')
    if (!name || name.includes('..')) {
      next()
      return
    }
    const file = resolve(directory, name)
    const root = directory.endsWith(sep) ? directory : directory + sep
    if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
      next()
      return
    }
    const type = file.endsWith('.wasm')
      ? 'application/wasm'
      : file.endsWith('.ttf')
        ? 'font/ttf'
        : 'application/octet-stream'
    res.setHeader('Content-Type', type)
    createReadStream(file).pipe(res)
  }
}

function pdfjsAssets(): Plugin {
  return {
    name: 'pdfjs-assets',
    configureServer(server) {
      for (const [urlPath, directory] of pdfjsMounts) {
        server.middlewares.use(urlPath, servePdfjs(directory))
      }
    },
    closeBundle() {
      for (const [urlPath, directory] of pdfjsMounts) {
        const destination = resolve('dist', urlPath.slice(1))
        mkdirSync(destination, { recursive: true })
        cpSync(directory, destination, { recursive: true })
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), pdfjsAssets()],
  preview: {
    headers: {
      'Content-Security-Policy': contentSecurityPolicy(),
    },
  },
})
