import test from 'node:test';
import assert from 'node:assert/strict';
import { centeredCrop, outputSize, filterFor, defaults } from '../public/editor-core.js';
import worker from '../src/worker.js';
test('rotation swaps portrait and landscape dimensions only on quarter turns', () => {
  assert.deepEqual(outputSize(1200, 800, 90), { width: 800, height: 1200 });
  assert.deepEqual(outputSize(1200, 800, 180), { width: 1200, height: 800 });
  assert.deepEqual(outputSize(1200, 800, 270), { width: 800, height: 1200 });
});
test('centered crops stay within source and preserve requested aspect ratio', () => {
  for (const [w, h] of [[1200,800],[800,1200]]) for (const ratio of [1, 4/3, 16/9]) {
    const crop = centeredCrop(w,h,ratio);
    assert.ok(crop.x >= 0 && crop.y >= 0);
    assert.ok(crop.x + crop.width <= w && crop.y + crop.height <= h);
    assert.ok(Math.abs(crop.width / crop.height - ratio) < 1e-9);
  }
  assert.throws(() => centeredCrop(0,800,1));
});
test('adjustments and monochrome compose together', () => {
  assert.match(filterFor({ ...defaults(), brightness: 120, preset: 'mono' }), /brightness\(120%\).*grayscale\(1\)/);
});
test('Worker preserves assets response and sets browser security headers', async () => {
  const response = await worker.fetch(new Request('https://example.com/'), { ASSETS: { fetch: async () => new Response('hello', {status: 200, headers: {'Content-Type':'text/html'}}) } });
  assert.equal(await response.text(), 'hello');
  assert.equal(response.headers.get('Content-Type'), 'text/html');
  assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
});
