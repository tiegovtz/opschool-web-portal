import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

// Mirror patches/nuxt-mathjax@1.1.1.patch for npm installations, which do not
// apply pnpm's patchedDependencies. Safe to run after pnpm applies the patch.
const require = createRequire(import.meta.url)
const packagePath = join(dirname(require.resolve('nuxt-mathjax')), '..', 'package.json')
const { version } = JSON.parse(await readFile(packagePath, 'utf8'))
if (version !== '1.1.1') throw new Error('Review the nuxt-mathjax type fix before changing its version.')
const rendererPath = join(dirname(packagePath), 'dist/runtime/components/MathJaxRenderer.vue')
const source = await readFile(rendererPath, 'utf8')
const original = 'window.MathJax.typesetPromise?.([containerRef.value]).catch'
const patched = 'Promise.resolve(window.MathJax.typesetPromise?.([containerRef.value])).catch'
if (source.includes(patched)) {
  console.log('[postinstall] nuxt-mathjax type fix is already applied.')
} else if (source.includes(original)) {
  await writeFile(rendererPath, source.replace(original, patched))
  console.log('[postinstall] Applied nuxt-mathjax type fix.')
} else {
  throw new Error('The nuxt-mathjax renderer changed; review the type fix.')
}
