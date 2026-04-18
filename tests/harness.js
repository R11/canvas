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
    'store.js',
    'home.js',
    'draw.js'
];

function makeCtxStub() {
    const store = {
        canvas: null,
        lineWidth: 1,
        fillStyle: '#000',
        strokeStyle: '#000',
        __calls: [],
        __imageData: null
    };
    return new Proxy(store, {
        get(target, prop) {
            if (prop in target) return target[prop];
            if (prop === 'getImageData') {
                return (sx, sy, sw, sh) => {
                    // Cache ImageData per ctx so setPixels writes persist across calls.
                    if (!target.__imageData ||
                        target.__imageData.width !== sw ||
                        target.__imageData.height !== sh) {
                        target.__imageData = {
                            data: new Uint8ClampedArray(Math.max(1, sw * sh * 4)),
                            width: sw, height: sh
                        };
                    }
                    target.__calls.push({ method: 'getImageData', args: [sx, sy, sw, sh] });
                    return target.__imageData;
                };
            }
            if (prop === 'createImageData') {
                return (w, h) => ({
                    data: new Uint8ClampedArray(Math.max(1, w * h * 4)),
                    width: w, height: h
                });
            }
            // Any other method is recorded as a no-op.
            return (...args) => {
                target.__calls.push({ method: prop, args });
                return undefined;
            };
        },
        set(target, prop, value) {
            target[prop] = value;
            if (!prop.startsWith('__')) {
                target.__calls.push({ method: 'set:' + prop, value });
            }
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
    // jsdom's toBlob stub logs an error and never calls the callback — that
    // hangs exportImage. Deleting the method forces draw.js's fallback
    // toDataURL branch.
    delete window.HTMLCanvasElement.prototype.toBlob;
    window.Image = class {
        constructor() { this.width = 100; this.height = 100; this.src = ''; this.name = ''; }
    };
    window.open = () => null;

    // Install fake-indexeddb so AR.R11.store can run in tests. Each call
    // creates a fresh in-memory DB (new FDBFactory), isolated per-window.
    const { IDBFactory } = require('fake-indexeddb');
    window.indexedDB = new IDBFactory();

    // Capture setInterval/setTimeout callbacks instead of actually scheduling them.
    // Otherwise the wiiu init branch keeps the jsdom event loop alive and the
    // node test runner hangs forever.
    window.__intervals = [];
    window.__timeouts = [];
    window.setInterval = function (fn, ms) {
        window.__intervals.push({ fn, ms });
        return window.__intervals.length;
    };
    window.setTimeout = function (fn, ms) {
        window.__timeouts.push({ fn, ms });
        return window.__timeouts.length;
    };
    window.clearInterval = () => undefined;
    window.clearTimeout = () => undefined;

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
