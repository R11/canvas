// Responsive-layout tests across the viewports the project targets:
//   - Mobile portrait  (375 x 667, iPhone-ish)
//   - Mobile landscape (667 x 375)
//   - Wii U gamepad    (854 x 480)
//   - 4:3              (1024 x 768)
//   - Standard laptop  (1366 x 768)
// Modals should adapt layout: "sheet" on narrow viewports (no room to dock
// a side panel) and "dock" on wider viewports. Layer panel in dock mode
// must still leave room for the canvas.

const test = require('node:test');
const assert = require('node:assert');
const { makeDom } = require('./harness');

const DRAW_SCRIPTS = [
    'init.js', 'canvas.js', 'font.js', 'buttons.js', 'ball.js',
    'hud.js', 'store.js', 'draw.js', 'library-ui.js', 'layer-ui.js'
];

const VIEWPORTS = {
    mobilePortrait:  { name: 'mobile portrait',  width: 375,  height: 667 },
    mobileLandscape: { name: 'mobile landscape', width: 667,  height: 375 },
    wiiu:            { name: 'Wii U gamepad',    width: 854,  height: 480 },
    fourThree:       { name: '4:3',              width: 1024, height: 768 },
    laptop:          { name: 'standard laptop',  width: 1366, height: 768 }
};

function boot(viewport) {
    const { window } = makeDom({
        scripts: DRAW_SCRIPTS,
        excludeOnload: true,
        viewport
    });
    window.AR.R11.draw.init();
    return { window };
}

function pxOf(value) {
    if (!value) { return 0; }
    const m = String(value).match(/^([\d.]+)px$/);
    return m ? parseFloat(m[1]) : 0;
}

test('viewportClass classifies each target correctly', () => {
    function clsOf(vp) {
        const { window } = boot(vp);
        return window.AR.R11.viewportClass();
    }
    assert.strictEqual(clsOf(VIEWPORTS.mobilePortrait).narrow, true,  'mobile portrait narrow');
    assert.strictEqual(clsOf(VIEWPORTS.mobilePortrait).short,  false, 'mobile portrait not short');
    assert.strictEqual(clsOf(VIEWPORTS.mobileLandscape).narrow, false, 'landscape not narrow');
    assert.strictEqual(clsOf(VIEWPORTS.mobileLandscape).short, true,   'landscape short');
    assert.strictEqual(clsOf(VIEWPORTS.wiiu).narrow, false, 'Wii U not narrow');
    assert.strictEqual(clsOf(VIEWPORTS.wiiu).short, true,   'Wii U short');
    assert.strictEqual(clsOf(VIEWPORTS.fourThree).narrow, false, '4:3 wide');
    assert.strictEqual(clsOf(VIEWPORTS.fourThree).short, false,  '4:3 tall');
    assert.strictEqual(clsOf(VIEWPORTS.laptop).narrow, false, 'laptop wide');
    assert.strictEqual(clsOf(VIEWPORTS.laptop).short, false,  'laptop tall');
});

test('library modal: narrow viewport switches to sheet layout', () => {
    const { window } = boot(VIEWPORTS.mobilePortrait);
    window.AR.R11.libraryUI.open();
    const panel = window.document.querySelector('[data-viewport]');
    assert.ok(panel);
    assert.strictEqual(panel.getAttribute('data-viewport'), 'narrow');
    assert.strictEqual(panel.style.width, '96vw');
});

test('library modal: standard viewports use capped width', () => {
    for (const key of ['fourThree', 'laptop']) {
        const { window } = boot(VIEWPORTS[key]);
        window.AR.R11.libraryUI.open();
        const panel = window.document.querySelector('[data-viewport]');
        assert.strictEqual(panel.getAttribute('data-viewport'), 'standard',
            `${VIEWPORTS[key].name} should use standard layout`);
        assert.match(panel.style.width, /min\(640px, 92vw\)/,
            `${VIEWPORTS[key].name} should use 640px cap`);
    }
});

test('library modal: Wii U (wide but short) is classified "short", tightens padding', () => {
    const { window } = boot(VIEWPORTS.wiiu);
    window.AR.R11.libraryUI.open();
    const panel = window.document.querySelector('[data-viewport]');
    assert.strictEqual(panel.getAttribute('data-viewport'), 'short');
    assert.strictEqual(panel.style.padding, '12px',
        'short viewports use tighter padding');
});

test('layer panel: narrow viewport becomes a full-sheet modal', () => {
    const { window } = boot(VIEWPORTS.mobilePortrait);
    window.AR.R11.layerUI.open();
    const panel = window.document.querySelector('[aria-label="Layers"]');
    assert.ok(panel);
    assert.strictEqual(panel.getAttribute('data-viewport'), 'sheet');
    // Sheet-mode panel should be wrapped in a backdrop that fills the viewport.
    const backdrop = window.document.querySelector('[data-layer-ui-backdrop]');
    assert.ok(backdrop, 'sheet mode wraps panel in a backdrop');
});

test('layer panel: desktop / laptop / 4:3 use dock mode', () => {
    for (const key of ['fourThree', 'laptop']) {
        const { window } = boot(VIEWPORTS[key]);
        window.AR.R11.layerUI.open();
        const panel = window.document.querySelector('[aria-label="Layers"]');
        assert.strictEqual(panel.getAttribute('data-viewport'), 'dock',
            `${VIEWPORTS[key].name} uses dock mode`);
        assert.strictEqual(panel.style.position, 'fixed');
        assert.strictEqual(panel.style.right, '12px');
        assert.strictEqual(window.document.querySelector('[data-layer-ui-backdrop]'), null,
            'dock mode has no backdrop');
    }
});

test('layer panel: Wii U is "dock-short" (docked but tighter)', () => {
    const { window } = boot(VIEWPORTS.wiiu);
    window.AR.R11.layerUI.open();
    const panel = window.document.querySelector('[aria-label="Layers"]');
    assert.strictEqual(panel.getAttribute('data-viewport'), 'dock-short');
    assert.strictEqual(panel.style.padding, '8px');
});

test('layer panel dock width caps at 42vw so the canvas stays usable', () => {
    const { window } = boot(VIEWPORTS.wiiu);
    window.AR.R11.layerUI.open();
    const panel = window.document.querySelector('[aria-label="Layers"]');
    // Panel width is CSS min(360px, 42vw). On 854 viewport, 42vw ≈ 358px.
    assert.match(panel.style.width, /min\(360px, 42vw\)/);
    // Sanity: assert the numeric cap leaves canvas room.
    const panelMaxPx = Math.min(360, 854 * 0.42);
    assert.ok(854 - panelMaxPx >= 480,
        `Wii U: at least 480px of canvas should remain (got ${854 - panelMaxPx}px)`);
});

test('layer panel: mobile landscape (short + wide enough to dock)', () => {
    // 667 wide > 640 so it docks. 375 tall is "short", so expect dock-short.
    const { window } = boot(VIEWPORTS.mobileLandscape);
    window.AR.R11.layerUI.open();
    const panel = window.document.querySelector('[aria-label="Layers"]');
    assert.strictEqual(panel.getAttribute('data-viewport'), 'dock-short');
});

test('library list uses flex so it fills available height regardless of viewport', () => {
    const { window } = boot(VIEWPORTS.laptop);
    window.AR.R11.libraryUI.open();
    const list = window.document.querySelector('[role="dialog"] ul');
    // flex: "1 1 auto" means the list expands to fill the remaining space.
    assert.match(list.style.flex, /1 1 auto/);
    assert.strictEqual(list.style.overflowY, 'auto');
});

test('layer list also uses flex for variable heights', () => {
    const { window } = boot(VIEWPORTS.fourThree);
    window.AR.R11.layerUI.open();
    const list = window.document.querySelector('[aria-label="Layers"] ul');
    assert.match(list.style.flex, /1 1 auto/);
});
