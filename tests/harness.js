// Shared test harness: loads the repo scripts into a jsdom window
// and stubs canvas 2D contexts so the code can run headlessly.

const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const REPO = path.resolve(__dirname, '..');

// Scripts in dependency order (same as index.html + draw.js at the end).
const ALL_SCRIPTS = [
    'init.js',
    'canvas.js',
    'font.js',
    'buttons.js',
    'ball.js',
    'hud.js',
    'home.js',
    'draw.js'
];

function makeCtxStub() {
    // Proxy so any property access returns a no-op function and writes succeed.
    const store = { canvas: null, lineWidth: 1, fillStyle: '#000', strokeStyle: '#000' };
    return new Proxy(store, {
        get(target, prop) {
            if (prop in target) return target[prop];
            if (prop === 'getImageData') {
                return (sx, sy, sw, sh) => ({
                    data: new Uint8ClampedArray(Math.max(1, sw * sh * 4)),
                    width: sw, height: sh
                });
            }
            if (prop === 'createImageData') {
                return (w, h) => ({
                    data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
                    width: w, height: h
                });
            }
            // everything else is a no-op drawing call
            return () => undefined;
        },
        set(target, prop, value) {
            target[prop] = value;
            return true;
        }
    });
}

function makeDom({ scripts = ALL_SCRIPTS, excludeOnload = false } = {}) {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost/',
        runScripts: 'dangerously',
        pretendToBeVisual: true
    });
    const { window } = dom;
    window.HTMLCanvasElement.prototype.getContext = function () {
        if (!this.__ctx) {
            const ctx = makeCtxStub();
            ctx.canvas = this;
            this.__ctx = ctx;
        }
        return this.__ctx;
    };
    window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';
    window.Image = class {
        constructor() { this.width = 100; this.height = 100; this.src = ''; this.name = ''; }
    };
    window.open = () => null;

    // Inject each script as a <script> tag so it runs in the window's global scope
    // with `window`, `document`, etc. as free variables (matching browser semantics).
    for (const name of scripts) {
        const code = fs.readFileSync(path.join(REPO, name), 'utf8');
        const script = window.document.createElement('script');
        script.textContent = code;
        window.document.head.appendChild(script);
    }
    if (excludeOnload) {
        window.onload = null;
    }
    return { dom, window };
}

module.exports = { makeDom, makeCtxStub, ALL_SCRIPTS, REPO };
