var window,document, AR = {};
AR.R11 = {};

AR.R11 = {
    window: {
        height: function () {
            return window.innerHieght;
        },
        width: function () {
            return window.innerWidth;
        }
    },
    contains: function (box, x, y) {
        var bx = (typeof box.x === "function") ? box.x(): box.x,
            by = (typeof box.y === "function") ? box.y(): box.y,
            bw = (typeof box.w === "function") ? box.w(): box.w,
            bh = (typeof box.h === "function") ? box.h(): box.h;
        return (bx <= x) && (bx + bw >= x) &&
                (by <= y) && (by + bh >= y);
    },
    constrainTo: function (a, b) {
        return b.w + b.x - a.x
    },
    next1: function (x, mx, min) {
        mx = mx || 100;
        min = min || 0;
        x = (x < min) ? min :
                (x < mx) ? x + 1 :
                        mx;
        return x;
    },
    back1: function (x, min, mx) {
        mx = mx || 100;
        min = min || 0;
        x = (x > mx) ? mx :
                (x > min) ? x - 1 :
                        min;
        return x;
    },
    updateSettings: function (object, defaults, mods) {
        var idx;
        mods = mods || {};
        for (idx in defaults) {
            object[idx] = mods[idx] || (typeof defaults[idx] === "function") ? defaults[idx](): defaults[idx];
        }
    }
}