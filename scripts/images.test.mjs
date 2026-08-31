import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

// Resolve the actual optimizer used by Nuxt Image, not the top-level Sharp
// dependency: a working root installation can hide a broken nested binary.
const imageRequire = createRequire(import.meta.resolve('@nuxt/image'));
const { createIPX, ipxFSStorage } = imageRequire('ipx');
const ipxRequire = createRequire(imageRequire.resolve('ipx'));
const sharp = ipxRequire('sharp');
const ipx = createIPX({ storage: ipxFSStorage({ dir: fileURLToPath(new URL('../public', import.meta.url)) }) });

for (const source of ['/logo/logo_tie.webp', '/logo/logo_tie.jpg', '/logo/image002.png', '/logo/logo_tie.gif']) {
  test(`Nuxt optimizer resizes and converts ${source}`, async () => {
    const output = await ipx(source, { w: '120', f: 'webp', q: '80' }).process();
    const metadata = await sharp(output.data).metadata();
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.width, 120);
    assert.ok(metadata.height > 0);
  });
}
