const test = require('node:test');
const assert = require('node:assert');
const { makeDom } = require('./harness');

test('AR.R11.resolve returns value or calls function', () => {
    const { window } = makeDom({ scripts: ['init.js'] });
    const { resolve } = window.AR.R11;
    assert.strictEqual(resolve(5), 5);
    assert.strictEqual(resolve('x'), 'x');
    assert.strictEqual(resolve(() => 42), 42);
});

test('AR.R11.contains handles numeric and function box coords', () => {
    const { window } = makeDom({ scripts: ['init.js'] });
    const { contains } = window.AR.R11;
    const box = { x: 0, y: 0, w: 10, h: 10 };
    assert.strictEqual(contains(box, 5, 5), true);
    assert.strictEqual(contains(box, 15, 5), false);
    assert.strictEqual(contains(box, -1, 5), false);
    const boxFn = { x: () => 0, y: () => 0, w: () => 10, h: () => 10 };
    assert.strictEqual(contains(boxFn, 5, 5), true);
});

test('AR.R11.next1 / back1 clamp within bounds', () => {
    const { window } = makeDom({ scripts: ['init.js'] });
    const { next1, back1 } = window.AR.R11;
    assert.strictEqual(next1(5, 10, 0), 6);
    assert.strictEqual(next1(10, 10, 0), 10, 'at max stays at max');
    assert.strictEqual(next1(-5, 10, 0), 0, 'below min snaps to min');
    assert.strictEqual(back1(5, 0, 10), 4);
    assert.strictEqual(back1(0, 0, 10), 0, 'at min stays at min');
    assert.strictEqual(back1(20, 0, 10), 10, 'above max snaps to max');
});

test('AR.R11.updateSettings honors mods, resolves function defaults, preserves 0/false', () => {
    const { window } = makeDom({ scripts: ['init.js'] });
    const { updateSettings } = window.AR.R11;
    const target = {};
    const defaults = {
        a: 1,
        b: () => 'hello',
        c: 10,
        d: true
    };
    updateSettings(target, defaults, { c: 0 });
    assert.strictEqual(target.a, 1);
    assert.strictEqual(target.b, 'hello');
    assert.strictEqual(target.c, 0, 'explicit 0 override is honored');
    assert.strictEqual(target.d, true);
});

test('AR.R11.window.height returns a number (no typo)', () => {
    const { window } = makeDom({ scripts: ['init.js'] });
    assert.strictEqual(typeof window.AR.R11.window.height(), 'number');
    assert.strictEqual(typeof window.AR.R11.window.width(), 'number');
});
