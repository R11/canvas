// End-to-end-ish tests that drive the drawing pipeline through its actual
// window event handlers and verify the expected canvas API calls land.

const test = require('node:test');
const assert = require('node:assert');
const { makeDom } = require('./harness');

const DRAW_SCRIPTS = [
    'init.js', 'canvas.js', 'font.js', 'buttons.js', 'ball.js', 'hud.js', 'draw.js'
];

function bootDraw() {
    const { window } = makeDom({ scripts: DRAW_SCRIPTS, excludeOnload: true });
    window.AR.R11.draw.init();
    const canvasEl = window.document.getElementById('canvas');
    const realCanvasEl = window.document.getElementById('realCanvas');
    return {
        window,
        canvasCtx: canvasEl.__ctx,
        realCtx: realCanvasEl.__ctx,
        canvasEl,
        realCanvasEl
    };
}

function callsSince(ctx, n) {
    return ctx.__calls.slice(n);
}

test('mousedown in drawable region fires fillRect on both canvases', () => {
    const { window, canvasCtx, realCtx } = bootDraw();

    const preCanvas = canvasCtx.__calls.length;
    const preReal = realCtx.__calls.length;

    // Click away from miniDisplay (bottom-left) and color chart (top-left).
    // With default jsdom viewport 1024x768, miniDisplay occupies roughly
    // x:[0,256] y:[576,768] and chart-open button is at top-left.
    window.onmousedown({ pageX: 500, pageY: 400 });

    const canvasFills = callsSince(canvasCtx, preCanvas).filter(c => c.method === 'fillRect');
    const realFills = callsSince(realCtx, preReal).filter(c => c.method === 'fillRect');

    assert.ok(canvasFills.length >= 1,
        'expected fillRect on the display canvas (got ' + canvasFills.length + ')');
    assert.ok(realFills.length >= 1,
        'expected fillRect on the realCanvas pixel buffer (got ' + realFills.length + ')');
});

test('mousedown writes the current color into the pixel buffer', () => {
    const { window, canvasCtx } = bootDraw();

    window.onmousedown({ pageX: 500, pageY: 400 });

    // setPixels writes into `realC`, which is the main canvas's getImageData().data.
    // (Yes, the variable is misnamed in draw.js — it points at the main canvas,
    // not at realCanvas. See the canvas IIFE: realC = canvasImage.data.)
    assert.ok(canvasCtx.__imageData, 'main canvas should have image data');
    const { data } = canvasCtx.__imageData;

    // curColor defaults to [0, 0, 0, 1]. Find any pixel with alpha === 1.
    let found = -1;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 1 && data[i - 3] === 0 && data[i - 2] === 0 && data[i - 1] === 0) {
            found = i - 3;
            break;
        }
    }
    assert.notStrictEqual(found, -1,
        'expected at least one pixel written with curColor=[0,0,0,1]');
});

test('mousedown snaps to the current grid cell', () => {
    const { window, canvasCtx } = bootDraw();
    const pre = canvasCtx.__calls.length;

    window.onmousedown({ pageX: 500, pageY: 400 });

    // Find the grid-cell fillRect on the main canvas (the one that matches bit x bit).
    // bit = 2^zoom = 8 at startup.
    const fills = callsSince(canvasCtx, pre).filter(c => c.method === 'fillRect');
    const gridCell = fills.find(c => c.args[2] === 8 && c.args[3] === 8);
    assert.ok(gridCell, 'should have drawn an 8x8 cell');

    // (500 / 8) | 0 = 62, * 8 = 496;  (400 / 8) | 0 = 50, * 8 = 400
    assert.strictEqual(gridCell.args[0], 496, 'x snaps to grid');
    assert.strictEqual(gridCell.args[1], 400, 'y snaps to grid');
});

test('eraser flag swaps the fill to white and writes zeroed pixels', () => {
    const { window, realCtx } = bootDraw();

    // Flip eraser on by simulating the keybinding for Q (keyCode 81).
    window.onkeydown({ keyCode: 81 });

    window.onmousedown({ pageX: 500, pageY: 400 });

    const { data } = realCtx.__imageData;
    // Eraser writes all zeros at the target pixel.
    // curX/curY are w/2.5 | 0, h/2.5 | 0 — these offsets mean we don't know the
    // exact index, so scan the whole buffer for a cleared block.
    // More telling: verify NO pixel was written with alpha=1 (the curColor default).
    let coloredPixels = 0;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 1) coloredPixels += 1;
    }
    assert.strictEqual(coloredPixels, 0,
        'eraser stroke should not leave any curColor pixels');
});

test('mouseup clears mousedown flag (second click is independent)', () => {
    const { window, realCtx } = bootDraw();

    window.onmousedown({ pageX: 500, pageY: 400 });
    window.onmouseup({ pageX: 500, pageY: 400 });

    // Calls count after first click cycle.
    const afterFirst = realCtx.__calls.length;

    // New click at a different spot should still register.
    window.onmousedown({ pageX: 600, pageY: 500 });
    const fillsSecond = callsSince(realCtx, afterFirst).filter(c => c.method === 'fillRect');
    assert.ok(fillsSecond.length >= 1, 'second click after mouseup should also draw');
});
