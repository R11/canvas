const test = require('node:test');
const assert = require('node:assert');
const { makeDom } = require('./harness');

const DRAW_SCRIPTS = [
    'init.js', 'canvas.js', 'font.js', 'text.js', 'buttons.js', 'ball.js',
    'hud.js', 'store.js', 'draw.js'
];

function bootDraw() {
    const { window } = makeDom({ scripts: DRAW_SCRIPTS, excludeOnload: true });
    window.AR.R11.draw.init();
    return { window };
}

function solidColorPixels(w, h, r, g, b, a) {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i += 1) {
        data[i * 4]     = r;
        data[i * 4 + 1] = g;
        data[i * 4 + 2] = b;
        data[i * 4 + 3] = a;
    }
    return data;
}

test('importPixels replaces drawing and resizes canvas by default', () => {
    const { window } = bootDraw();
    const red = solidColorPixels(32, 24, 255, 0, 0, 255);
    window.AR.R11.draw.importPixels(red, 32, 24);

    const size = window.AR.R11.draw.getCanvasSize();
    assert.strictEqual(size.width, 32);
    assert.strictEqual(size.height, 24);

    const buf = window.AR.R11.draw.getPixelBuffer();
    assert.strictEqual(buf[0], 255, 'r');
    assert.strictEqual(buf[1], 0, 'g');
    assert.strictEqual(buf[2], 0, 'b');
    assert.strictEqual(buf[3], 255, 'a');
    // Last pixel (31, 23) should also be red
    const last = (31 + 23 * 32) * 4;
    assert.strictEqual(buf[last], 255);
    assert.strictEqual(buf[last + 3], 255);
});

test('importPixels with resizeCanvas:false keeps the current canvas size', () => {
    const { window } = bootDraw();
    const before = window.AR.R11.draw.getCanvasSize();
    const red = solidColorPixels(16, 16, 255, 0, 0, 255);
    window.AR.R11.draw.importPixels(red, 16, 16, { resizeCanvas: false });

    const after = window.AR.R11.draw.getCanvasSize();
    assert.deepStrictEqual(after, before, 'canvas size unchanged');

    const buf = window.AR.R11.draw.getPixelBuffer();
    // First pixel should be red; a pixel far past the import bounds should be 0.
    assert.strictEqual(buf[0], 255);
    assert.strictEqual(buf[3], 255);
    const faraway = (500 + 500 * before.width) * 4;
    assert.strictEqual(buf[faraway + 3], 0);
});

test('importPixels overlay mode preserves existing drawing under transparent input', () => {
    const { window } = bootDraw();
    // Seed with a solid red background via replace mode.
    const red = solidColorPixels(16, 16, 255, 0, 0, 255);
    window.AR.R11.draw.importPixels(red, 16, 16);

    // Overlay a transparent-everywhere image except one green pixel at (5, 5).
    const overlay = new Uint8ClampedArray(16 * 16 * 4);
    const idx = (5 + 5 * 16) * 4;
    overlay[idx] = 0; overlay[idx + 1] = 255; overlay[idx + 2] = 0; overlay[idx + 3] = 255;
    window.AR.R11.draw.importPixels(overlay, 16, 16, { mode: 'overlay' });

    const buf = window.AR.R11.draw.getPixelBuffer();
    // (5, 5) should now be green; everywhere else still red.
    assert.strictEqual(buf[idx + 1], 255, 'overlay pixel is green');
    assert.strictEqual(buf[idx], 0);
    const backgroundIdx = 0;
    assert.strictEqual(buf[backgroundIdx], 255, 'background preserved as red');
    assert.strictEqual(buf[backgroundIdx + 1], 0);
});

test('importPixels rejects mismatched buffer length', () => {
    const { window } = bootDraw();
    const bad = new Uint8ClampedArray(10);  // way too small
    assert.throws(() => window.AR.R11.draw.importPixels(bad, 32, 32));
});

test('importImage decodes a Blob via Image and blits the pixels', async () => {
    const { window } = bootDraw();

    // jsdom's HTMLCanvasElement.drawImage doesn't rasterize real images, but
    // the offscreen getImageData call goes through our stub which returns
    // a zero-initialized buffer of the requested size. To make this test
    // meaningful, we tap into the Image() constructor and stub the offscreen
    // ctx's getImageData to return known pixels.
    const wantedW = 8, wantedH = 4;
    const wantedPixels = solidColorPixels(wantedW, wantedH, 0, 128, 255, 255);

    // Upgrade the Image stub to auto-fire onload with our dimensions.
    window.Image = class {
        constructor() {
            this.width = wantedW;
            this.height = wantedH;
            this.src = '';
            this.name = '';
            this.onload = null;
            this.onerror = null;
        }
        set src(v) {
            this._src = v;
            // Fire onload on next microtask so the promise path works.
            Promise.resolve().then(() => this.onload && this.onload());
        }
        get src() { return this._src; }
    };

    // Patch the offscreen canvas's getImageData to return our wanted pixels.
    // We intercept by wrapping document.createElement('canvas') to override
    // getImageData on its context.
    const origCreate = window.document.createElement.bind(window.document);
    window.document.createElement = function (tag) {
        const el = origCreate(tag);
        if (tag.toLowerCase() === 'canvas') {
            const origGetContext = el.getContext.bind(el);
            el.getContext = function (...args) {
                const ctx = origGetContext(...args);
                ctx.getImageData = () => ({
                    data: wantedPixels,
                    width: wantedW,
                    height: wantedH
                });
                return ctx;
            };
        }
        return el;
    };

    // Blob is enough of a signal for the function to take the blob path.
    const blob = new window.Blob(['fake png data'], { type: 'image/png' });
    // jsdom provides Blob but may not provide URL.createObjectURL; stub it.
    window.URL.createObjectURL = () => 'blob:fake';
    window.URL.revokeObjectURL = () => {};

    const result = await window.AR.R11.draw.importImage(blob);
    assert.strictEqual(result.width, wantedW);
    assert.strictEqual(result.height, wantedH);

    const size = window.AR.R11.draw.getCanvasSize();
    assert.strictEqual(size.width, wantedW);
    assert.strictEqual(size.height, wantedH);
    const buf = window.AR.R11.draw.getPixelBuffer();
    assert.strictEqual(buf[0], 0);
    assert.strictEqual(buf[1], 128);
    assert.strictEqual(buf[2], 255);
});

test('importImage rejects on a non-Blob non-string argument', async () => {
    const { window } = bootDraw();
    await assert.rejects(() => window.AR.R11.draw.importImage(123),
        /must be a Blob, File, or URL string/);
});
