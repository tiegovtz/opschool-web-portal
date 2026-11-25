import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { compileScript, parse } from 'vue/compiler-sfc';
import { transpileModule } from 'typescript';
import { computed, effectScope, nextTick, reactive, ref, watch } from 'vue';

const filename = new URL('../app/components/home/CardImage.vue', import.meta.url);
const { descriptor } = parse(await readFile(filename, 'utf8'));
const script = compileScript(descriptor, { id: 'card-image-test' });
const { outputText } = transpileModule(script.content, { compilerOptions: { module: 1, target: 9 } });

function mount(t, src, origin = 'http://127.0.0.1') {
  const exports = {};
  const img = source => `optimized:${source}`;
  img.options = { domains: ['opschool.tie.go.tz', '127.0.0.1'] };
  vm.runInNewContext(outputText, {
    exports, require: createRequire(import.meta.url), URL,
    computed, ref, watch,
    useImage: () => img,
    useRuntimeConfig: () => ({ public: { imageFetchOrigin: origin } }),
  });
  const props = reactive({ src, alt: 'Test image', width: 640, height: 360 });
  const scope = effectScope();
  t.after(() => scope.stop());
  return { props, state: scope.run(() => exports.default.setup(props, { expose() {} })) };
}

test('a stale loopback override does not replace a working public image', t => {
  const src = 'https://opschool.tie.go.tz/api/uploads/subjects/example.jpeg?version=1';
  const { state } = mount(t, src);
  assert.equal(state.imageSrc.value, `optimized:${src}`);
  state.handleImageError();
  assert.equal(state.imageSrc.value, 'optimized:http://127.0.0.1/api/uploads/subjects/example.jpeg?version=1');
  state.handleImageError();
  assert.equal(state.imageSrc.value, src);
  assert.equal(state.imageSrcset.value, undefined);
  state.handleImageError();
  assert.equal(state.imageSrc.value, 'optimized:/images/default.webp');
});

test('a new card source resets optimization after failures', async t => {
  const { props, state } = mount(t, 'https://opschool.tie.go.tz/api/uploads/old.png', '');
  state.handleImageError();
  state.handleImageError();
  props.src = 'https://opschool.tie.go.tz/api/uploads/new.png';
  await nextTick();
  assert.equal(state.imageSrc.value, 'optimized:https://opschool.tie.go.tz/api/uploads/new.png');
});

test('local assets and animated or unapproved sources keep their intended behavior', t => {
  for (const [src, expected] of [
    ['/public/images/default.webp', 'optimized:/images/default.webp'],
    ['/logo/logo_tie.gif', '/logo/logo_tie.gif'],
    ['https://opschool.tie.go.tz/animated.gif', 'https://opschool.tie.go.tz/animated.gif'],
    ['https://other.example/image.png', 'optimized:http://127.0.0.1/image.png'],
  ]) {
    assert.equal(mount(t, src).state.imageSrc.value, expected);
  }
});
