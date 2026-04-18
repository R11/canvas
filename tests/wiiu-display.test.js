// Sanity checks that the new DOM-based UIs (Library + Layers) render
// readable on the Wii U gamepad screen (854 x 480), since the project
// originally targeted that device. We don't try to verify exact rendered
// pixels — that would need a real layout engine — but we do assert that
// nothing exceeds the viewport, font sizes meet a 14px floor, and the
// touch-target padding is generous.

const test = require('node:test');
const assert = require('node:assert');
const { makeDom } = require('./harness');

const WIIU = { width: 854, height: 480 };

const DRAW_SCRIPTS = [
    'init.js', 'canvas.js', 'font.js', 'text.js', 'buttons.js', 'ball.js',
    'hud.js', 'store.js', 'draw.js', 'library-ui.js', 'layer-ui.js'
];

function bootWiiu() {
    const { window } = makeDom({
        scripts: DRAW_SCRIPTS,
        excludeOnload: true,
        viewport: WIIU
    });
    window.AR.R11.draw.init();
    return { window };
}

function pxOf(value) {
    if (!value) { return 0; }
    const m = String(value).match(/^([\d.]+)px$/);
    return m ? parseFloat(m[1]) : 0;
}

function maxOfStyle(window, selector, prop) {
    return Array.from(window.document.querySelectorAll(selector))
        .map(el => pxOf(el.style[prop]))
        .reduce((a, b) => Math.max(a, b), 0);
}

function minOfStyle(window, selector, prop) {
    const all = Array.from(window.document.querySelectorAll(selector))
        .map(el => pxOf(el.style[prop]))
        .filter(n => n > 0);
    return all.length ? all.reduce((a, b) => Math.min(a, b), Infinity) : 0;
}

test('window.innerWidth/Height reflect 854x480 in this harness', () => {
    const { window } = bootWiiu();
    assert.strictEqual(window.innerWidth, 854);
    assert.strictEqual(window.innerHeight, 480);
});

test('library modal panel fits within 854x480 with margin', () => {
    const { window } = bootWiiu();
    window.AR.R11.libraryUI.open();
    const panel = window.document.querySelector('[role="dialog"][aria-modal="true"] > div');
    assert.ok(panel);
    // Width is set as min(560px, 92vw); 92vw of 854 = 786px. So 560px wins.
    // Either way it must stay under the viewport width.
    assert.ok(pxOf(panel.style.width) <= 560,
        `panel width ${panel.style.width} should not exceed 560px`);
});

test('layer panel fits to the right within 854x480 with canvas room left', () => {
    const { window } = bootWiiu();
    window.AR.R11.layerUI.open();
    const panel = window.document.querySelector('[role="dialog"][aria-label="Layers"]');
    const w = pxOf(panel.style.width.replace(/min\([^)]*\)/, '360'));
    const right = pxOf(panel.style.right);
    // Reserve at least 400px of canvas width for the drawing surface.
    assert.ok(w + right * 2 <= 854 - 400,
        `panel width ${w}px + margin should leave at least 400px for canvas`);
});

test('library modal: every button uses ≥14px font and ≥6px vertical padding', async () => {
    const { window } = bootWiiu();
    // Seed one record so per-row Load/Delete buttons render.
    const draw = window.AR.R11.draw;
    draw.importPixels(new Uint8ClampedArray(8 * 8 * 4), 8, 8);
    await draw.saveToLibrary({ name: 'one' });

    window.AR.R11.libraryUI.open();
    await window.AR.R11.libraryUI.refresh();

    const buttons = Array.from(window.document.querySelectorAll('[role="dialog"] button'));
    assert.ok(buttons.length >= 4, 'expected several buttons in the modal');
    for (const btn of buttons) {
        const fs = pxOf(btn.style.fontSize);
        // The × close button intentionally uses a larger font but no padding-y
        // requirement; everything else needs the 14px floor.
        if (btn.textContent === '×') {
            assert.ok(fs >= 18, `× close font ${fs}px should be at least 18px`);
            continue;
        }
        assert.ok(fs >= 14,
            `button "${btn.textContent}" font ${fs}px should be at least 14px`);
        const padding = btn.style.padding || '';
        const pyMatch = padding.match(/^(\d+)px/);
        assert.ok(pyMatch && parseInt(pyMatch[1], 10) >= 6,
            `button "${btn.textContent}" vertical padding ${padding} should be at least 6px`);
    }
});

test('library modal: list rows use ≥13px font for meta, ≥14px for name', async () => {
    const { window } = bootWiiu();
    const draw = window.AR.R11.draw;
    draw.importPixels(new Uint8ClampedArray(8 * 8 * 4), 8, 8);
    await draw.saveToLibrary({ name: 'a record' });
    window.AR.R11.libraryUI.open();
    await window.AR.R11.libraryUI.refresh();

    const li = window.document.querySelector('li[data-id]');
    assert.ok(li);
    const [name, meta] = Array.from(li.querySelectorAll('div > div'));
    assert.ok(pxOf(name.style.fontSize) >= 14, `name font ${name.style.fontSize}`);
    assert.ok(pxOf(meta.style.fontSize) >= 13, `meta font ${meta.style.fontSize}`);
});

test('layer panel: every interactive element uses ≥14px font', () => {
    const { window } = bootWiiu();
    window.AR.R11.draw.addLayer({ name: 'Two' });
    window.AR.R11.layerUI.open();

    // Buttons
    const buttons = Array.from(window.document.querySelectorAll('[role="dialog"][aria-label="Layers"] button'));
    for (const btn of buttons) {
        const fs = pxOf(btn.style.fontSize);
        if (btn.textContent === '×' && btn.getAttribute('aria-label') === 'Close') {
            assert.ok(fs >= 18, `panel close × font ${fs}px ≥ 18`);
            continue;
        }
        assert.ok(fs >= 14, `button "${btn.textContent}" font ${fs}px ≥ 14`);
    }

    // Layer name spans
    const names = Array.from(window.document.querySelectorAll('li[data-index] span'));
    for (const n of names) {
        assert.ok(pxOf(n.style.fontSize) >= 14,
            `layer name font ${n.style.fontSize} ≥ 14`);
    }
});

test('layer panel: visibility checkbox is at least 16x16px', () => {
    const { window } = bootWiiu();
    window.AR.R11.layerUI.open();
    const box = window.document.querySelector('li[data-index] input[type="checkbox"]');
    assert.ok(pxOf(box.style.width) >= 16, `checkbox width ${box.style.width} ≥ 16`);
    assert.ok(pxOf(box.style.height) >= 16, `checkbox height ${box.style.height} ≥ 16`);
});
