import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { transformSync } from '@babel/core';
import transformReactJsx from '@babel/plugin-transform-react-jsx';

const sourceRoot = new URL('../../src/', import.meta.url);
const boundary = new URL('./component-boundaries.mjs', import.meta.url).href;
const replacements = new Set([
  new URL('services/api.js', sourceRoot).href,
  new URL('services/browserSession.js', sourceRoot).href,
]);
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (context.parentURL?.startsWith(sourceRoot.href) && specifier.startsWith('.')) {
      let url = new URL(specifier, context.parentURL);
      if (!existsSync(fileURLToPath(url))) {
        for (const suffix of ['.js', '.jsx']) {
          const candidate = new URL(url.href + suffix);
          if (existsSync(fileURLToPath(candidate))) { url = candidate; break; }
        }
      }
      if (replacements.has(url.href)) return { url: boundary, shortCircuit: true };
      if (existsSync(fileURLToPath(url))) return { url: url.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith(sourceRoot.href) && url.endsWith('.jsx')) {
      const filename = fileURLToPath(url);
      const source = readFileSync(filename, 'utf8');
      const result = transformSync(source, { filename, sourceFileName: url, sourceMaps: true,
        babelrc: false, configFile: false, plugins: [[transformReactJsx, { runtime: 'automatic' }]] });
      const map = Buffer.from(JSON.stringify(result.map)).toString('base64');
      return { format: 'module', shortCircuit: true,
        source: result.code + '\n//# sourceMappingURL=data:application/json;base64,' + map };
    }
    return nextLoad(url, context);
  },
});
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLDialogElement', 'Node', 'Event',
  'KeyboardEvent', 'MouseEvent', 'MutationObserver', 'getComputedStyle', 'localStorage']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// jsdom has no layout; model visible controls, not browser geometry or CSS.
dom.window.HTMLElement.prototype.getClientRects = function () {
  return this.hidden || this.closest('[hidden]') ? [] : [{ width: 100, height: 20 }];
};
export const React = await import('react');
const rtl = await import('@testing-library/react');
rtl.configure({ getElementError: message => new Error(message) });
export const { render, cleanup, fireEvent, screen, within, waitFor, act } = rtl;
export function disposeRuntime() { cleanup(); hooks.deregister(); dom.window.close(); }
export function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
