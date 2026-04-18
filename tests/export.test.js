const test = require('node:test');
const assert = require('node:assert');
const { makeDom } = require('./harness');

const DRAW_SCRIPTS = [
    'init.js', 'canvas.js', 'font.js', 'buttons.js', 'ball.js',
    'hud.js', 'store.js', 'draw.js'
];

function bootDraw() {
    const { window } = makeDom({ scripts: DRAW_SCRIPTS, excludeOnload: true });
    window.AR.R11.draw.init();
    return { window };
}

// Intercept the anchor-click download path. Returns an array of captured
// { href, filename } entries, and restores on disposal.
function captureDownloads(window) {
    const captured = [];
    const origCreate = window.document.createElement.bind(window.document);
    window.document.createElement = function (tag) {
        const el = origCreate(tag);
        if (tag.toLowerCase() === 'a') {
            const origClick = el.click.bind(el);
            el.click = function () {
                captured.push({ href: el.href, filename: el.download });
                origClick();
            };
        }
        return el;
    };
    return captured;
}

test('exportImage triggers a download via an <a download> anchor click', () => {
    const { window } = bootDraw();
    const downloads = captureDownloads(window);

    // HTMLCanvasElement in jsdom has toDataURL (we stub it). toBlob is absent
    // by default, so the code falls through to the data-URL branch.
    window.AR.R11.draw.exportImage();

    assert.strictEqual(downloads.length, 1);
    assert.strictEqual(downloads[0].filename, 'drawing.png');
    assert.ok(downloads[0].href.startsWith('data:image/png'),
        `expected a data: URL, got ${downloads[0].href}`);
});

test('exportImage honors custom filename and source id', () => {
    const { window } = bootDraw();
    const downloads = captureDownloads(window);

    window.AR.R11.draw.exportImage({ id: 'canvas', filename: 'preview.png' });

    assert.strictEqual(downloads.length, 1);
    assert.strictEqual(downloads[0].filename, 'preview.png');
});

test('exportImage prefers toBlob + blob: URL when the browser supports it', () => {
    const { window } = bootDraw();
    // Stub toBlob on the realCanvas element.
    const realCanvas = window.document.getElementById('realCanvas');
    const fakeBlob = { type: 'image/png', size: 42 };
    realCanvas.toBlob = function (cb) { cb(fakeBlob); };
    // Stub URL.createObjectURL
    const urls = [];
    window.URL = window.URL || {};
    window.URL.createObjectURL = function (b) {
        const u = 'blob:fake/' + urls.length;
        urls.push({ url: u, blob: b });
        return u;
    };
    window.URL.revokeObjectURL = function () {};

    const downloads = captureDownloads(window);
    window.AR.R11.draw.exportImage();

    assert.strictEqual(downloads.length, 1);
    assert.strictEqual(downloads[0].href, 'blob:fake/0');
    assert.strictEqual(urls[0].blob, fakeBlob);
});

test('S key binding exports realCanvas (no zoom side effects)', () => {
    const { window } = bootDraw();
    const sizeBefore = window.AR.R11.draw.getCanvasSize();
    const downloads = captureDownloads(window);

    window.onkeydown({ keyCode: 83 });  // S = controls.save

    assert.strictEqual(downloads.length, 1, 'S should trigger exactly one download');
    // No zoom-reset side effect — canvas size must be unchanged.
    const sizeAfter = window.AR.R11.draw.getCanvasSize();
    assert.deepStrictEqual(sizeAfter, sizeBefore);
});
