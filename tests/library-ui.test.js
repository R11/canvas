const test = require('node:test');
const assert = require('node:assert');
const { makeDom } = require('./harness');

const DRAW_SCRIPTS = [
    'init.js', 'canvas.js', 'font.js', 'buttons.js', 'ball.js',
    'hud.js', 'store.js', 'draw.js', 'library-ui.js'
];

function bootUi() {
    const { window } = makeDom({ scripts: DRAW_SCRIPTS, excludeOnload: true });
    window.AR.R11.draw.init();
    return { window, draw: window.AR.R11.draw, ui: window.AR.R11.libraryUI };
}

function solidPixels(w, h, r, g, b, a) {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i += 1) {
        data[i * 4] = r; data[i * 4 + 1] = g;
        data[i * 4 + 2] = b; data[i * 4 + 3] = a;
    }
    return data;
}

// Walk rendered <li> elements and pull out their displayed name.
function listedNames(window) {
    return Array.from(window.document.querySelectorAll('li[data-id] div[style*="font-weight"]'))
        .map(el => el.textContent);
}

function findButtonInItem(window, id, label) {
    const li = window.document.querySelector(`li[data-id="${id}"]`);
    if (!li) { return null; }
    return Array.from(li.querySelectorAll('button')).find(b => b.textContent === label);
}

test('libraryUI exposes open/close/toggle/isOpen/refresh', () => {
    const { ui } = bootUi();
    assert.strictEqual(typeof ui.open, 'function');
    assert.strictEqual(typeof ui.close, 'function');
    assert.strictEqual(typeof ui.toggle, 'function');
    assert.strictEqual(typeof ui.isOpen, 'function');
    assert.strictEqual(typeof ui.refresh, 'function');
});

test('open mounts a modal, close removes it', async () => {
    const { window, ui } = bootUi();
    assert.strictEqual(ui.isOpen(), false);

    ui.open();
    await ui.refresh();
    assert.strictEqual(ui.isOpen(), true);
    assert.ok(window.document.querySelector('[role="dialog"]'),
        'dialog element is in the DOM');

    ui.close();
    assert.strictEqual(ui.isOpen(), false);
    assert.strictEqual(window.document.querySelector('[role="dialog"]'), null);
});

test('toggle flips state', () => {
    const { ui } = bootUi();
    ui.toggle();
    assert.strictEqual(ui.isOpen(), true);
    ui.toggle();
    assert.strictEqual(ui.isOpen(), false);
});

test('keyboard shortcut N toggles the modal', () => {
    const { window, ui } = bootUi();
    window.onkeydown({ keyCode: 78 });
    assert.strictEqual(ui.isOpen(), true);
    window.onkeydown({ keyCode: 78 });
    assert.strictEqual(ui.isOpen(), false);
});

test('empty library shows an empty-state message', async () => {
    const { window, ui } = bootUi();
    ui.open();
    await ui.refresh();
    const empty = window.document.querySelector('li[style*="italic"]');
    assert.ok(empty, 'empty-state li present');
    assert.match(empty.textContent, /No saved drawings/i);
});

test('rendered list contains each saved record by name', async () => {
    const { window, draw, ui } = bootUi();
    draw.importPixels(solidPixels(4, 4, 1, 2, 3, 255), 4, 4);
    await draw.saveToLibrary({ id: 'r1', name: 'First' });
    draw.importPixels(solidPixels(6, 6, 4, 5, 6, 255), 6, 6);
    await draw.saveToLibrary({ id: 'r2', name: 'Second' });

    ui.open();
    await ui.refresh();

    const names = listedNames(window);
    assert.deepStrictEqual(names.sort(), ['First', 'Second']);
});

test('clicking Load restores the drawing and closes the modal', async () => {
    const { window, draw, ui } = bootUi();
    draw.importPixels(solidPixels(12, 8, 200, 100, 50, 255), 12, 8);
    await draw.saveToLibrary({ id: 'loadme', name: 'Reload Target' });

    // Replace with something else before loading.
    draw.importPixels(solidPixels(4, 4, 0, 0, 0, 255), 4, 4);

    ui.open();
    await ui.refresh();

    const loadBtn = findButtonInItem(window, 'loadme', 'Load');
    assert.ok(loadBtn, 'Load button rendered');
    loadBtn.click();

    // Give the load promise a tick to resolve.
    await new Promise(r => setTimeout(r, 10));

    assert.strictEqual(ui.isOpen(), false, 'modal closed after load');
    const size = draw.getCanvasSize();
    assert.strictEqual(size.width, 12);
    assert.strictEqual(size.height, 8);
    const buf = draw.getPixelBuffer();
    assert.strictEqual(buf[0], 200);
});

test('clicking Delete removes the record and refreshes the list', async () => {
    const { window, draw, ui } = bootUi();
    draw.importPixels(solidPixels(8, 8, 1, 2, 3, 255), 8, 8);
    await draw.saveToLibrary({ id: 'keep', name: 'Keep' });
    await draw.saveToLibrary({ id: 'gone', name: 'Gone' });

    ui.open();
    await ui.refresh();
    assert.strictEqual(listedNames(window).length, 2);

    const deleteBtn = findButtonInItem(window, 'gone', 'Delete');
    deleteBtn.click();
    await new Promise(r => setTimeout(r, 10));

    const names = listedNames(window);
    assert.strictEqual(names.length, 1);
    assert.strictEqual(names[0], 'Keep');
});

test('Save Current button persists with the name in the input', async () => {
    const { window, draw, ui } = bootUi();
    draw.importPixels(solidPixels(4, 4, 9, 9, 9, 255), 4, 4);

    ui.open();
    await ui.refresh();

    const input = window.document.querySelector('input[type="text"]');
    input.value = 'My Drawing';
    const saveBtn = Array.from(window.document.querySelectorAll('button'))
        .find(b => b.textContent === 'Save Current');
    saveBtn.click();
    await new Promise(r => setTimeout(r, 10));

    const list = await draw.listLibrary();
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].name, 'My Drawing');
});

test('clicking the backdrop closes the modal', () => {
    const { window, ui } = bootUi();
    ui.open();
    const dialog = window.document.querySelector('[role="dialog"]');
    assert.ok(dialog);
    // Simulate a click directly on the dialog backdrop (target === root)
    dialog.onclick({ target: dialog });
    assert.strictEqual(ui.isOpen(), false);
});
