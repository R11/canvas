// AR.R11.layerUI — the "Layers" panel. Shows every layer top-to-bottom
// (top of the composite at the top of the list, like Photoshop), with
// visibility toggle, rename-on-click, opacity slider, and move/delete
// controls. Active layer is highlighted. An "+ Add Layer" button at the
// bottom creates a new blank layer above the active one.
//
// Public API:
//   AR.R11.layerUI.open() / close() / toggle() / isOpen()
//   AR.R11.layerUI.refresh()

(function () {
    var root = null,
        panelEl = null,
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

    function button(label, onclick, extra) {
        var s = {
            border: "0", borderRadius: "3px", cursor: "pointer",
            padding: "6px 10px", fontSize: "14px",
            background: "#eee", color: "#333"
        };
        Object.keys(extra || {}).forEach(function (k) { s[k] = extra[k]; });
        return h("button", { onclick: onclick, style: s }, [label]);
    }

    function row(layer, i, activeIndex, total) {
        var draw = AR.R11.draw;
        var isActive = (i === activeIndex);

        var visBox = h("input", {
            type: "checkbox",
            onchange: function () {
                draw.setLayerVisibility(i, visBox.checked);
                AR.R11.layerUI.refresh();
            },
            style: { margin: "0 8px 0 0", width: "16px", height: "16px" }
        });
        visBox.checked = !!layer.visible;

        var nameSpan = h("span", {
            style: {
                flex: "1", fontSize: "14px", fontWeight: isActive ? "700" : "400",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                cursor: "text"
            },
            title: "Click to rename",
            onclick: function (e) {
                e.stopPropagation();
                var nv = (typeof window.prompt === "function")
                    ? window.prompt("Rename layer", layer.name)
                    : null;
                if (nv && nv.trim()) {
                    draw.setLayerName(i, nv.trim());
                    AR.R11.layerUI.refresh();
                }
            }
        }, [layer.name || "Layer"]);

        var opacity = h("input", {
            type: "range",
            min: "0", max: "100", step: "1",
            oninput: function () {
                draw.setLayerOpacity(i, Number(opacity.value) / 100);
            },
            style: { width: "80px" }
        });
        opacity.value = String(Math.round((layer.opacity || 0) * 100));

        var upBtn = button("\u2191", function () {
            if (i < total - 1) {
                draw.moveLayer(i, i + 1);
                AR.R11.layerUI.refresh();
            }
        });
        var downBtn = button("\u2193", function () {
            if (i > 0) {
                draw.moveLayer(i, i - 1);
                AR.R11.layerUI.refresh();
            }
        });
        var delBtn = button("\u00d7", function (e) {
            e.stopPropagation();
            if (total <= 1) { return; }
            draw.removeLayer(i);
            AR.R11.layerUI.refresh();
        }, { background: "#c44", color: "white" });

        return h("li", {
            "data-index": String(i),
            onclick: function () {
                draw.setActiveLayerIndex(i);
                AR.R11.layerUI.refresh();
            },
            style: {
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px",
                borderBottom: "1px solid #eee",
                background: isActive ? "#e8f0ff" : "transparent",
                cursor: "pointer"
            }
        }, [visBox, nameSpan, opacity, upBtn, downBtn, delBtn]);
    }

    function render() {
        var draw = AR.R11.draw;
        var layers = draw.getLayers();
        var active = draw.getActiveLayerIndex();
        var total = layers.length;

        // Display order: top of composite (highest index) at the top of the
        // panel, matching Photoshop convention. The list flex-grows inside
        // the panel so its scroll area scales with the available height.
        var list = h("ul", {
            style: {
                margin: "0", padding: "0", listStyle: "none",
                flex: "1 1 auto", minHeight: "80px", overflowY: "auto",
                border: "1px solid #ddd", borderRadius: "3px"
            }
        });
        for (var i = total - 1; i >= 0; i -= 1) {
            list.appendChild(row(layers[i], i, active, total));
        }

        var addBtn = button("+ Add Layer", function () {
            draw.addLayer({});
            AR.R11.layerUI.refresh();
        }, { background: "#36c", color: "white", padding: "8px 14px", fontSize: "14px" });

        var copyBtn = button("Duplicate Active", function () {
            draw.addLayer({ copyFrom: draw.getActiveLayerIndex() });
            AR.R11.layerUI.refresh();
        }, { padding: "8px 14px", fontSize: "14px" });

        var title = h("div", {
            style: {
                fontWeight: "700", fontSize: "16px", marginBottom: "8px",
                display: "flex", justifyContent: "space-between", alignItems: "center"
            }
        }, [
            "Layers",
            h("button", {
                "aria-label": "Close",
                onclick: function () { AR.R11.layerUI.close(); },
                style: {
                    background: "transparent", border: "0",
                    fontSize: "22px", lineHeight: "1", cursor: "pointer",
                    color: "#666", padding: "4px 8px"
                }
            }, ["\u00d7"])
        ]);

        // Rebuild the panel contents in place.
        while (panelEl.firstChild) { panelEl.removeChild(panelEl.firstChild); }
        panelEl.appendChild(title);
        panelEl.appendChild(list);
        panelEl.appendChild(h("div", {
            style: { display: "flex", gap: "8px", marginTop: "10px" }
        }, [addBtn, copyBtn]));
    }

    function build() {
        var vp = AR.R11.viewportClass();
        if (vp.dock) {
            // Dock mode: fixed side panel on the right. Used on desktop,
            // 4:3, and Wii U gamepad (854 wide).
            panelEl = h("div", {
                role: "dialog",
                "aria-label": "Layers",
                "data-viewport": vp.short ? "dock-short" : "dock",
                style: {
                    position: "fixed",
                    top: "12px",
                    right: "12px",
                    width: "min(360px, 42vw)",
                    maxHeight: "calc(100vh - 24px)",
                    background: "white",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    boxShadow: "0 3px 14px rgba(0,0,0,0.15)",
                    padding: vp.short ? "8px" : "12px",
                    zIndex: "9999",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    fontFamily: "system-ui, sans-serif"
                }
            });
            root = panelEl;
        } else {
            // Sheet mode: full overlay modal. Used when the viewport is too
            // narrow to dock a side panel next to the canvas (mobile portrait).
            panelEl = h("div", {
                role: "dialog",
                "aria-label": "Layers",
                "data-viewport": "sheet",
                style: {
                    position: "relative",
                    background: "white",
                    width: "96vw",
                    maxWidth: "480px",
                    maxHeight: "94vh",
                    borderRadius: "6px",
                    boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
                    padding: "14px",
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    fontFamily: "system-ui, sans-serif"
                }
            });
            root = h("div", {
                "data-layer-ui-backdrop": "true",
                style: {
                    position: "fixed", inset: "0",
                    background: "rgba(0,0,0,0.4)",
                    zIndex: "9999",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                    boxSizing: "border-box"
                },
                onclick: function (e) {
                    if (e.target === root) { AR.R11.layerUI.close(); }
                }
            }, [panelEl]);
        }
        document.body.appendChild(root);
    }

    AR.R11.layerUI = {
        open: function () {
            if (isOpen) { return; }
            if (!AR.R11.draw) {
                throw new Error("AR.R11.layerUI.open: AR.R11.draw not loaded");
            }
            build();
            isOpen = true;
            render();
        },
        close: function () {
            if (!isOpen) { return; }
            if (root && root.parentNode) {
                root.parentNode.removeChild(root);
            }
            root = null;
            panelEl = null;
            isOpen = false;
        },
        toggle: function () {
            if (isOpen) { this.close(); } else { this.open(); }
        },
        isOpen: function () { return isOpen; },
        refresh: function () {
            if (!isOpen) { return; }
            render();
        }
    };
}());
