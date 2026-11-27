import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { transpileModule } from 'typescript';

export function loadMediaModule(filename, globals = {}, imports = {}, cache = new Map()) {
  const url = new URL(filename, import.meta.url);
  if (cache.has(url.href)) return cache.get(url.href);
  const exports = {};
  cache.set(url.href, exports);
  const source = readFileSync(url, 'utf8');
  const { outputText } = transpileModule(source, { compilerOptions: { module: 1, target: 9 } });
  const require = createRequire(url);
  vm.runInNewContext(outputText, {
    exports, URL, console, process, AbortController, Response, setTimeout, clearTimeout,
    ...globals,
    require: id => {
      if (Object.hasOwn(imports, id)) return imports[id];
      if (!id.startsWith('.')) return require(id);
      return loadMediaModule(new URL(id.endsWith('.ts') ? id : `${id}.ts`, url), globals, imports, cache);
    },
  }, { filename: url.pathname });
  return exports;
}
