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
    return { window, draw: window.AR.R11.draw };
}

function solidPixels(w, h, r, g, b, a) {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i += 1) {
        data[i * 4] = r; data[i * 4 + 1] = g;
        data[i * 4 + 2] = b; data[i * 4 + 3] = a;
    }
    return data;
}

test('saveToLibrary persists the current drawing and tracks the id', async () => {
    const { draw } = bootDraw();
    draw.importPixels(solidPixels(16, 16, 128, 0, 255, 255), 16, 16);
    const saved = await draw.saveToLibrary({ name: 'My Picture' });
    assert.ok(saved.id, 'record has an id');
    assert.strictEqual(saved.name, 'My Picture');
    assert.strictEqual(saved.width, 16);
    assert.strictEqual(saved.height, 16);
    assert.strictEqual(saved.layers.length, 1, 'seeded with a single layer');
    assert.strictEqual(saved.layers[0].data.length, 16 * 16 * 4);
    assert.strictEqual(saved.layers[0].data.BYTES_PER_ELEMENT, 1);
    assert.strictEqual(draw.getCurrent().id, saved.id, 'current id tracked');
    assert.strictEqual(draw.getCurrent().name, 'My Picture');
});

test('saveToLibrary re-saves under the same id on subsequent calls', async () => {
    const { draw } = bootDraw();
    draw.importPixels(solidPixels(8, 8, 1, 2, 3, 255), 8, 8);
    const first = await draw.saveToLibrary({ name: 'A' });
    const second = await draw.saveToLibrary();  // no opts
    assert.strictEqual(second.id, first.id,
        'second save reuses the id from getCurrent');
    // Name sticks because currentRecordName was updated by first save.
    assert.strictEqual(second.name, 'A');
});

test('loadFromLibrary restores the pixels and dimensions', async () => {
    const { draw } = bootDraw();
    draw.importPixels(solidPixels(10, 6, 99, 88, 77, 255), 10, 6);
    const saved = await draw.saveToLibrary({ name: 'loadme' });
    // Replace the current drawing with something else
    draw.importPixels(solidPixels(4, 4, 0, 0, 0, 255), 4, 4);

    await draw.loadFromLibrary(saved.id);
    const size = draw.getCanvasSize();
    assert.strictEqual(size.width, 10);
    assert.strictEqual(size.height, 6);
    const buf = draw.getPixelBuffer();
    assert.strictEqual(buf[0], 99);
    assert.strictEqual(buf[1], 88);
    assert.strictEqual(buf[2], 77);
    assert.strictEqual(buf[3], 255);
    assert.strictEqual(draw.getCurrent().id, saved.id);
    assert.strictEqual(draw.getCurrent().name, 'loadme');
});

test('loadFromLibrary rejects a missing id', async () => {
    const { draw } = bootDraw();
    await assert.rejects(() => draw.loadFromLibrary('does-not-exist'),
        /no record for id/);
});

test('listLibrary returns metadata without layer data by default', async () => {
    const { draw } = bootDraw();
    draw.importPixels(solidPixels(8, 8, 10, 20, 30, 255), 8, 8);
    await draw.saveToLibrary({ name: 'one' });
    await new Promise(r => setTimeout(r, 3));
    await draw.saveToLibrary({ name: 'two' });

    const list = await draw.listLibrary();
    assert.strictEqual(list.length, 1, 'two saves to same id produce one record');
    assert.strictEqual(list[0].name, 'two');
    assert.strictEqual(list[0].layers, undefined, 'layer data not included by default');

    const full = await draw.listLibrary({ includeData: true });
    assert.ok(full[0].layers, 'includeData returns layers');
});

test('listLibrary sorts newest-first across distinct records', async () => {
    const { draw } = bootDraw();
    draw.importPixels(solidPixels(4, 4, 1, 1, 1, 255), 4, 4);
    const a = await draw.saveToLibrary({ id: 'a', name: 'a' });
    await new Promise(r => setTimeout(r, 3));
    draw.importPixels(solidPixels(4, 4, 2, 2, 2, 255), 4, 4);
    const b = await draw.saveToLibrary({ id: 'b', name: 'b' });

    const list = await draw.listLibrary();
    assert.deepStrictEqual(list.map(r => r.id), ['b', 'a']);
});

test('deleteFromLibrary removes record and clears currentRecordId when it matches', async () => {
    const { draw } = bootDraw();
    draw.importPixels(solidPixels(8, 8, 5, 5, 5, 255), 8, 8);
    const saved = await draw.saveToLibrary({ name: 'bye' });
    assert.strictEqual(draw.getCurrent().id, saved.id);

    await draw.deleteFromLibrary(saved.id);
    assert.strictEqual(draw.getCurrent().id, null);
    const list = await draw.listLibrary();
    assert.strictEqual(list.length, 0);
});
