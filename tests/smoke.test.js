const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const { makeDom, ALL_SCRIPTS, REPO } = require('./harness');

test('every js file parses with node -c', () => {
    for (const name of ALL_SCRIPTS) {
        const result = spawnSync(process.execPath, ['--check', path.join(REPO, name)], {
            encoding: 'utf8'
        });
        assert.strictEqual(
            result.status, 0,
            `${name} failed to parse:\n${result.stderr}`
        );
    }
});

test('all scripts load and populate AR.R11 namespace', () => {
    const { window } = makeDom({ excludeOnload: true });
    const AR = window.AR;
    assert.ok(AR, 'AR global missing');
    assert.ok(AR.R11, 'AR.R11 missing');
    assert.strictEqual(typeof AR.R11.Canvas, 'function', 'Canvas class');
    assert.strictEqual(typeof AR.R11.canvas, 'function', 'canvas factory');
    assert.strictEqual(typeof AR.R11.Text, 'function', 'Text class');
    assert.strictEqual(typeof AR.R11.Button, 'function', 'Button class');
    assert.strictEqual(typeof AR.R11.Ball, 'function', 'Ball class');
    assert.strictEqual(typeof AR.R11.HUD, 'function', 'HUD class');
    assert.strictEqual(typeof AR.R11.home, 'object', 'home module');
    assert.strictEqual(typeof AR.R11.home.init, 'function', 'home.init');
    assert.strictEqual(typeof AR.R11.draw, 'object', 'draw module');
    assert.strictEqual(typeof AR.R11.draw.init, 'function', 'draw.init');
    assert.strictEqual(typeof AR.R11.draw.setBall, 'function', 'draw.setBall');
});

test('home.init runs without throwing', () => {
    const { window } = makeDom({ excludeOnload: true });
    window.AR.R11.home.init();
});

test('draw.init runs without throwing', () => {
    const { window } = makeDom({
        scripts: ['init.js', 'canvas.js', 'font.js', 'text.js', 'buttons.js', 'ball.js', 'hud.js', 'draw.js'],
        excludeOnload: true
    });
    window.AR.R11.draw.init();
});
