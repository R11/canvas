var AR = (typeof AR !== 'undefined') ? AR : {};
AR.R11 = AR.R11 || {};

AR.R11 = {
    window: {
        height: function () {
            return window.innerHeight;
        },
        width: function () {
            return window.innerWidth;
        }
    },
    resolve: function (v) {
        return (typeof v === "function") ? v() : v;
    },
    contains: function (box, x, y) {
        var bx = AR.R11.resolve(box.x),
            by = AR.R11.resolve(box.y),
            bw = AR.R11.resolve(box.w),
            bh = AR.R11.resolve(box.h);
        return (bx <= x) && (bx + bw >= x) &&
                (by <= y) && (by + bh >= y);
    },
    constrainTo: function (a, b) {
        return b.w + b.x - a.x;
    },
    next1: function (x, mx, min) {
        mx = (mx === undefined) ? 100 : mx;
        min = (min === undefined) ? 0 : min;
        x = (x < min) ? min :
                (x < mx) ? x + 1 :
                        mx;
        return x;
    },
    back1: function (x, min, mx) {
        mx = (mx === undefined) ? 100 : mx;
        min = (min === undefined) ? 0 : min;
        x = (x > mx) ? mx :
                (x > min) ? x - 1 :
                        min;
        return x;
    },
    updateSettings: function (object, defaults, mods) {
        var idx, override;
        mods = mods || {};
        for (idx in defaults) {
            override = mods[idx];
            if (override !== undefined && override !== null) {
                object[idx] = AR.R11.resolve(override);
            } else {
                object[idx] = AR.R11.resolve(defaults[idx]);
            }
        }
    }
};