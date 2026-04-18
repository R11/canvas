const test = require('node:test');
const assert = require('node:assert');
const { makeDom } = require('./harness');

function bootStore() {
    const { window } = makeDom({
        scripts: ['init.js', 'store.js'],
        excludeOnload: true
    });
    return { window, store: window.AR.R11.store };
}

function sampleRecord(overrides) {
    return Object.assign({
        id: 'd_test_1',
        name: 'Untitled',
        width: 64,
        height: 64,
        layers: [{
            name: 'Layer 1',
            opacity: 1,
            visible: true,
            data: new Uint8ClampedArray(64 * 64 * 4)
        }]
    }, overrides || {});
}

test('store exposes put/get/list/delete/clear/newId', () => {
    const { store } = bootStore();
    assert.strictEqual(typeof store.put, 'function');
    assert.strictEqual(typeof store.get, 'function');
    assert.strictEqual(typeof store.list, 'function');
    assert.strictEqual(typeof store.delete, 'function');
    assert.strictEqual(typeof store.clear, 'function');
    assert.strictEqual(typeof store.newId, 'function');
});

test('put then get roundtrips a record', async () => {
    const { store } = bootStore();
    const rec = sampleRecord();
    await store.put(rec);
    const back = await store.get(rec.id);
    assert.strictEqual(back.id, rec.id);
    assert.strictEqual(back.name, 'Untitled');
    assert.strictEqual(back.width, 64);
    assert.strictEqual(back.layers.length, 1);
    assert.ok(back.layers[0].data instanceof Uint8ClampedArray);
});

test('put adds createdAt and updates updatedAt', async () => {
    const { store } = bootStore();
    const rec = sampleRecord();
    const before = Date.now();
    const saved = await store.put(rec);
    assert.ok(saved.createdAt >= before);
    assert.ok(saved.updatedAt >= saved.createdAt);

    // A second put should bump updatedAt but leave createdAt alone.
    const origCreated = saved.createdAt;
    await new Promise(r => setTimeout(r, 5));
    const resaved = await store.put(saved);
    assert.strictEqual(resaved.createdAt, origCreated);
    assert.ok(resaved.updatedAt >= origCreated);
});

test('put rejects records without an id', async () => {
    const { store } = bootStore();
    await assert.rejects(() => store.put({ name: 'no-id' }),
        /record\.id is required/);
});

test('list returns newest-first by updatedAt', async () => {
    const { store } = bootStore();
    await store.put(sampleRecord({ id: 'a' }));
    await new Promise(r => setTimeout(r, 3));
    await store.put(sampleRecord({ id: 'b' }));
    await new Promise(r => setTimeout(r, 3));
    await store.put(sampleRecord({ id: 'c' }));
    // Bump 'a' to newest
    await new Promise(r => setTimeout(r, 3));
    const a = await store.get('a');
    await store.put(a);
    const all = await store.list();
    assert.deepStrictEqual(all.map(r => r.id), ['a', 'c', 'b']);
});

test('delete removes the record', async () => {
    const { store } = bootStore();
    await store.put(sampleRecord({ id: 'to-delete' }));
    await store.delete('to-delete');
    const back = await store.get('to-delete');
    assert.strictEqual(back, undefined);
});

test('clear wipes every record', async () => {
    const { store } = bootStore();
    await store.put(sampleRecord({ id: 'x' }));
    await store.put(sampleRecord({ id: 'y' }));
    await store.clear();
    const all = await store.list();
    assert.deepStrictEqual(all, []);
});

test('newId produces unique ids', () => {
    const { store } = bootStore();
    const ids = new Set();
    for (let i = 0; i < 50; i += 1) {
        ids.add(store.newId());
    }
    assert.strictEqual(ids.size, 50);
});
