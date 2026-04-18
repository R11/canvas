// AR.R11.text — text-rendering seam.
//
// One-shot helper for drawing labels onto a canvas, with a switchable
// backend:
//
//   "bitmap" (default) — uses AR.R11.Text + AR.R11.font to render the
//      hand-drawn pixel font that was designed and tested on the Wii U.
//      Per-character rotation is supported via the angle option (the
//      Text class applies ctx.rotate per glyph).
//
//   "native" — uses ctx.fillText with a system font. ctx.rotate is
//      applied to the whole label so the same angle option works.
//
// Switch globally with AR.R11.text.setDefault("font", "native"), or
// per-call with { font: "native" } in the opts. Default stays "bitmap"
// so existing draw.js / home.js call-sites keep their original look.

(function () {
    var defaults = {
        font: "bitmap",
        fontFamily: "system-ui, sans-serif",
        size: 14,
        spacing: 5,
        lineWidth: 2,
        color: "black",
        angle: 0,
        align: "left"
    };

    function merge(opts) {
        var out = {}, k;
        for (k in defaults) { out[k] = defaults[k]; }
        if (opts) {
            for (k in opts) {
                if (opts[k] !== undefined) { out[k] = opts[k]; }
            }
        }
        return out;
    }

    function drawBitmap(ctx, text, o) {
        // The Text class already supports rotation (it calls ctx.rotate on
        // each glyph based on this.angle), and it parses the same /n / /t /
        // /b / /f<scale> escapes the rest of the codebase uses.
        var t = new AR.R11.Text({
            ctx: ctx,
            text: text,
            x: o.x || 0,
            y: o.y || 0,
            size: o.size,
            spacing: o.spacing,
            lineWidth: o.lineWidth,
            fillStyle: o.color,
            strokeStyle: o.color,
            angle: o.angle,
            align: o.align
        });
        return { width: t.w || 0, height: t.h || 0 };
    }

    function drawNative(ctx, text, o) {
        ctx.save();
        ctx.translate(o.x || 0, o.y || 0);
        if (o.angle) { ctx.rotate(o.angle); }
        ctx.font = o.size + "px " + o.fontFamily;
        ctx.fillStyle = o.color;
        ctx.textAlign = (o.align === "center" || o.align === "right") ? o.align : "left";
        ctx.textBaseline = "top";
        // Mirror the bitmap font's "/n" newline escape so call-sites can
        // swap backends without rewriting their text.
        var lines = String(text).split("/n");
        var lineHeight = o.size + (o.spacing || 0);
        var maxW = 0, i, m;
        for (i = 0; i < lines.length; i += 1) {
            ctx.fillText(lines[i], 0, i * lineHeight);
        }
        if (typeof ctx.measureText === "function") {
            for (i = 0; i < lines.length; i += 1) {
                m = ctx.measureText(lines[i]);
                if (m && m.width > maxW) { maxW = m.width; }
            }
        }
        ctx.restore();
        return { width: maxW, height: lines.length * lineHeight };
    }

    AR.R11.text = {
        getDefault: function (key) {
            if (key === undefined) {
                var copy = {}, k;
                for (k in defaults) { copy[k] = defaults[k]; }
                return copy;
            }
            return defaults[key];
        },
        setDefault: function (key, value) {
            if (typeof key === "object" && key !== null) {
                for (var k in key) { defaults[k] = key[k]; }
            } else {
                defaults[key] = value;
            }
        },
        draw: function (ctx, text, opts) {
            var o = merge(opts);
            if (o.font === "native") {
                return drawNative(ctx, text, o);
            }
            return drawBitmap(ctx, text, o);
        }
    };
}());
