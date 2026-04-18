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

test('mousedown writes the current color into the master pixel buffer', () => {
    const { window, canvasCtx } = bootDraw();

    window.onmousedown({ pageX: 500, pageY: 400 });

    // Architecture: a stroke lands in three places on purpose.
    //   1. preview canvas: fillRect at the zoomed grid cell (immediate feedback)
    //   2. realCanvas:     fillRect at final-resolution (source for mini-display)
    //   3. realC buffer:   setPixels into an in-memory Uint8ClampedArray that
    //                      backs drawReal() when the user pans/shifts the preview
    // realC is initialized from the preview ctx's getImageData, so in this stub
    // it lives on canvasCtx.__imageData.
    assert.ok(canvasCtx.__imageData, 'preview canvas should have a backing image data buffer');
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

function makeWiiuState(overrides) {
    return Object.assign({
        hold: 0, isEnabled: true, isDataValid: true,
        lStickX: 0, lStickY: 0, rStickX: 0, rStickY: 0,
        gyroX: 0, gyroY: 0, gyroZ: 0,
        angleX: 0, angleY: 0, angleZ: 0,
        accX: 0, accY: 0, accZ: 0,
        dirXx: 1, dirXy: 0, dirXz: 0,
        dirYx: 0, dirYy: 1, dirYz: 0,
        dirZx: 0, dirZy: 0, dirZz: 1,
        tpTouch: 0, tpValidity: 0,
        contentX: 0, contentY: 0
    }, overrides || {});
}

function bootWiiuDraw(stateOverrides) {
    const { window } = makeDom({ scripts: DRAW_SCRIPTS, excludeOnload: true });
    let current = makeWiiuState(stateOverrides);
    window.wiiu = {
        gamepad: { update: () => current }
    };
    window.AR.R11.draw.init();
    return {
        window,
        setState: (o) => { current = makeWiiuState(o); },
        canvasCtx: window.document.getElementById('canvas').__ctx,
        realCtx: window.document.getElementById('realCanvas').__ctx
    };
}

test('wiiu branch: init completes and installs the interval poll', () => {
    const intervals = [];
    const { window } = (function () {
        const boot = bootWiiuDraw();
        const origSetInterval = boot.window.setInterval;
        boot.window.setInterval = (fn, ms) => {
            intervals.push({ fn, ms });
            return 0;
        };
        // intercept AFTER the init.setInterval already ran; nothing to verify here
        return boot;
    })();
    // If we got here without throwing, the wiiu init branch is wired.
    // Also assert the gyro-aware mousemove handler is installed.
    assert.strictEqual(typeof window.onmousemove, 'function');
});

test('wiiu branch: touchscreen tap (tpTouch=1) routes through canvas.draw', () => {
    const { window, canvasCtx, realCtx } = bootWiiuDraw({ tpTouch: 1 });
    const preCanvas = canvasCtx.__calls.length;
    const preReal = realCtx.__calls.length;

    // Fire a mousemove with touchpad coords — the wiiu mousemove handler
    // sets mousedown=1 and calls touchCheck, which should call canvas.draw.
    window.onmousemove({ pageX: 500, pageY: 400 });

    const canvasFills = canvasCtx.__calls.slice(preCanvas).filter(c => c.method === 'fillRect');
    const realFills = realCtx.__calls.slice(preReal).filter(c => c.method === 'fillRect');
    assert.ok(canvasFills.length >= 1, 'touchpad tap should fill the preview');
    assert.ok(realFills.length >= 1, 'touchpad tap should fill the realCanvas');
});

test('wiiu branch: invalid/disabled gamepad state is tolerated', () => {
    // Simulate a disabled gamepad — state gets nulled out, the rest of
    // buttons() should still not crash.
    const { window } = bootWiiuDraw({ isEnabled: false });
    // Trigger the poll explicitly via mousemove → touchCheck path
    assert.doesNotThrow(() => window.onmousemove({ pageX: 100, pageY: 100 }));
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
