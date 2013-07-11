// var window, document;   // this breaks IE10....of course

// Gerber Collision auto repair - 301-474-4844
// this is Hanover Insurance's repair shop. They will make an estimate and then contact for a repair date
// Ceena from Hanover - 800-628-0250 ext.4317
// claim #1500113140
// I will need to contact them about a rental if needed.
// 11am appointment
// Craig

var  AR = {};
AR.R11 = (function () {
    "use strict";
    var state,
        zoom = 3,    //  how zoomed in the image begins
        gz = zoom,   // selection level - as relates to zoom.  1, 2, 4, 8, 16 pixels, etc.
        bit,        // grid width
        zbit = Math.pow(2, zoom),
        ballGo = 0,
        max = 8,          // maximum selection level/zoom allowed
        h = window.innerHeight,
        w = window.innerWidth,
        sw = 20, // setting width
        twoPI = Math.PI * 2,
        radians = Math.PI / 180,
        curX = w / 2.5 | 0,
        curY = h / 2.5 | 0,
        shift = 1,
        curColor = [0, 0, 0, 1],
        fillStyle = "rgba(" + curColor[0] + "," + curColor[1] + "," + curColor[2] + "," + curColor[3] + " )",
        updateFill = function () {
            fillStyle = "rgba(" + curColor[0] + "," + curColor[1] + "," + curColor[2] + "," + curColor[3] + " )";
        },
        DummyData = function () {
            this.hold = 0;
            this.lStickX = 0;
            this.lStickY = 0;
            this.rStickX = 0;
            this.rStickY = 0;
            
            this.gyroX = 0;
            this.gyroY = 0;
            this.gyroZ = 0;
            this.angleX = 0;
            this.angleY = 0;
            this.angleZ = 0;
            this.accX = 0;
            this.accY = 0;
            this.accZ = 0;
    
            this.dirXx = 1.0;
            this.dirXy = 0.0;
            this.dirXz = 0.0;
            this.dirYx = 0.0;
            this.dirYy = 1.0;
            this.dirYz = 0.0;
            this.dirZx = 0.0;
            this.dirZy = 0.0;
            this.dirZz = 1.0;
            
            this.tpTouch = 0;
            this.tpValidity = 0;
            this.contentX = 0;
            this.contentY = 0;
        },
        Controls = function () {
                        
            if (window.wiiu) {
                
                this.state = function () {
                    return window.wiiu.gamepad.update();
                };
                this.event = function () {
                    return this.state.hold & 0x7f86fffc;
                };
                
                this.zoomin = 0x00000008; // + sign
                this.zoomout = 0x00000004; // - sign
                
                this.grid = {
                    expand: 0x00000200, // up
                    reduce: 0x00000100, // down
                    on: 0x00040000, // lclick
                    off: 0x00020000, // rclick
                    toggle: null //
                };
                
                this.eraser = {
                    on: 0x00000800,
                    off: 0x00000400 // right
                };
                
                this.ball = {
                    on: 0x00008000,  // A button
                    off: 0x00000010 // R shoulder
                };
                
                this.save = null;
                this.settings = 0x00002000; // ?
                
                // rstick
                this.left =  0x04000000;
                this.right = 0x02000000;
                this.up = 0x01000000;
                this.down = 0x00800000;
                
            } else {
                
                this.state = new DummyData;
                this.event = this.state.hold;
                
                this.zoomin = 76; // l
                this.zoomout = 75; // k
                
                this.grid = {
                    expand: 190, // period
                    reduce: 188, // comma
                    on: null, // 
                    off: null, // 
                    toggle: 71 // G
                };
                
                this.eraser = {
                    on: 81, // Q
                    off: 87 // W
                };

                this.ball = {
                    on: 66, // B
                    off: 66 // B
                };
                
                this.save = 83; // S
                this.settings = null;
            }
            
        },
        flag = {
            mousedown: 0,
            settings: 1,
            chartover: 0,
            chartopen: 1,
            displayopen: 1,
            displayover: 0,
            mousemove: 0,
            draw: 1,
            drawing: 0,
            loading: 0,
            keydown: 0,
            keypress: 0,
            eraser: 0,
            
        },
        object = function (o) {  // crockford
            function F() {}
            F.prototype = o;
            return new F();
        },
        toggle = function (id, tog) { /// leave "tog" blank to simply toggle on/off. otherwise:  1 = visible, 0 = hidden
            var el = document.getElementById(id),
                v;
            if (tog >= 0) {
                v = (tog === 1) ? 'visible' : 'hidden';
             } else {
               v = (el.style.visibility === 'hidden') ? 'visible' : 'hidden';              
            }
            el.style.visibility = v;
        },
        checkVisibility = function (id) {
            var el = document.getElementById(id),
                theCheck = 1;
            theCheck = (el.style.visibility === 'visible') ? 1 : 0;
            return theCheck;
        },
        getImage = function (id) {
            var findId = document.getElementById(id),
                findCtx = findId.getContext('2d').getImageData(0, 0, w, h);
            return findCtx;
        },
        cImage,
        createCanvas = function (id, z, viz) {
            var cv, ctx;
            cv = document.createElement("canvas");
            ctx = cv.getContext("2d");
            cv.width = w;
            cv.height = h;
            cv.style.zIndex = (z) ? z: 1;  // create function to check if z/id is currently in use by another element
            cv.style.left = "0";
            cv.style.top = "0";
            cv.style.position = "absolute";
            cv.style.visibility = (viz === false) ? 'hidden' : 'visible';
            cv.id = id;
            document.body.appendChild(cv);
            return cv;
        },
        getPixel = function (x, y) {
            return (x + y * w) * 4;
        },
        setPixels = function (data, x, y, r, g, b, a) {
            var index = getPixel(x, y);
            data[index] = r;
            data[index + 1] = g;
            data[index + 2] = b;
            data[index + 3] = a;
        },

        exportImage = function (id) {
            var canvas = document.getElementById(id).toDataURL("image/png");
            window.open(canvas);
        },
        drawReal = function (ctx, data, x, y, xbit, ybit) {
            var check, curPixel;
            ctx.save();
            for (var a = 0; a <= xbit; a += 1) {
                for (var b = 0; b <= ybit; b += 1) {
                    curPixel = getPixel(x + a, y + b);
                    check = data[curPixel + 3];
                    if (check !== 0) {
                        ctx.fillStyle = "rgba(" + data[curPixel] + "," + data[curPixel + 1] + "," + data[curPixel + 2] + "," + data[curPixel + 3] + " )";
                        ctx.fillRect(a * zbit, b * zbit, zbit, zbit);
                    } else {
                        ctx.clearRect(a * zbit, b * zbit, zbit, zbit);
                    }
                }
            }
            ctx.restore();
        },
        closeW = 25,
        closeH = 30,
        next1 = function (x, mx, min) {
            mx = mx || 100;
            min = min || 0;
            x = (x < min) ? min:
                (x < mx) ? x + 1:
                mx;
            return x;
        },
        back1 = function (x, min, mx) {
            mx = mx || 100;
            min = min || 0;
            x = (x > mx) ? mx:
                (x > min) ? x - 1:
                min;
            return x;
        },
        contains = function(box, x, y) {
            return  (box.x <= x) && (box.x + box.w >= x) &&
                    (box.y <= y) && (box.y + box.h >= y);
        },
        xBox = function (ctx, x, y) {
            var inset = 2;
            ctx.fillStyle = "white";
            ctx.fillRect(x, y, closeW, closeH);
            ctx.strokeStyle = "black";
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, closeW, closeH);
    //        ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + inset, y + inset);
            ctx.lineTo(x + closeW - inset, y + closeH - inset);
            ctx.moveTo(x + closeW - inset, y + inset);
            ctx.lineTo(x + inset, y + closeH - inset);
            ctx.closePath();
            ctx.stroke();
        },
        customFont = function (txt, ctx, x, y, color, size, spacing, thick, horizontal) {
            var i, a1, a2, a3, a4, a5, a6, a7, a8,
                x1, x2, x3, x4, x5, x6,
                y1, y2, y3, y4, y5, y6,
                low = txt.toLowerCase(),
                split = txt.toLowerCase().split(""),
                num = split.length,
                space,  // leading
                f = size || 10,  // font size
                ang = (horizontal) ? 0: Math.PI * 0.5,
                lw = thick || 5,
                d = lw / 2; // this variable shifts the
            ctx.fillStyle = color || "black";
            ctx.strokeStyle = color || "black";
            ctx.lineWidth = thick || 5;
            for (i = 0; i != num ; i += 1) {
                space = spacing || 3;
                ctx.save();
                ctx.translate(x + 0.5, y + 0.5);
                ctx.rotate(ang);
                ctx.beginPath();
                switch (split[i]) { // alphabet
                case "a":
                    a1 = f * 0.25;
                    a2 = f * 0.15;
                    a3 = f * 0.15;
                    x1 = f * 0;
                    x2 = a1;
                    x3 = f - a1 - a3;
                    x4 = f - a3;
                    y1 = f - d;
                    y2 = f * 0.5;
                    y3 = f * 0;
                    y4 = f * 0.6;
                    space -= a3;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x2, y3);
                    ctx.lineTo(x3, y3);
                    ctx.lineTo(x4, y2);
                    ctx.lineTo(x4, y1);
                    ctx.moveTo(x4, y4);
                    ctx.lineTo(x1, y4);
                    ctx.stroke();
                    break;
                case "b":
                    a1 = f * 0.25;
                    x1 = f * 0;
                    x2 = f - a1;
                    x3 = f * 0.55;
                    y1 = f * 1 - lw;
                    y2 = f * 0.5;
                    y3 = f * 0;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x3, y2);
                    ctx.lineTo(x3, y3);
                    ctx.lineTo(x1, y3);
                    ctx.closePath();
                    ctx.moveTo(x1, y2);
                    ctx.lineTo(x3, y2);
                    ctx.stroke();
                    break;
                case "c":  /// needs lots of work
                    a1 = f * 0.2;
                    x1 = f - a1;
                    x2 = f * 0.2;
                    x3 = f * 0;
                    y1 = f * 0;
                    y2 = f * 0.3;
                    y3 = f - y2;
                    y4 = f - lw;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x3, y2);
                    ctx.lineTo(x3, y3);
                    ctx.lineTo(x2, y4);
                    ctx.lineTo(x1, y4);
                    ctx.stroke();
                    break;
                case "d":
                    a1 = f * 0.2;
                    x1 = f * 0;
                    x2 = f * 0.5;
                    x3 = f - a1;
                    y1 = f * 0;
                    y2 = f * 0.2;
                    y3 = f - y2 - lw / 2;
                    y4 = f - lw;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x3, y2);
                    ctx.lineTo(x3, y3);
                    ctx.lineTo(x2, y4);
                    ctx.lineTo(x1, y4);
                    ctx.closePath();
                    ctx.stroke();
                    break;
                case "e":
                    a1 = f * 0.2;
                    a2 = f * 0.2;
                    x1 = f - a1;
                    x2 = f * 0;
                    x3 = f - a1 - a2;
                    y1 = f * 0;
                    y2 = f * 1 - lw;
                    y3 = f * 0.45;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x1, y2);
                    ctx.moveTo(x2, y3);
                    ctx.lineTo(x3, y3);
                    ctx.stroke();
                    break;
                case "f":
                    a1 = f * 0.3;
                    x1 = f - a1;
                    x2 = f * 0;
                    x3 = f * 0.5;
                    y1 = f * 0;
                    y2 = f * 1 - lw / 2;
                    y3 = f * 0.5;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.moveTo(x2, y3);
                    ctx.lineTo(x3, y3);
                    ctx.stroke();
                    break;
                case "g":
                    a1 = f * 0.2;
                    x1 = f - a1;
                    x2 = f * 0;
                    x3 = x1 - f * 0.35;
                    y1 = f * 0.1;
                    y2 = f * 0;
                    y3 = f * 1 - lw;
                    y4 = f * 0.4;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x2, y3);
                    ctx.lineTo(x1, y3);
                    ctx.lineTo(x1, y4);
                    ctx.lineTo(x3, y4);
                    ctx.stroke();
                    break;
                case "h":
                    a1 = f * 0.2;
                    x1 = f * 0;
                    x2 = f - a1;
                    y1 = f * 0 - lw / 2;
                    y2 = f * 1 - lw / 2;
                    y3 = f * 0.45;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.moveTo(x1, y3);
                    ctx.lineTo(x2, y3);
                    ctx.moveTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    break;
                case "i":
                    a1 = f * 0.2;
                    x1 = 0;
                    x2 = f - a1;
                    x3 = x2 * 0.5;
                    y1 = f * 0;
                    y2 = f * 1 - lw;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.moveTo(x1, y2);
                    ctx.lineTo(x2, y2);
                    ctx.moveTo(x3, y2);
                    ctx.lineTo(x3, y1);
                    ctx.stroke();
                    break;
                case "j":
                    a1 = f * 0.3;
                    a2 = f * 0.2;
                    x1 = f - a1;
                    x2 = x1 - a2 * 2;
                    x3 = x1 - a2;
                    x4 = 0;
                    y1 = f * 0;
                    y2 = f * 1 - lw;
                    y3 = f * 0.6;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.moveTo(x3, y1);
                    ctx.lineTo(x3, y2);
                    ctx.lineTo(x4, y2);
                    ctx.lineTo(x4, y3);
                    ctx.stroke();
                    break;
                case "k":
                    a1 = f * 0.4;
                    a2 = 0.5;
                    x1 = 0;
                    x2 = f - a1;
                    y1 = -d;
                    y2 = f * a2;
                    y3 = f - d;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y3);
                    ctx.moveTo(x1, y2);
                    ctx.lineTo(x2, y1);
                    ctx.moveTo(x1, y2);
                    ctx.lineTo(x2, y3);
                    ctx.stroke();
                    break;
                case "l":
                    a1 = f * 0.3;
                    x1 = 0;
                    x2 = f - a1;
                    y1 = -d;
                    y2 = f - lw / 2;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    break;
                case "m":
                    a1 = f * 0.2;
                    x1 = 0;
                    x2 = f * 0.5 - a1 / 2;
                    x3 = f - a1;
                    y1 = f;
                    y2 = 0;
                    y3 = f * 0.4;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x2, y3);
                    ctx.lineTo(x3, y2);
                    ctx.lineTo(x3, y1);
                    ctx.stroke();
                    break;
                case "n":
                    a1 = f * 0.4;
                    a2 = f * 0;
                    x1 = 0;
                    x2 = f - a1;
                    y1 = -d;
                    y2 = a2;
                    y3 = f - a2;
                    y4 = y1 + f;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y4);
                    ctx.moveTo(x1, y2);
                    ctx.lineTo(x2, y4);
                    ctx.moveTo(x2, y1);
                    ctx.lineTo(x2, y4);
                    ctx.stroke();
                    break;
                case "o":
                    a1 = f * 0.2;
                    a2 = f * 0.1;
                    x1 = 0;
                    x2 = a1;
                    x3 = f - a1 - a2;
                    x4 = f - a2;
                    y1 = a1;
                    y2 = 0;
                    y3 = f - y1 - lw / 2;
                    y4 = f - lw / 2;
                    space -= a2;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x3, y2);
                    ctx.lineTo(x4, y1);
                    ctx.lineTo(x4, y3);
                    ctx.lineTo(x3, y4);
                    ctx.lineTo(x2, y4);
                    ctx.lineTo(x1, y3);
                    ctx.closePath();
                    ctx.stroke();
                    break;
                case "p":
                    a1 = f * 0.4;
                    x1 = f * 0;
                    x2 = f - a1;
                    x3 = f * 0.25;
                    y1 = f * 1 - lw / 2;
                    y2 = f * 0;
                    y3 = f * 0.4;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x2, y3);
                    ctx.lineTo(x1, y3);
                    ctx.stroke();
                    break;
                case "r":
                    a1 = f * 0.4;
                    x1 = f * 0;
                    x2 = f - a1;
                    x3 = f * 0.25;
                    x4 = x2 + f * 0.05;
                    y1 = f * 1 - lw / 2;
                    y2 = f * 0;
                    y3 = f * 0.4;
                    y4 = y1 - f * 0.025;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x2, y3);
                    ctx.lineTo(x1, y3);
                    ctx.moveTo(x3, y3);
                    ctx.lineTo(x4, y4);
                    ctx.stroke();
                    break;
                case "q":
                    a1 = f * 0.2;
                    a2 = f * 0.1;
                    a3 = f * 0.3;
                    x1 = 0;
                    x2 = a1;
                    x3 = f - a1 - a2;
                    x4 = f - a2;
                    x5 = f - a3 - a2;
                    x6 = f * 0.55;
                    y1 = a1;
                    y2 = 0;
                    y3 = f - y1 - lw / 2;
                    y4 = f - lw / 2;
                    y5 = f - a3 - lw / 2;
                    y6 = f * 0.6;
                    space -= a2;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x3, y2);
                    ctx.lineTo(x4, y1);
                    ctx.lineTo(x4, y5);
                    ctx.lineTo(x5, y4);
                    ctx.lineTo(x2, y4);
                    ctx.lineTo(x1, y3);
                    ctx.closePath();
                    ctx.moveTo(x6, y6);
                    ctx.lineTo(x4, y4);
                    ctx.stroke();
                    break;
                case "s":
                    a1 = f * 0.4;
                    x1 = f - a1;
                    x2 = f * 0;
                    y1 = f * 0;
                    y2 = f * 0.45;
                    y3 = f * 1 - lw;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x1, y3);
                    ctx.lineTo(x2, y3);
                    ctx.stroke();
                    break;
                case "t":
                    a1 = f * 0.3
                    x1 = 0;
                    x2 = f - a1;
                    x3 = x2 / 2;
                    y1 = 0;
                    y2 = y1 + f - d;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.moveTo(x3, y1);
                    ctx.lineTo(x3, y2);
                    ctx.stroke();
                    break;
                case "u":
                    a1 = f * 0.15;
                    a2 = f * 0.25;
                    a3 = a1;
                    x1 = 0;
                    x2 = a1;
                    x3 = f - a1 - a2;
                    x4 = f - a2;
                    y1 = -d;
                    y2 = f - a3;
                    y3 = f;
                    space -= a2;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x2, y3);
                    ctx.lineTo(x3, y3);
                    ctx.lineTo(x4, y2);
                    ctx.lineTo(x4, y1);
                    ctx.stroke();
                    break;
                case "v":
                    a1 = f * 0.4;
                    x1 = 0;
                    x3 = f - a1;
                    x2 = x3 / 2;
                    y1 = -d;
                    y2 = f - d;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.moveTo(x2, y2);
                    ctx.lineTo(x3, y1);
                    ctx.stroke();
                    break;
                case "w":
                    a1 = f * 0.2;
                    a2 = f * 0.2;
                    x1 = 0;
                    x2 = a2;
                    x3 = a2 * 2;
                    x4 = a2 * 3;
                    x5 = a2 * 4;
                    y1 = -d;
                    y2 = f;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.moveTo(x2, y2);
                    ctx.lineTo(x3, y1);
                    ctx.moveTo(x3, y1);
                    ctx.lineTo(x4, y2);
                    ctx.moveTo(x4, y2);
                    ctx.lineTo(x5, y1);
                    ctx.stroke();
                    break;
                case "x":
                    a1 = f * 0.2;
                    x1 = 0 - d;
                    x2 = f - a1;
                    y1 = 0 - d;
                    y2 = y1 + f;
                    space -= a1 + d;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.moveTo(x1, y2);
                    ctx.lineTo(x2, y1);
                    ctx.closePath();
                    ctx.stroke();
                    break;
                case "y":
                    a1 = f * 0.2;
                    x1 = 0,
                    x2 = f - a1;
                    x3 = x2 / 2;
                    y1 = 0;
                    y2 = f * 0.6;
                    y3 = f;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x3, y2);
                    ctx.lineTo(x2, y1);
                    ctx.moveTo(x3, y2);
                    ctx.lineTo(x3, y3);
                    ctx.stroke();
                    break;
                case "z":
                    a1 = f * 0.2;
                    x1 = 0;
                    x2 = f - a1;
                    y1 = 0;
                    y2 = f * 1 - d;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.moveTo(x2, y1);
                    ctx.lineTo(x1, y2);
                    ctx.moveTo(x1, y2);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    break;
                case ":":
                    a1 = f / 6;
                    a2 = f / 10;
                    a3 = f - a1;
                    a4 = 0;
                    ctx.arc(a1, a1, a2, a4, twoPI, false);
                    ctx.arc(a1, a3, a2, a4, twoPI, false);
                    ctx.fill(); 
                    break;
                case "+":
                    a1 = 0;
                    a2 = f;
                    a3 = f / 2;
                    ctx.moveTo(a1, a3);
                    ctx.lineTo(a2, a3);
                    ctx.moveTo(a3, a1);
                    ctx.lineTo(a3, a2);
                    ctx.stroke();
                    break;
                case "-":
                    a1 = f * 0.1;
                    x1 = 0;
                    x2 = f - a1;
                    y1 = f / 2;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.closePath();
                    ctx.stroke();
                    break;
                case "<":
                    x1 = f * 1;
                    x2 = f * 0;
                    y1 = f * 0;
                    y2 = f * 0.5;
                    y3 = f * 1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x1, y3);
                    ctx.stroke();
                    break;
                case "1":
                    a1 = f * 0.25;
                    a2 = f * 0.2;
                    x1 = 0;
                    x2 = f - a1 | 0;
                    x3 = x2 / 2 | 0;
                    x4 = x1;
                    y1 = f * 1 - d;
                    y2 = f * 0;
                    y3 = f * 0;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.moveTo(x3, y1);
                    ctx.lineTo(x3, y2);
                    ctx.lineTo(x4, y3);
                    ctx.stroke();
                    break;
                case "2":
                    x1 = f * 0.2 + lw / 2;
                    x2 = f - x1;
                    y1 = f * 0;
                    y2 = f * 0.55;
                    y3 = f * 1;
                    space -= x1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x1, y3);
                    ctx.lineTo(x2, y3);
                    ctx.stroke();
                    break;
                case "3":
                    x1 = f * 0.2;
                    x2 = f - x1;
                    x3 = f * 0.3;
                    y1 = f * 0;
                    y2 = f * 1;
                    y3 = f * 0.54;
                    space -= x1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x1, y2);
                    ctx.moveTo(x2, y3);
                    ctx.lineTo(x3, y3);
                    ctx.stroke();
                    break;
                case "4":
                    x2 = f * 0.2;
                    x1 = x2 + f * 0.5;
                    y1 = f * 0;
                    y2 = f * 1;
                    y3 = f * 0.5;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.moveTo(x2, y1);
                    ctx.lineTo(x2, y3);
                    ctx.lineTo(x1, y3);
                    ctx.stroke();
                    break;
                case "5":
                    x1 = f * 0.8 - lw / 2;
                    x2 = f - x1;
                    y1 = f * 0;
                    y2 = f * 0.55;
                    y3 = f * 1;
                    space -= x2;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x1, y3);
                    ctx.lineTo(x2, y3);
                    ctx.stroke();
                    break;
                case "6":
                    x1 = f * 0.8 - lw / 2;
                    x2 = f - x1;
                    y1 = f * 0;
                    y2 = f * 0.55;
                    y3 = f * 1;
                    space -= x2;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x2, y3);
                    ctx.lineTo(x1, y3);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    break;
                case "7":
                    x1 = f * 0.2;
                    x2 = f - x1;
                    y1 = f * 0;
                    y2 = f * 1;
                    space -= x1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                    break;
                case "8":
                    x1 = f * 0.2;
                    x2 = f - x1;
                    y1 = f * 0;
                    y2 = f * 1;
                    y3 = f * 0.54;
                    space -= x1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x1, y2);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x2, y3);
                    ctx.lineTo(x1, y3);
                    ctx.stroke();
                    break;
                case "9":
                    x1 = f * 1;
                    x2 = x1 - f * 0.6;
                    y1 = f * 1;
                    y2 = f * 0;
                    y3 = f * 0.5;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x2, y3);
                    ctx.lineTo(x1, y3);
                    ctx.stroke();
                    break;
                case "0":
                    x1 = f * 0.2;
                    x2 = f * 0.8;
                    y1 = f * 0;
                    y2 = f * 1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x1, y2);
                    ctx.closePath();
                    ctx.stroke();
                    break;
                case " ":
                    break;
                default:
                    ctx.fillRect(0, 0, f, f);
                    break;
                }
                ctx.restore();
                space += d;
                x = (horizontal === true) ? x + f + space: x;
                y = (horizontal === false) ? y + f + space: y;
            }
            
        },
        grid = (function () {
            var cv = createCanvas("grid", 3),
                ctx = cv.getContext("2d");
            return {
                expand: function () {
                    bit = makeGrid(cv, gz = next1(gz, max));
                },
                reduce: function () {
                    bit = makeGrid(cv, gz = back1(gz, zoom));
                },
                reset: function () {
                    bit = makeGrid(cv, gz = zoom);
                }
            };
        }()),
        makeGrid = function (cv, level, x, y, w, h) {
            var ctx, b, f, e, t;
            cv = cv || document.createElement("canvas");
            level = level || 1;
            b = Math.pow(2, level);
            ctx = cv.getContext("2d");
            w = w || cv.width || 100;
            h = h || cv.height || 100;
            x = x || 0;
            y = y || 0;
            t = 0.7;
            ctx.clearRect(x, y, w, h);
            ctx.fillStyle = cv. color || "black";
            for (f = x; f <= w; f += b) {
                ctx.fillRect(f, y, t, h);
            }
            for (e = y; e <= h; e += b) {
                ctx.fillRect(x, e, w, t);
            }
            settings.updateZoom();
            settings.grid();
            return b;
        },
        realCanvas = (function () {
            var image, data, rX, rY,
                cv = createCanvas("realCanvas", 1, false),
                ctx = cv.getContext("2d");
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, w, h);
            image = document.getElementById("realCanvas").getContext('2d').getImageData(0, 0, w, h);
            data = image.data;
         //   image = ctx.getImageData(0, 0, cv.width, cv.height);
            return {
                get: function () {
                    return data;
                },
                draw: function (x, y, rangeX, rangeY, color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y, rangeX, rangeY);
                },
                context: ctx,
            };
        }()),
        canvas = (function () {
            var gridX, gridY, startX, startY, range, curZoom, curPixel,
                colorPixel, pickerPixel, xbit, ybit, tempX, tempY, rX, rY,
                remainderW, remainderH,
                cv = createCanvas("canvas", 2),
                ctx = cv.getContext("2d"),
                buf = createCanvas('buffer', 2, false),
                bufCtx = buf.getContext('2d'),
                canvasImage = ctx.getImageData(0, 0, cv.width, cv.height),
                realC = canvasImage.data,
                rCanvas = document.getElementById("realCanvas");
            return {
                update: function () {
                    zbit = Math.pow(2, zoom);
                    xbit = (w / zbit) | 0;
                    ybit = (h / zbit) | 0;
                    remainderW = zbit / (w - xbit * zbit);
                    remainderH = zbit / (h - ybit * zbit);
                    
                },
                draw: function (x, y) {
                    var m, n,
                        fill = (flag["eraser"] === 0) ? fillStyle: "white";
                    curZoom = gz - zoom;
                    range = Math.pow(2, curZoom);
                    gridX = (x / bit) | 0;
                    gridY = (y / bit) | 0;

                    startX = gridX * bit;
                    startY = gridY * bit;
                    ctx.fillStyle = fill;
                    ctx.fillRect(startX, startY, bit, bit);
                    rX = curX + gridX * range;
                    rY = curY + gridY * range;
                    realCanvas.draw(rX, rY, range, range, fill)
                    for (m = 0; m <= range - 1; m += 1) {
                        for (n = 0; n <= range - 1; n += 1) {    
                            tempX = rX + m;
                            tempY = rY + n;
                            if (flag["eraser"] === 0) {
                                setPixels(realC, tempX, tempY, curColor[0], curColor[1], curColor[2], curColor[3]);
                            } else {
                                setPixels(realC, tempX, tempY, 0, 0, 0, 0);
                            }
                        }
                    }
                    miniDisplay.updateImage(rCanvas);
                },
                shift: function (x, y) {
                    
                    flag["displayover"] = 1;
                    flag["draw"] = 0;
                    canvas.update();
                    if (window.wiiu) {
                        x += (state.rStickX * 5) | 0;
                        y -= (state.rStickY * 5) | 0;
                    }

                    x = (x <= 0) ? 0:
                        (x >= w - xbit) ? w - xbit:
                        x;
                    y = (y <= 0) ? 0:
                        (y >= h - ybit) ? h - ybit:
                        y;
                    
                    if (flag["mousedown"] === 1) {
                        ctx.drawImage(rCanvas, x, y, xbit, ybit, 0, 0, w, h);
                        settings.updateXY(x, y, "red");
                        flag["loading"] = 1;
                    } else {
                        drawReal(ctx, realC, x, y, xbit, ybit);
                        settings.updateXY(x, y, "white");
                    }
                },
                postzoom: function (d) {
                 //   curX += Math.round((curX + 1) * 0.25);
                   // curY += Math.round((curY + 1) * 0.25);
                 //   canvas.update();
                    curX = (zoom === 0) ? 0: curX;
                    curY = (zoom === 0) ? 0: curY;
                    canvas.update();
                    flag["mousedown"] = 0;
                    canvas.shift((curX - xbit / 4 * d) | 0, (curY - ybit / 4 * d) | 0);
                    grid.reset();
                    flag["draw"] = 1
                    
                },
                zoomin: function () {
                    zoom = next1(zoom, max);
                    grid.reset();
                    canvas.postzoom(-1);
                },
                zoomout: function () {
                    zoom = back1(zoom, 0);
                    grid.reset();
                    canvas.postzoom(1);
                }
            };
        }()),
        ball = (function () {
            var ballRadius = 5,
                ball = {
                    radius: ballRadius,
                    defaultZ: 0,
                    defaultX: 0,
                    defaultY: -1,
                    ballStartX: 40,
                    ballStartY: 40,
                    x: 40,
                    y: 40,
                    start: true,
                    color: "black",
                    shadow: ballRadius / 4,
                    shadowAngle: 0,
                },
                canvas = createCanvas("ball", 8, 0),
                ctx = canvas.getContext("2d"),
                oldBallX = ball.x,
                oldBallY = ball.y;
            cImage = getImage("canvas");
            return {
                checkCollision: function () {
                    var aX = 20,
                        aZ = 20,
                        aY = 1,
                        shiftX = ((aX * state.accX) + (state.accY * aY)),
                        shiftY = ((aZ * state.accZ) + (state.accY * aY)),
                        newX = (ball.x - shiftX),
                        newY = (ball.y - shiftY),
                        curPixel, i, xCorner, yCorner;
                    // loop through canvas 
                    if (newX >= (canvas.width + ball.radius * zoom)) {
                        newX = 1 - ball.radius * zoom;
                    }
                    if (newX <= -ball.radius * zoom) {
                        newX = canvas.width + ball.radius * zoom;
                    }
                    if (newY >= (canvas.height + ball.radius * zoom)) {
                        newY = 1 - ball.radius * zoom;
                    }
                    if (newY <= -ball.radius * zoom) {
                        newY = canvas.height + ball.radius * zoom;
                    }
                    for(i = 0 ; i <= 360 ; i += 15 ) {
                        xCorner = ballRadius * ballRadius * Math.cos(i * radians);
                        yCorner = ballRadius * ballRadius * Math.sin(i * radians);
                        curPixel = getPixel(newX + xCorner, newY + yCorner);
                        if (cImage.data[curPixel + 3] > 20) {
                            newX += shiftX;
                            newY += shiftY;
                        }
                    }
                    ball.x = newX;
                    ball.y = newY;
                 //   ballGo = 0;
                },
                update: function () {
                    ball.checkCollision();
                    ctx.clearRect(oldBallX - ball.radius - 50, oldBallY - ball.radius - 50, (ball.radius + 10) * 2 * 50, (ball.radius + 10) * 2 * 50);
                    // ball
                    ctx.beginPath();
                    ctx.arc(ball.x + state.gyroZ * 5, ball.y, ball.radius * zoom, 0, 2 * Math.PI, false);
                    ctx.fillStyle = ball.color;
                    ctx.fill();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = ball.color;
                    ctx.stroke();
                    // shadow
                    ctx.beginPath();
                    ctx.arc(ball.x + state.gyroZ * 5, ball.y, (ball.radius - ball.shadow) * zoom, (state.angleY * 360 + 50) * radians, (state.angleY * 360 + 360) * radians, true);
                    ctx.lineWidth = 5;
                    ctx.strokeStyle = 'red';
                    ctx.stroke();
                },
                setBall: function (x, y) {
                    ball.x = x;
                    ball.y = y;
                }
            }
        }()),
        settings = (function () {
            var cv = createCanvas("settings", 4),
            ctx = cv.getContext("2d"),
            colorR = 100,
            menuWidth = 200;
            return {
                grid: function () {
                    var h2 = 230,
                        h3 = 19,
                        h4 = h2 + 5,
                        h5 = colorR + 2,
                        w2 = 2,
                        w3 = w2 + 9,
                        currentGrid = gz - zoom + 1;
                    ctx.clearRect(0, 0, 200, h);
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, h5, sw, h2 - h5);
                    ctx.strokeStyle = "black";
                    ctx.strokeStyle = "10px";
                    ctx.strokeRect(0, h5, sw, h2 - h5);
                    customFont("grid", ctx, 13, 145, "black", 8, 5, 1.5, false);
                    customFont("+", ctx, 15, 110, "black", 12, 1, 1.5, false);
                    customFont("-", ctx, 15, 210, "black", 12, 1, 1.5, false);
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, h2, sw, h3);
                    ctx.strokeRect(0, h2, sw, h3);
                    customFont(""+currentGrid+"", ctx, w2, h4, "black", 8, 2, 1.5, true);
                    customFont("x", ctx, w3, h4 + 3, "black", 6, 2, 1.5, true);
                },
                update: function () {
                    ctx.fillStyle = "white";
                    ctx.fillRect(w - sw, h - 137, sw, h / 2);
                    ctx.strokeStyle = "black";
                    ctx.strokeStyle = "10px";
                    ctx.strokeRect(w - sw, h - 137, sw, h / 3);
                    customFont("zoom", ctx, w - 7, h - 102, "black", 8, 5, 1.5, false);
                    customFont("+", ctx, w - 4, h - 124, "black", 12, 1, 1.5, false);
                    customFont("-", ctx, w - 4, h - 45, "black", 12, 1, 1.5, false);
      //            customFont("<-", ctx, 3, 310, "black", 6, 0, 1, 1.5, true);
                },
                updateXY: function (x, y, color){
                    ctx.fillStyle = (color) ? color: "green";
                    ctx.fillRect(w - sw, 0, sw, 180);
                    ctx.strokeRect(w - sw, 0, sw, 180);
                    customFont("x:"+x, ctx, w - 6, 10, "black", 8, 5, 1.5, false);
                    customFont("y:"+y, ctx, w - 6, 100, "black", 8, 5, 1.5, false);
                    miniDisplay.miniBox(x, y);
                    curX = x;
                    curY = y;
                },
                subMenu: function () { // change function name
                    ctx.clearRect(0, 0, menuWidth, h);
                    ctx.fillStyle = "black";
                    ctx.fillRect(0, 0, 110, 30);
                    customFont("eraser", ctx, 6   , 10, "white", 14, 5, 2, true);
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 30, 65, 20);
                    ctx.strokeStyle = "black";
                    ctx.strokeRect(0, 30, 65, 20);
                    customFont("match", ctx, 6, 37, "black", 8, 3, 1.5, true);
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 50, 55, 20);
                    ctx.strokeRect(0, 50, 55, 20);
                    customFont("save", ctx, 6, 57, "black", 8, 3, 1.5, true);
                },
                menuSelect: 0,
                menu: function () {
                    var options = ["eraser", "background", "foreground", "solid"],
                        numOptions = options.length,
                        i, f,
                        selected = {
                            w: 150,
                            h: 35,
                            bgColor: "black",
                            fColor: "white",
                            font: 15
                        };
                    ctx.clearRect(0, 0, menuW, h);
                    for (i = 0; i < numOptions; i += 1) {
                        w2 = options[i].length;
                        customFont(options[i], ctx, 6, 57, "black", 8, 3, 1.5, true);
                    }
                },
                updateZoom: function () {
                    var h2 = 25;
                    ctx.fillStyle = "white";
                    ctx.fillRect(w - sw, h - h2, sw, h2);
                    ctx.strokeStyle = "black";
                    ctx.strokeRect(w - sw, h - h2, sw, h2);
                    customFont(""+(zoom + 1)+"", ctx, w - 19, h - h2 / 1.5, "black", 8, 2, 1.5, true);
                    customFont("x", ctx, w - 10, h - 14, "black", 6, 2, 1.5, true);
                },
                updateAll: function () {
                    settings.update();
                    settings.grid();
                    settings.updateXY(curX, curY, "white");
                    settings.updateZoom();
                }
            }
        }()),
        colorCharts = (function () {
            var cv = createCanvas("chart", 9),
                ctx = cv.getContext('2d'),
                palettes = [
                    ["6bits_1.png", "6 bit"],
                    ["9bits_1.png", "9 bit"],
                    ["NES.png", "famicom"],
                    ["12bits_1.png", "12 bit"],
                    ["15bits_1.png", "15 bit"],
                    ["18bits_1.png", "18 bit"],
                    ["24bits_1.png", "24 bit"]
                ],
                imageLen = palettes.length - 1,
                chooseImage = 0,
                palette = new Image(),
                strokeW = 3,
                box = {
                    x: 0,
                    y: 50,
                    w: w / 3 | 0,
                    h: h / 2.3 | 0,
                },
                chart = {
                    x: box.x + strokeW / 2,
                    y: box.y + strokeW / 2,
                    w: box.w - strokeW,
                    h: box.h - strokeW,
                    func: function () {
                            flag["chartover"] = 1;
                            flag["draw"] = 0;
                    }
                },
                close = {
                    x: chart.x + chart.w + 3,
                    y: chart.y + 3,
                    w: closeW,
                    h: closeH
                },
                open = {
                    x: 0,
                    y: close.y,
                    w: close.w,
                    h: close.h
                },
                prev = {
                    x: chart.x,
                    w: 85,
                    h: 25,
                    y: box.y + box.h - 25,
                    text: "back"
                },
                next = {
                    x: prev.x + prev.w + strokeW,
                    y: prev.y,
                    w: prev.w - strokeW,
                    h: prev.h,
                    text: "next"
                },
                name = {
                    x: next.x + prev.w,
                    y: next.y,
                    w: box.w - prev.w * 2 - strokeW * 2, 
                    h: prev.h,
                    text: "default",
                    background: "yellow",
                    color: "red"
                },
                text = {
                    "prev": {
                        x: prev.x + 15,
                        y: prev.y + prev.w - 30
                    },
                    "next": {
                        
                    }
                },
                prevTextX = 5,
                prevTextY = 5,
                curFaves = [],
                colorPixel = getImage("chart").data,
                func = {
                    next: function () {
                        chooseImage = next1(chooseImage, imageLen);  
                        func.updateChart(chooseImage);
                    },
                    prev: function () {
                        chooseImage = back1(chooseImage, 0);
                        func.updateChart(chooseImage);
                    },
                    curColor: function () {
                        ctx.fillStyle = "white";
                        ctx.fillRect(0, 0, 50, 50);
                        ctx.fillStyle = fillStyle;
                        ctx.fillRect(4, 4, 42, 42);
                        ctx.beginPath();
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = 3;
                        ctx.strokeRect(0, 0, 50, 50);
                        ctx.closePath();
                        ctx.stroke();
                    },
                    updateChart: function (x) {
                        var ph, pw;
                        x = x || 0;
                        palette.src = (palettes[x][0]) ? palettes[x][0]: palettes[0][0];
                        palette.name = (palettes[x][1]) ? palettes[x][1]: "error";
                        ph = palette.height;
                        pw = palette.width;
                        ctx.fillStyle = "white";
                        ctx.fillRect(chart.x, chart.y, chart.w, chart.h - prev.h);
                        ctx.drawImage(palette, 0, 0, pw, ph, chart.x, chart.y, chart.w, ph*2);
                        colorPixel = getImage("chart").data;
                        name.text = palette.name;
                        func.button(name);
                    },
                    open: function () {
                        ctx.open = 1;
                        ctx.fillStyle = "white";
                        ctx.fillRect(box.x, box.y, box.w, box.h);
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = strokeW;
                        ctx.strokeRect(box.x, box.y, box.w, box.h);
                        ctx.stroke();
                        xBox(ctx, close.x, close.y);
                        func.updateChart(chooseImage);
                        func.button(prev);
                        func.button(next);
                        func.button(name);
                    },
                    close: function () {
                        ctx.open = 0;
                        ctx.clearRect(0,0,w,h);
                        xBox(ctx, 0, close.y);
                        func.curColor();
                    },
                    button: function (b) {
                        ctx.fillStyle = b.background || "white";
                        ctx.fillRect(b.x, b.y, b.w, b.h);
                        ctx.strokeStyle = "black";                       
                        ctx.beginPath();
                        ctx.lineWidth = strokeW;
                        ctx.strokeRect(b.x, b.y, b.w, b.h);
                        ctx.closePath();
                        ctx.stroke();
                        customFont(""+b.text+"", ctx, prevTextX + b.x, b.y + prevTextY, b.color || "black", 15, 8, 2.5, true);
                    }
                };
            ctx.open = 0;
            for (var i = imageLen; i >= 0; i -= 1) {
                palette.src = palettes[chooseImage][0];
            }
            return {
                nextChart: func.next,
                prevChart: func.prev,
                curColor: func.curColor,
                updateChart: func.updateChart,
                updateName: func.updateName,
                buttons: func.buttons,
                open: func.open,
                close: func.close,
                check: function(x, y) {
                    var curPixel = getPixel(x, y);
                    if (flag["mousedown"] === 1) {
                        if (ctx.open === 1) {
                            if (contains(box, x, y)) {
                                flag["chartover"] = 1;
                                flag["draw"] = 0;
                            }
                            if (contains(close, x, y)) {
                                flag["mousedown"] = 0;
                                func.close();
                                return;
                            } else if (contains(prev, x, y)) {
                                func.prev();
                            } else if (contains(next, x, y)){
                                func.next();
                            
                            } else if (colorPixel[curPixel + 3] !== 0) {
                                curColor.splice(0, 4, colorPixel[curPixel], colorPixel[curPixel + 1], colorPixel[curPixel + 2], colorPixel[curPixel + 3])
                                updateFill();
                                func.curColor();
                                return;
                            }
                        } else if (contains(open, x, y)) {
                            func.open();
                        }
                    }
                    flag["draw"] = 1;
                    flag["chartover"] = 0;
                }
            }
        }()),
        miniDisplay = (function () {
            var cv = createCanvas("miniDisplay", 11),
                ctx = cv.getContext("2d"),
                minicv = createCanvas("miniBox", 12),
                minictx = minicv.getContext('2d'),
                ratio = 4,
                displayW = (w / ratio) | 0,
                displayH = (h / ratio) | 0,
                displayX = 0,
                displayY = h - displayH,
                miniX = displayX + (curX / ratio) | 0,
                miniY = displayY + (curY / ratio) | 0,
                miniW = (displayW / zbit) | 0,
                miniH = (displayH / zbit) | 0,
                buffer = 20,
                closeX = displayX + displayW + 1,
                closeY = displayY + displayH - closeH,
                totalW = displayW + displayX + closeW,
                totalH = displayH + displayY + closeH,
                realCanvas = document.getElementById("realCanvas");
            ctx.open = 1;
         //   addDragger(displayX + displayW, displayY + displayH, 30, 30)
            return {
                miniBox: function (x, y) {
                    if (x && y) {
                        miniX = displayX + (x / ratio) | 0;
                        miniY = displayY + (y / ratio) | 0;
                        miniW = displayW / zbit | 0;
                        miniH = displayH / zbit | 0;
                    }
                    minictx.clearRect(displayX, displayY, displayW, displayH);
                    minictx.lineWidth = 1;
                    minictx.strokeStyle = "red";
                    minictx.strokeRect(miniX, miniY, miniW, miniH);
                    minictx.stroke();
                },
                bigBox: function (x, y) {
                    ctx.fillStyle = "white";
                    ctx.fillRect(x, y, displayW, displayH);
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = 4;
                    ctx.strokeRect(x, y, displayW, displayH);
                    ctx.stroke();
                },
                updateImage: function (img) {
                    if (ctx.open === 1) {
                    img = (img) ? img: realCanvas;
                    ctx.drawImage(realCanvas, displayX, displayY, displayW, displayH);
                    }
                },
                open: function () {
                    flag["displayopen"] = 1;
                    flag["displayover"] = 1;
                    flag["mousedown"] = 0;
                    flag["draw"] = 0;
                    ctx.open = 1;
                    miniDisplay.bigBox(displayX, displayY);
                    miniDisplay.miniBox(curX, curY);
                    miniDisplay.updateImage();
                    xBox(ctx, closeX, closeY);
                },
                close: function () {
                    ctx.clearRect(0,0,w,h);
                    minictx.clearRect(0,0,w,h);
                    xBox(ctx, 0, closeY);
                    flag["mousedown"] = 0;
                    flag["displayover"] = 0;
                    ctx.open = 0;
                    return;
                },
                check: function (x, y) {
                    
                    if (ctx.open === 1) {
                        if (x <= displayX + displayW + buffer && y <= displayY + displayH + buffer) {
                            if (x >= displayX - buffer && y >= displayY - buffer && flag["mousedown"] === 1) {
                                if (x >= closeX && y >= closeY && x <= totalW && y <= totalH) {
                                    miniDisplay.close();
                                    return;
                                }

                                x = ((x - miniW / 2) * ratio - displayX * ratio) | 0;
                                y = ((y - miniH / 2) * ratio - displayY * ratio) | 0;
                                canvas.shift(x, y);
                                return;
                            }
                        }
                    } else if (x <= closeW && y >= closeY && y <= totalH && flag["mousedown"] === 1) {
 
                        miniDisplay.open();
                      
                    }
                    flag["displayover"] = 0;
                }
            }
        }()),
        touchCheck = function (e) {
            var x, y;
            
            if (e) {
                x = e.pageX;
                y = e.pageY;
            
               if (window.wiiu) {
                   x = state.contentX;
                   y = state.contentY;
               }
            }
            if (x < 0 || y < 0 || x > w || y > h) {
                if (flag["draw"] === 0) {
                    flag["mousedown"] = 0;
                }
            }
            if (flag["drawing"] === 0 && flag["mousedown"] === 1) {
                colorCharts.check(x, y);
                miniDisplay.check(x, y);
            }
            if (flag["mousedown"] === 1 && flag["chartover"] === 0 && flag["displayover"] === 0 && flag["draw"] === 1) {
                flag["drawing"] = 1;
                canvas.draw(x, y);
            }
            
        },

        buttons = function (controls, e) {
            var event, zoomD, newZoom;
            if (window.wiiu) {
                state = window.wiiu.gamepad.update();
                if (!state.isEnabled || !state.isDataValid) {
                    state = null;
                }
                if (state.tpValidity === 0) {
                    if (state.tpTouch === 1) {
                        var x = e.pageX,
                            y = e.pageY;
                        canvas.draw(x, y);
                    }
                }
                if (state.rStickX !== 0 || state.rStickY !== 0) {
                    canvas.shift(curX, curY); //  I need to ensure the canvasX and canvasY shift in the fillCanvas(?) function
                }
                if (state.lStickX !== 0 || state.lStickY !== 0) {
                    picker.update();
                }
            } else { state = new DummyData;}
            event = e.keyCode || event.keyCode || controls.event || null;
            switch (event) {
            case 37: // left
                curX -= shift;
                canvas.shift(curX, curY);
                break;
            case 39: // right
                curX += shift;
                canvas.shift(curX, curY);
                break;
            case 38:  // up
                curY -= shift;
                canvas.shift(curX, curY);
                break;
            case 40: // down
                curY += shift;
                canvas.shift(curX, curY);
                break;
            case controls.grid.expand:
                grid.expand();
                break;
            case controls.grid.reduce:
                grid.reduce();
                break;
            case controls.ballon:
                toggle("ball")
                ball.update();
                ballGo = 1;
                break;
            case 13: // return/enter
                break;
            case controls.zoomout:
                canvas.zoomout();
                break;
            case controls.zoomin:
                canvas.zoomin();
                break;
            case controls.grid.toggle:
                toggle("grid");
                break;
            case 85: // u
                toggle("miniDisplay", 0);
                toggle("miniBox", 0);
                flag["displayopen"] = 0;
                flag["displayover"] = 0;
                break;
            case 73: // i
                toggle("miniDisplay", 1);
                toggle("miniBox", 1);
                flag["displayopen"] = 1;
                flag["displayover"] = 1;
                break;
            case 79: // o
                toggle("realCanvas", 0);
                toggle("canvas", 1);
                break;
            case 80: // p
                toggle("realCanvas", 1);
                toggle("canvas", 0);
                break;
            case controls.eraseron:
                flag["eraser"] = 1;
       //         settings.subMenu();
                break;
            case controls.eraseroff:
                flag["eraser"] = 0;
                break;
            case controls.save:
                zoom = 1;
                canvas.zoomout();
              //  toggle("grid", 0);
                exportImage("canvas");
                break;
            case 84:
                break;
            case 219: // [ open bracket
                if (flag["chartopen"] === 1) {
                    colorCharts.prevChart();
                }
                break;
            case 221: // ] close bracket
                flag["chartopen"] = 1;
                colorCharts.nextChart();
                break;
            case 220: // \ back slash
                if (flag["chartopen"] === 1) {
                    flag["chartopen"] = 0;
                    flag["chartover"] = 0;
                    
                }
                break;
            default:
                return true;
            }
            if (ballGo === 1) {
                ball.update();
            }
        };
        return {
            init: function () {
                var controls = {};
                controls = new Controls();
                grid.reset();
                canvas.update();
                settings.updateAll();
                colorCharts.close();
                miniDisplay.open();
                
                if (window.wiiu) {
                    window.onmousemove = function (e) {
                        flag["mousemove"] = 1;
                        flag["mousedown"] = 1;
                        touchCheck(e);
                    }
                    window.setInterval(buttons(controls), 20);
                } else {
                    ball.setBall(200, 200);
                    window.onkeydown = function (e) {
                        flag["keydown"] = 1;
                        buttons(controls, e);
                    }
                    window.onkeyup = function (e) {
                        flag["keydown"] = 0;   
                    }
                    window.onkeypress = function (e) {
                        flag['keypress'] = 1
                    }
                    window.onmousemove = function (e) {
                        flag["mousemove"] = 1;
                        touchCheck(e);
                    }
                    window.onmousedown = function (e) {
                        flag["mousedown"] = 1;
                        touchCheck(e);
                    }
                    window.onmouseup = function (e) {
                        flag["mousedown"] = 0;
                        flag["drawing"] = 0;
                        if (flag["loading"] === 1) {
                            canvas.shift(curX, curY);
                            flag["loading"] = 0;
                            flag["draw"] = 1
                        }
                    }
                    
                    flag["draw"] = 1;
            }
        }
    };
}());
window.onload = AR.R11.init;
