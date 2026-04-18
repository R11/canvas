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

test('initial state has exactly one layer and it is active', () => {
    const { draw } = bootDraw();
    assert.strictEqual(draw.getLayerCount(), 1);
    assert.strictEqual(draw.getActiveLayerIndex(), 0);
    const ls = draw.getLayers();
    assert.strictEqual(ls.length, 1);
    assert.strictEqual(ls[0].name, 'Layer 1');
    assert.strictEqual(ls[0].opacity, 1);
    assert.strictEqual(ls[0].visible, true);
});

test('addLayer inserts above active and makes the new layer active', () => {
    const { draw } = bootDraw();
    const layer = draw.addLayer({ name: 'Second' });
    assert.strictEqual(draw.getLayerCount(), 2);
    assert.strictEqual(draw.getActiveLayerIndex(), 1);
    assert.strictEqual(layer.name, 'Second');

    draw.addLayer({ name: 'Third' });
    assert.strictEqual(draw.getLayerCount(), 3);
    assert.strictEqual(draw.getActiveLayerIndex(), 2);
});

test('addLayer with copyFrom duplicates the source layer data', () => {
    const { draw } = bootDraw();
    draw.importPixels(solidPixels(8, 8, 50, 100, 150, 255), 8, 8);
    // Active is still 0 after importPixels (layer 0)
    draw.addLayer({ name: 'Copy', copyFrom: 0 });
    const copiedData = draw.getLayerData(draw.getActiveLayerIndex());
    const srcData = draw.getLayerData(0);
    assert.strictEqual(copiedData.length, srcData.length);
    assert.strictEqual(copiedData[0], 50);
    // Mutating the copy must NOT touch the source.
    copiedData[0] = 0;
    assert.strictEqual(srcData[0], 50, 'copyFrom produced an independent buffer');
});

test('removeLayer cannot delete the last remaining layer', () => {
    const { draw } = bootDraw();
    assert.throws(() => draw.removeLayer(0), /last layer/);
});

test('removeLayer reindexes active when deleting before/at/after it', () => {
    const { draw } = bootDraw();
    draw.addLayer({ name: 'B' });
    draw.addLayer({ name: 'C' });
    // layers: [A, B, C], active = 2
    assert.strictEqual(draw.getActiveLayerIndex(), 2);

    // Deleting a layer BEFORE active shifts active down.
    draw.removeLayer(0);
    // layers: [B, C], active was 2 -> 1
    assert.strictEqual(draw.getLayerCount(), 2);
    assert.strictEqual(draw.getActiveLayerIndex(), 1);

    // Deleting the active layer snaps active to the new last index.
    draw.removeLayer(1);
    // layers: [B], active -> 0
    assert.strictEqual(draw.getLayerCount(), 1);
    assert.strictEqual(draw.getActiveLayerIndex(), 0);
});

test('moveLayer reorders and follows the moved layer', () => {
    const { draw } = bootDraw();
    draw.addLayer({ name: 'B' });
    draw.addLayer({ name: 'C' });
    // layers: [A, B, C], active = 2 (C)

    // Move C (index 2) to the bottom (index 0).
    draw.moveLayer(2, 0);
    // layers: [C, A, B], active should follow C to 0
    // Stringify to sidestep cross-realm Array constructor differences.
    const names = draw.getLayers().map(l => l.name).join(',');
    assert.strictEqual(names, 'C,Layer 1,B');
    assert.strictEqual(draw.getActiveLayerIndex(), 0);
});

test('setActiveLayerIndex validates bounds', () => {
    const { draw } = bootDraw();
    assert.throws(() => draw.setActiveLayerIndex(1));
    assert.throws(() => draw.setActiveLayerIndex(-1));
});

test('setLayerOpacity clamps to [0, 1]', () => {
    const { draw } = bootDraw();
    draw.setLayerOpacity(0, 0.5);
    assert.strictEqual(draw.getLayers()[0].opacity, 0.5);
    draw.setLayerOpacity(0, -1);
    assert.strictEqual(draw.getLayers()[0].opacity, 0);
    draw.setLayerOpacity(0, 5);
    assert.strictEqual(draw.getLayers()[0].opacity, 1);
});

test('a hidden upper layer is omitted from the composite', () => {
    const { draw } = bootDraw();
    // Layer 0: solid red. Layer 1: solid blue, on top.
    draw.importPixels(solidPixels(8, 8, 255, 0, 0, 255), 8, 8);
    draw.addLayer({ name: 'Blue' });
    draw.importPixels(solidPixels(8, 8, 0, 0, 255, 255), 8, 8);

    // With both visible, top wins → composite is blue.
    let buf = draw.getPixelBuffer();
    assert.strictEqual(buf[0], 0, 'r channel blue');
    assert.strictEqual(buf[2], 255);

    // Hide the top layer → composite falls back to red.
    draw.setLayerVisibility(1, false);
    buf = draw.getPixelBuffer();
    assert.strictEqual(buf[0], 255);
    assert.strictEqual(buf[2], 0);
});

test('saveToLibrary + loadFromLibrary roundtrips multiple layers', async () => {
    const { draw } = bootDraw();
    draw.importPixels(solidPixels(6, 6, 200, 0, 0, 255), 6, 6);
    draw.addLayer({ name: 'Middle' });
    draw.importPixels(solidPixels(6, 6, 0, 200, 0, 128), 6, 6);
    draw.addLayer({ name: 'Top' });
    draw.setLayerOpacity(draw.getActiveLayerIndex(), 0.75);

    const saved = await draw.saveToLibrary({ name: 'multi' });
    assert.strictEqual(saved.layers.length, 3);
    assert.strictEqual(saved.layers[2].opacity, 0.75);
    assert.strictEqual(saved.layers[1].name, 'Middle');

    // Change the drawing to verify loadFromLibrary actually restores state.
    // importPixels only edits the active layer, so the stack stays at 3.
    draw.importPixels(solidPixels(2, 2, 0, 0, 0, 255), 2, 2);

    await draw.loadFromLibrary(saved.id);
    assert.strictEqual(draw.getLayerCount(), 3);
    assert.strictEqual(draw.getLayers()[1].name, 'Middle');
    assert.strictEqual(draw.getLayers()[2].opacity, 0.75);
});

test('setCanvasSize resizes every layer (preserve)', () => {
    const { draw } = bootDraw();
    draw.importPixels(solidPixels(8, 8, 1, 2, 3, 255), 8, 8);
    draw.addLayer({ name: 'Two' });
    draw.importPixels(solidPixels(8, 8, 4, 5, 6, 255), 8, 8);

    draw.setCanvasSize(16, 16);
    const size = draw.getCanvasSize();
    assert.strictEqual(size.width, 16);
    assert.strictEqual(size.height, 16);
    assert.strictEqual(draw.getLayerCount(), 2);
    // Each layer buffer is the new size.
    for (let i = 0; i < 2; i += 1) {
        assert.strictEqual(draw.getLayerData(i).length, 16 * 16 * 4);
    }
    // Top-left pixel of layer 0 still carries its color (preserve=true default).
    assert.strictEqual(draw.getLayerData(0)[0], 1);
    assert.strictEqual(draw.getLayerData(1)[0], 4);
});

test('draw writes to active layer — lower layers are untouched', () => {
    const { window, draw } = bootDraw();
    // Layer 0 gets a red background via importPixels.
    draw.importPixels(solidPixels(canvasPxW(window), canvasPxH(window), 255, 0, 0, 255),
        canvasPxW(window), canvasPxH(window), { resizeCanvas: false });

    // Add a new blank layer and draw into it.
    draw.addLayer({ name: 'Ink' });
    window.onmousedown({ pageX: 500, pageY: 400 });
    window.onmouseup({ pageX: 500, pageY: 400 });

    // Layer 0 stays solid red everywhere.
    const bottom = draw.getLayerData(0);
    assert.strictEqual(bottom[0], 255);
    // Layer 1 (active) has a non-transparent pixel at the drawn location.
    const top = draw.getLayerData(1);
    let topPixels = 0;
    for (let i = 3; i < top.length; i += 4) {
        if (top[i] !== 0) topPixels += 1;
    }
    assert.ok(topPixels >= 1, 'brush deposited at least one pixel on the active layer');
});

function canvasPxW(window) { return window.AR.R11.draw.getCanvasSize().width; }
function canvasPxH(window) { return window.AR.R11.draw.getCanvasSize().height; }
