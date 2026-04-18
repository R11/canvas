// AR.R11.store — a tiny IndexedDB wrapper used by the drawing tool for:
//   - saving the current drawing to a library the user can revisit
//   - storing thumbnails + metadata alongside the raw pixel data
//   - eventually, storing per-layer pixel buffers once layers land
//
// All methods return Promises. The store is lazy-initialized on first use.

(function () {
    var DB_NAME = "r11-canvas";
    var DB_VERSION = 1;
    var STORE = "drawings";

    var dbPromise = null;

    function openDb() {
        if (dbPromise) { return dbPromise; }
        dbPromise = new Promise(function (resolve, reject) {
            var req = window.indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function (e) {
                var db = e.target.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    db.createObjectStore(STORE, { keyPath: "id" });
                }
            };
            req.onsuccess = function (e) { resolve(e.target.result); };
            req.onerror = function (e) { reject(e.target.error); };
        });
        return dbPromise;
    }

    function tx(mode) {
        return openDb().then(function (db) {
            return db.transaction(STORE, mode).objectStore(STORE);
        });
    }

    function reqToPromise(req) {
        return new Promise(function (resolve, reject) {
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error); };
        });
    }

    AR.R11.store = {
        // Insert or replace a drawing. Record shape:
        //   { id, name, createdAt, updatedAt, width, height, layers: [...], thumbnail }
        // `layers` is an array of { data: Uint8ClampedArray, name, opacity, visible }.
        // `thumbnail` is an optional PNG Blob.
        put: function (record) {
            if (!record || !record.id) {
                return Promise.reject(new Error("record.id is required"));
            }
            record.updatedAt = Date.now();
            if (!record.createdAt) { record.createdAt = record.updatedAt; }
            return tx("readwrite").then(function (store) {
                return reqToPromise(store.put(record));
            }).then(function () { return record; });
        },

        get: function (id) {
            return tx("readonly").then(function (store) {
                return reqToPromise(store.get(id));
            });
        },

        // List every drawing — returns an array of records sorted by updatedAt
        // descending (newest first). The caller can strip out heavy fields
        // (layers, thumbnail) if only metadata is needed.
        list: function () {
            return tx("readonly").then(function (store) {
                return reqToPromise(store.getAll());
            }).then(function (records) {
                return (records || []).slice().sort(function (a, b) {
                    return (b.updatedAt || 0) - (a.updatedAt || 0);
                });
            });
        },

        "delete": function (id) {
            return tx("readwrite").then(function (store) {
                return reqToPromise(store.delete(id));
            });
        },

        // Convenience for tests: wipe every record. Not exposed in UI.
        clear: function () {
            return tx("readwrite").then(function (store) {
                return reqToPromise(store.clear());
            });
        },

        // Generate a short unique id for new saves.
        newId: function () {
            return "d_" + Date.now().toString(36) + "_" +
                Math.random().toString(36).slice(2, 8);
        },

        // Reset the cached DB handle. Tests call this when swapping the
        // indexedDB implementation between runs.
        __reset: function () {
            if (dbPromise) {
                dbPromise.then(function (db) { db.close(); }).catch(function () {});
            }
            dbPromise = null;
        }
    };
}());
