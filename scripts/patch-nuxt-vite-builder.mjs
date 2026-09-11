import { access, copyFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const nuxtPackagePath = require.resolve('nuxt/package.json')
const requireFromNuxt = createRequire(nuxtPackagePath)
const viteBuilderEntryPath = requireFromNuxt.resolve('@nuxt/vite-builder')
const viteBuilderDistPath = dirname(viteBuilderEntryPath)
const sourcePath = join(viteBuilderDistPath, 'vite-node.mjs')
const runtimePath = join(viteBuilderDistPath, 'runtime')
const targetPath = join(runtimePath, 'vite-node.mjs')

try {
  await access(targetPath)
  console.log('[postinstall] @nuxt/vite-builder runtime path is already available.')
} catch (error) {
  if (error.code !== 'ENOENT') throw error

  await mkdir(runtimePath, { recursive: true })
  await copyFile(sourcePath, targetPath)
  console.log('[postinstall] Patched @nuxt/vite-builder runtime path.')
}
