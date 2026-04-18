// AR.R11.libraryUI — the "Library" modal: save current drawing, browse
// previously saved ones, load or delete them. Built as plain DOM since a
// scrollable list + buttons is awkward on a canvas. Styling is inline so the
// module doesn't require any CSS to be loaded.
//
// Public API:
//   AR.R11.libraryUI.open()    — build and show the modal
//   AR.R11.libraryUI.close()   — tear down the modal
//   AR.R11.libraryUI.toggle()  — open if closed, close if open
//   AR.R11.libraryUI.isOpen()  — boolean
//   AR.R11.libraryUI.refresh() — re-fetch and re-render while open

(function () {
    var root = null,
        listEl = null,
        nameInput = null,
        statusEl = null,
        isOpen = false;

    function h(tag, attrs, children) {
        var el = document.createElement(tag);
        attrs = attrs || {};
        Object.keys(attrs).forEach(function (k) {
            if (k === "style") {
                Object.keys(attrs.style).forEach(function (sk) {
                    el.style[sk] = attrs.style[sk];
                });
            } else if (k.indexOf("on") === 0) {
                el[k] = attrs[k];
            } else if (k === "text") {
                el.textContent = attrs.text;
            } else {
                el.setAttribute(k, attrs[k]);
            }
        });
        (children || []).forEach(function (c) {
            if (c === null || c === undefined) { return; }
            if (typeof c === "string") {
                el.appendChild(document.createTextNode(c));
            } else {
                el.appendChild(c);
            }
        });
        return el;
    }

    function formatDate(ms) {
        if (!ms) { return ""; }
        var d = new Date(ms);
        return d.toISOString().replace("T", " ").slice(0, 16);
    }

    function status(msg, isError) {
        if (!statusEl) { return; }
        statusEl.textContent = msg || "";
        statusEl.style.color = isError ? "#d44" : "#555";
    }

    function renderItem(rec) {
        var size = rec.width + " x " + rec.height;
        var meta = size + "  ·  saved " + formatDate(rec.updatedAt);
        return h("li", {
            "data-id": rec.id,
            style: {
                padding: "10px 12px",
                borderBottom: "1px solid #ddd",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px"
            }
        }, [
            h("div", { style: { flex: "1", minWidth: "0" } }, [
                h("div", { style: { fontWeight: "600", fontSize: "15px" } }, [rec.name || "Untitled"]),
                h("div", { style: { fontSize: "13px", color: "#777", marginTop: "2px" } }, [meta])
            ]),
            h("button", {
                style: {
                    padding: "8px 14px", cursor: "pointer", fontSize: "14px",
                    background: "#2a7", color: "white", border: "0", borderRadius: "3px"
                },
                onclick: function () {
                    status("Loading " + (rec.name || rec.id) + "…");
                    AR.R11.draw.loadFromLibrary(rec.id).then(function () {
                        status("Loaded.");
                        AR.R11.libraryUI.close();
                    }).catch(function (err) {
                        status("Load failed: " + err.message, true);
                    });
                }
            }, ["Load"]),
            h("button", {
                style: {
                    padding: "8px 14px", cursor: "pointer", fontSize: "14px",
                    background: "#c44", color: "white", border: "0", borderRadius: "3px"
                },
                onclick: function () {
                    AR.R11.draw.deleteFromLibrary(rec.id).then(function () {
                        AR.R11.libraryUI.refresh();
                    }).catch(function (err) {
                        status("Delete failed: " + err.message, true);
                    });
                }
            }, ["Delete"])
        ]);
    }

    function render(records) {
        while (listEl.firstChild) { listEl.removeChild(listEl.firstChild); }
        if (!records || records.length === 0) {
            listEl.appendChild(h("li", {
                style: { padding: "20px", color: "#777", fontStyle: "italic", fontSize: "14px" }
            }, ["No saved drawings yet. Use Save Current to start a library."]));
            return;
        }
        records.forEach(function (rec) { listEl.appendChild(renderItem(rec)); });
    }

    function build() {
        var current = AR.R11.draw.getCurrent();
        var vp = AR.R11.viewportClass();
        // Width: narrow mobile gets a sheet (96vw); everything else a centered
        // modal capped at 640px (reads well on desktop without feeling empty).
        var panelWidth = vp.narrow ? "96vw" : "min(640px, 92vw)";
        var panelPadding = vp.short ? "12px" : (vp.narrow ? "14px" : "20px");
        var panelGap = vp.short ? "6px" : "10px";

        nameInput = h("input", {
            type: "text",
            value: current.name || "Untitled",
            style: {
                flex: "1", padding: "8px 10px", fontSize: "15px",
                minWidth: "0",  // allow shrinking on narrow viewports
                border: "1px solid #bbb", borderRadius: "3px"
            }
        });

        statusEl = h("div", {
            style: { fontSize: "13px", color: "#555", padding: "4px 0", minHeight: "18px" }
        });

        // The list fills remaining vertical space inside the flex panel, so
        // maxHeight scales naturally with viewport height.
        listEl = h("ul", {
            style: {
                margin: "0", padding: "0", listStyle: "none",
                flex: "1 1 auto", minHeight: "100px", overflowY: "auto",
                border: "1px solid #eee", borderRadius: "3px"
            }
        });

        var saveBtn = h("button", {
            style: {
                padding: "8px 14px", cursor: "pointer", fontSize: "14px",
                background: "#36c", color: "white", border: "0", borderRadius: "3px",
                flexShrink: "0"
            },
            onclick: function () {
                var name = nameInput.value || "Untitled";
                AR.R11.draw.setCurrentName(name);
                status("Saving…");
                AR.R11.draw.saveToLibrary({ name: name }).then(function () {
                    status("Saved.");
                    AR.R11.libraryUI.refresh();
                }).catch(function (err) {
                    status("Save failed: " + err.message, true);
                });
            }
        }, ["Save Current"]);

        var closeBtn = h("button", {
            "aria-label": "Close",
            style: {
                position: "absolute", top: "6px", right: "8px",
                background: "transparent", border: "0",
                fontSize: "26px", lineHeight: "1", cursor: "pointer", color: "#555",
                padding: "4px 10px"
            },
            onclick: function () { AR.R11.libraryUI.close(); }
        }, ["×"]);

        var panel = h("div", {
            "data-viewport": vp.narrow ? "narrow" : (vp.short ? "short" : "standard"),
            style: {
                position: "relative",
                background: "white",
                width: panelWidth,
                maxWidth: "780px",
                maxHeight: "94vh",
                minHeight: "220px",
                borderRadius: "6px",
                boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
                padding: panelPadding,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: panelGap,
                fontFamily: "system-ui, sans-serif"
            }
        }, [
            closeBtn,
            h("div", { style: { fontSize: "20px", fontWeight: "700" } }, ["Library"]),
            h("div", {
                style: { display: "flex", gap: "8px", alignItems: "center" }
            }, [nameInput, saveBtn]),
            statusEl,
            listEl
        ]);

        root = h("div", {
            role: "dialog",
            "aria-modal": "true",
            style: {
                position: "fixed", inset: "0",
                background: "rgba(0,0,0,0.4)",
                zIndex: "10000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                boxSizing: "border-box"
            },
            onclick: function (e) {
                if (e.target === root) { AR.R11.libraryUI.close(); }
            }
        }, [panel]);

        document.body.appendChild(root);
    }

    AR.R11.libraryUI = {
        open: function () {
            if (isOpen) { return; }
            if (!AR.R11.draw) {
                throw new Error("AR.R11.libraryUI.open: AR.R11.draw not loaded");
            }
            build();
            isOpen = true;
            this.refresh();
        },
        close: function () {
            if (!isOpen) { return; }
            if (root && root.parentNode) {
                root.parentNode.removeChild(root);
            }
            root = null;
            listEl = null;
            nameInput = null;
            statusEl = null;
            isOpen = false;
        },
        toggle: function () {
            if (isOpen) { this.close(); } else { this.open(); }
        },
        isOpen: function () { return isOpen; },
        refresh: function () {
            if (!isOpen) { return Promise.resolve(); }
            return AR.R11.draw.listLibrary().then(render).catch(function (err) {
                status("Failed to list library: " + err.message, true);
            });
        }
    };
}());
