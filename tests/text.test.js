// Tests for AR.R11.text — the text-rendering seam that switches between
// the bitmap font (default, hand-drawn for the Wii U) and the browser's
// native ctx.fillText. Both backends must support per-call rotation so
// existing call-sites that use the bitmap font's sideways rendering keep
// working when callers opt into the native backend.

const test = require('node:test');
const assert = require('node:assert');
const { makeDom } = require('./harness');

function bootText() {
    const { window } = makeDom({
        scripts: ['init.js', 'canvas.js', 'font.js', 'text.js'],
        excludeOnload: true
    });
    return { window, text: window.AR.R11.text };
}

test('AR.R11.text exposes draw, getDefault, setDefault', () => {
    const { text } = bootText();
    assert.strictEqual(typeof text.draw, 'function');
    assert.strictEqual(typeof text.getDefault, 'function');
    assert.strictEqual(typeof text.setDefault, 'function');
});

test('default backend is "bitmap"', () => {
    const { text } = bootText();
    assert.strictEqual(text.getDefault('font'), 'bitmap');
});

test('setDefault changes the global default', () => {
    const { text } = bootText();
    text.setDefault('font', 'native');
    assert.strictEqual(text.getDefault('font'), 'native');
});

test('setDefault({ ... }) merges multiple keys at once', () => {
    const { text } = bootText();
    text.setDefault({ font: 'native', size: 22, color: 'red' });
    assert.strictEqual(text.getDefault('font'), 'native');
    assert.strictEqual(text.getDefault('size'), 22);
    assert.strictEqual(text.getDefault('color'), 'red');
});

test('bitmap backend goes through AR.R11.Text', () => {
    const { window, text } = bootText();
    let constructorCalls = 0;
    let lastOpts = null;
    const OriginalText = window.AR.R11.Text;
    window.AR.R11.Text = function (opts) {
        constructorCalls += 1;
        lastOpts = opts;
        // Don't actually run the original — we just want to observe the call.
        this.w = 100;
        this.h = 20;
    };
    const ctx = window.document.createElement('canvas').getContext('2d');
    text.draw(ctx, 'hello', { x: 10, y: 20, size: 16, angle: 0.5 });
    assert.strictEqual(constructorCalls, 1);
    assert.strictEqual(lastOpts.text, 'hello');
    assert.strictEqual(lastOpts.x, 10);
    assert.strictEqual(lastOpts.y, 20);
    assert.strictEqual(lastOpts.size, 16);
    assert.strictEqual(lastOpts.angle, 0.5,
        'bitmap path forwards angle so the Text class can rotate per glyph');
    window.AR.R11.Text = OriginalText;
});

test('native backend calls ctx.fillText and uses ctx.rotate when angle is set', () => {
    const { window, text } = bootText();
    const calls = [];
    const ctx = {
        save: () => calls.push({ op: 'save' }),
        restore: () => calls.push({ op: 'restore' }),
        translate: (x, y) => calls.push({ op: 'translate', x, y }),
        rotate: (a) => calls.push({ op: 'rotate', a }),
        fillText: (t, x, y) => calls.push({ op: 'fillText', t, x, y }),
        measureText: (s) => ({ width: s.length * 7 }),
        set font(v) { calls.push({ op: 'set:font', v }); },
        set fillStyle(v) { calls.push({ op: 'set:fillStyle', v }); },
        set textAlign(v) { calls.push({ op: 'set:textAlign', v }); },
        set textBaseline(v) { calls.push({ op: 'set:textBaseline', v }); }
    };
    text.draw(ctx, 'sideways', {
        font: 'native', x: 5, y: 10, size: 18, angle: Math.PI / 2, color: 'blue'
    });

    const ops = calls.map(c => c.op);
    assert.deepStrictEqual(
        ops.slice(0, 2),
        ['save', 'translate'],
        'first ops are save + translate to (x, y)'
    );
    const trans = calls.find(c => c.op === 'translate');
    assert.deepStrictEqual({ x: trans.x, y: trans.y }, { x: 5, y: 10 });

    const rot = calls.find(c => c.op === 'rotate');
    assert.ok(rot, 'rotate was called for sideways angle');
    assert.strictEqual(rot.a, Math.PI / 2);

    const fill = calls.find(c => c.op === 'fillText');
    assert.ok(fill, 'fillText was called');
    assert.strictEqual(fill.t, 'sideways');

    assert.strictEqual(ops[ops.length - 1], 'restore', 'closes with restore');
});

test('native backend skips rotate when angle is 0', () => {
    const { window, text } = bootText();
    const calls = [];
    const ctx = {
        save: () => calls.push('save'),
        restore: () => calls.push('restore'),
        translate: () => calls.push('translate'),
        rotate: () => calls.push('rotate'),
        fillText: () => calls.push('fillText'),
        measureText: () => ({ width: 0 }),
        set font(v) {}, set fillStyle(v) {},
        set textAlign(v) {}, set textBaseline(v) {}
    };
    text.draw(ctx, 'flat', { font: 'native', x: 0, y: 0, size: 14, angle: 0 });
    assert.ok(!calls.includes('rotate'),
        'no rotate when angle is 0 — saves a transform op');
});

test('native backend handles "/n" newline escape like the bitmap font', () => {
    const { text } = bootText();
    const fillCalls = [];
    const ctx = {
        save() {}, restore() {}, translate() {},
        rotate() {},
        fillText(t, x, y) { fillCalls.push({ t, x, y }); },
        measureText() { return { width: 0 }; },
        set font(v) {}, set fillStyle(v) {},
        set textAlign(v) {}, set textBaseline(v) {}
    };
    text.draw(ctx, 'line one/nline two/nthird', {
        font: 'native', x: 0, y: 0, size: 10, spacing: 2
    });
    assert.strictEqual(fillCalls.length, 3, 'three lines fillText\'d');
    assert.strictEqual(fillCalls[0].t, 'line one');
    assert.strictEqual(fillCalls[1].t, 'line two');
    assert.strictEqual(fillCalls[2].t, 'third');
    // Each line offset by (size + spacing) = 12 from the previous.
    assert.strictEqual(fillCalls[1].y - fillCalls[0].y, 12);
    assert.strictEqual(fillCalls[2].y - fillCalls[1].y, 12);
});

test('per-call opts.font overrides the global default both ways', () => {
    const { window, text } = bootText();
    text.setDefault('font', 'native');

    let bitmapCalls = 0;
    const OriginalText = window.AR.R11.Text;
    window.AR.R11.Text = function () { bitmapCalls += 1; this.w = 0; this.h = 0; };
    const ctx = window.document.createElement('canvas').getContext('2d');
    text.draw(ctx, 'forced bitmap', { font: 'bitmap', x: 0, y: 0, size: 12 });
    assert.strictEqual(bitmapCalls, 1, 'opt overrode the native default');
    window.AR.R11.Text = OriginalText;
});

test('draw returns measured width and height', () => {
    const { window, text } = bootText();
    const result = text.draw(
        window.document.createElement('canvas').getContext('2d'),
        'sample',
        { x: 0, y: 0, size: 12 }
    );
    assert.strictEqual(typeof result.width, 'number');
    assert.strictEqual(typeof result.height, 'number');
});

test('draw.js customFont call-sites still work after wiring through AR.R11.text', () => {
    // This indirectly exercises the customFont -> AR.R11.text.draw seam,
    // since draw.init() runs settings.updateAll() which calls customFont
    // many times.
    const { window } = makeDom({
        scripts: [
            'init.js', 'canvas.js', 'font.js', 'text.js', 'buttons.js',
            'ball.js', 'hud.js', 'store.js', 'draw.js'
        ],
        excludeOnload: true
    });
    assert.doesNotThrow(() => window.AR.R11.draw.init());
});
