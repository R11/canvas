const test = require('node:test');
const assert = require('node:assert');
const { makeDom } = require('./harness');

const DRAW_SCRIPTS = [
    'init.js', 'canvas.js', 'font.js', 'buttons.js', 'ball.js',
    'hud.js', 'store.js', 'draw.js', 'library-ui.js', 'layer-ui.js'
];

function bootUi() {
    const { window } = makeDom({ scripts: DRAW_SCRIPTS, excludeOnload: true });
    window.AR.R11.draw.init();
    return { window, draw: window.AR.R11.draw, ui: window.AR.R11.layerUI };
}

function rows(window) {
    return Array.from(window.document.querySelectorAll('li[data-index]'));
}

test('open mounts a panel, close removes it, toggle flips', () => {
    const { window, ui } = bootUi();
    assert.strictEqual(ui.isOpen(), false);
    ui.open();
    assert.strictEqual(ui.isOpen(), true);
    assert.ok(window.document.querySelector('[role="dialog"][aria-label="Layers"]'));
    ui.close();
    assert.strictEqual(ui.isOpen(), false);
    ui.toggle();
    assert.strictEqual(ui.isOpen(), true);
    ui.toggle();
    assert.strictEqual(ui.isOpen(), false);
});

test('M keybinding toggles the panel', () => {
    const { window, ui } = bootUi();
    window.onkeydown({ keyCode: 77 });
    assert.strictEqual(ui.isOpen(), true);
    window.onkeydown({ keyCode: 77 });
    assert.strictEqual(ui.isOpen(), false);
});

test('panel lists every layer top-first (highest index on top)', () => {
    const { window, draw, ui } = bootUi();
    draw.addLayer({ name: 'Middle' });
    draw.addLayer({ name: 'Top' });
    // layers: [Layer 1, Middle, Top], active = 2 (Top)
    ui.open();

    const indices = rows(window).map(li => li.getAttribute('data-index'));
    // Panel displays highest index first.
    assert.deepStrictEqual(indices.join(','), '2,1,0');
});

test('clicking a row sets that layer active', () => {
    const { window, draw, ui } = bootUi();
    draw.addLayer({ name: 'B' });
    draw.addLayer({ name: 'C' });
    assert.strictEqual(draw.getActiveLayerIndex(), 2);

    ui.open();
    const zeroRow = window.document.querySelector('li[data-index="0"]');
    zeroRow.onclick();
    assert.strictEqual(draw.getActiveLayerIndex(), 0);
});

test('Add Layer button creates a new layer and makes it active', () => {
    const { window, draw, ui } = bootUi();
    ui.open();
    const before = draw.getLayerCount();
    const addBtn = Array.from(window.document.querySelectorAll('button'))
        .find(b => b.textContent === '+ Add Layer');
    addBtn.onclick();
    assert.strictEqual(draw.getLayerCount(), before + 1);
    assert.strictEqual(draw.getActiveLayerIndex(), before);
});

test('Duplicate Active button copies the active layer data', () => {
    const { window, draw, ui } = bootUi();
    const d = draw.getLayerData(0);
    d[0] = 42;
    ui.open();
    const dupBtn = Array.from(window.document.querySelectorAll('button'))
        .find(b => b.textContent === 'Duplicate Active');
    dupBtn.onclick();
    assert.strictEqual(draw.getLayerCount(), 2);
    assert.strictEqual(draw.getLayerData(draw.getActiveLayerIndex())[0], 42);
});

test('visibility checkbox toggles setLayerVisibility', () => {
    const { window, draw, ui } = bootUi();
    draw.addLayer({ name: 'Top' });
    ui.open();

    const topRow = window.document.querySelector('li[data-index="1"]');
    const box = topRow.querySelector('input[type="checkbox"]');
    assert.strictEqual(box.checked, true, 'default visible');
    box.checked = false;
    box.onchange();
    assert.strictEqual(draw.getLayers()[1].visible, false);
});

test('opacity slider updates setLayerOpacity', () => {
    const { window, draw, ui } = bootUi();
    ui.open();
    const slider = window.document.querySelector('li[data-index="0"] input[type="range"]');
    slider.value = '33';
    slider.oninput();
    assert.ok(Math.abs(draw.getLayers()[0].opacity - 0.33) < 0.01);
});

test('delete (×) removes the row and refreshes', () => {
    const { window, draw, ui } = bootUi();
    draw.addLayer({ name: 'Top' });
    ui.open();

    const topRow = window.document.querySelector('li[data-index="1"]');
    const delBtn = topRow.querySelector('button');  // first button is ↑, actually
    // Find the '×' button specifically
    const delBtnX = Array.from(topRow.querySelectorAll('button'))
        .find(b => b.textContent === '\u00d7');
    delBtnX.onclick({ stopPropagation: () => {} });
    assert.strictEqual(draw.getLayerCount(), 1);
    // Refresh should have redrawn — only index 0 remains.
    assert.strictEqual(rows(window).length, 1);
});

test('up/down arrows call moveLayer', () => {
    const { window, draw, ui } = bootUi();
    draw.addLayer({ name: 'B' });
    draw.addLayer({ name: 'C' });
    ui.open();

    // Row with data-index=0 is "Layer 1" (bottom). Click its up arrow.
    const bottomRow = window.document.querySelector('li[data-index="0"]');
    const upBtn = Array.from(bottomRow.querySelectorAll('button'))
        .find(b => b.textContent === '\u2191');
    upBtn.onclick();

    // Layer 1 was at index 0; now should be at index 1.
    const names = draw.getLayers().map(l => l.name).join(',');
    assert.strictEqual(names, 'B,Layer 1,C');
});

test('cannot delete the last layer (refuses silently)', () => {
    const { window, draw, ui } = bootUi();
    ui.open();
    const row = window.document.querySelector('li[data-index="0"]');
    const delBtnX = Array.from(row.querySelectorAll('button'))
        .find(b => b.textContent === '\u00d7');
    delBtnX.onclick({ stopPropagation: () => {} });
    // Still one layer.
    assert.strictEqual(draw.getLayerCount(), 1);
});
