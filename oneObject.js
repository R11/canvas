var window, document, R11 = {};
R11 = (function () {
    "use strict";
    var state,
        zoom = 4,    //  how zoomed in the image begins
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
        curX = 0,
        curY = 0,
      //  shift = Math.round(50 / zoom),
        shift = 1,
        curColor = [0, 0, 0, 1],
        fillStyle = "rgba(" + curColor[0] + "," + curColor[1] + "," + curColor[2] + "," + curColor[3] + " )",
        updateFill = function () {
            fillStyle = "rgba(" + curColor[0] + "," + curColor[1] + "," + curColor[2] + "," + curColor[3] + " )";
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
            cv.style.zIndex = z;  // create function to check if z/id is currently in use by another element
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
        exportImage = function (id) {
            var canvas = document.getElementById(id).toDataURL("image/png");
            window.open(canvas);
        },
        drawReal = function (ctx, data, x, y, xbit, ybit) {
            var check, curPixel;
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
        },
        closeW = 25,
        closeH = 30,
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
        };
    return {
        text: function (txt, ctx, x, y, c, s, a, sp, thick, ornt) {
            var i, a1, a2, a3, a4, a5, a6, a7, a8,
                x1, x2, x3, x4, x5, x6,
                y1, y2, y3, y4, y5, y6,
                low = txt.toLowerCase(),
                split = low.split(""),
                num = split.length,
                space = sp || 3,  // leading
                f = s || 10,  // font size
                an = a || 0,  // angle
                ang = Math.PI * a,
                color = c || "black",
                lw = thick || 5,
                d = lw / 2; // this variable shifts the
            ctx.fillStyle = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = lw;
            for (i = 0; i < num ; i += 1) {
                space = sp || 3;
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
                    a1 - f * 0.25;
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
                    x1 = 0;
                    x2 = f - a1;
                    y1 = -d;
                    y2 = f * 0.6;
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
                    y4 = f;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y4);
                    ctx.moveTo(x1, y2);
                    ctx.lineTo(x2, y3);
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
                    x4 = x2 + f * 0.1;
                    y1 = f * 1 - lw / 2;
                    y2 = f * 0;
                    y3 = f * 0.4;
                    space -= a1;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x1, y2);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x2, y3);
                    ctx.lineTo(x1, y3);
                    ctx.moveTo(x3, y3);
                    ctx.lineTo(x4, y1);
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
                    y2 = f * 1 - lw / 2;
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
                    y2 = f;
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
                    x1 = 0;
                    x2 = f - a1;
                    y1 = 0;
                    y2 = f;
                    space -= a1;
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
                    a1 = 0;
                    a2 = f / 2;
                    a3 = f - lw;
                    ctx.moveTo(a1, a2);
                    ctx.lineTo(a3, a2);
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
                    x3 = f * 0.25;
                    x1 = x3 + f * 0.02;
                    x2 = x3 + f * 0.25;
                    x4 = f - x3;
                    y1 = f * 0;
                    y2 = f * 0;
                    y3 = f * 1;
                    space -= x3;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.lineTo(x2, y3);
                    ctx.lineTo(x3, y3);
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
                space += lw / 2;
                x = (ornt === true) ? x + f + space: x;
                y = (ornt === false) ? y + f + space: y;
            }
            
        },
        grid: (function () {
            var cv = createCanvas("grid", 3),
                ctx = cv.getContext("2d");
            return {
                update: function () {
                    var f, e, t;
                    bit = Math.pow(2, gz);
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = (gz === zoom) ? "grey" : "black"; // grid color
                    t = (gz === zoom) ? 0.4 : 0.8; // grid thickness
                    for (f = 0; f <= w; f += bit) {
                        ctx.fillRect(f, 0, t, h);
                    }
                    for (e = 0; e <= h; e += bit) {
                        ctx.fillRect(0, e, w, t);
                    }
                    R11.settings.updateZoom();
                    R11.settings.grid();
                },
                expand: function () {
                    gz = (gz < max) ? gz + 1 : gz;
                    R11.grid.update();
                },
                reduce: function () {
                    gz = (gz > zoom) ? gz - 1 : zoom;
                    R11.grid.update();
                },
                reset: function () {
                    gz = zoom;
                    R11.grid.update();
                }
            };
        }()),
        realCanvas: (function () {
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
                }
            };
        }()),
        canvas: (function () {
            var gridX, gridY, startX, startY, range, curZoom, curPixel,
                colorPixel, pickerPixel, xbit, ybit, tempX, tempY, rX, rY,
                cv = createCanvas("canvas", 2),
                ctx = cv.getContext("2d"),
                canvasImage = ctx.getImageData(0, 0, cv.width, cv.height),
                realC = ctx.getImageData(0,0,w,h).data,
                rCanvas = document.getElementById("realCanvas");
            return {
                update: function () {
                    zbit = Math.pow(2, zoom);
                    xbit = Math.floor(w / zbit);
                    ybit = Math.floor(h / zbit);
                },
                draw: function (x, y) {
                    var m, n,
                        fill = (flag["eraser"] === 0) ? fillStyle: "white";
                    curZoom = gz - zoom;
                    range = Math.pow(2, curZoom);
                    gridX = Math.floor(x / bit);
                    gridY = Math.floor(y / bit);
                    startX = gridX * bit;
                    startY = gridY * bit;
                    ctx.fillStyle = fill;
              //      ctx.clearRect(startX, startY, bit, bit);
                    ctx.fillRect(startX, startY, bit, bit);
                    rX = curX + gridX * range;
                    rY = curY + gridY * range;
                    R11.realCanvas.draw(rX, rY, range, range, fill)
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
                    
                    R11.miniDisplay.updateImage(rCanvas);
                },
                shift: function (x, y) {
                    
                    flag["displayover"] = 1;
                    flag["draw"] = 0;
                    R11.canvas.update();
                    if (window.wiiu) {
                        x += Math.floor(state.rStickX * 5);
                        y -= Math.floor(state.rStickY * 5);
                    }
                    x = (x <= 0) ? 0 : x;
                    y = (y <= 0) ? 0 : y;
                    x = (x >= w - xbit) ? w - xbit : x;
                    y = (y >= h - ybit) ? h - ybit : y;
                    
                    if (flag["mousedown"] === 1) {
                        ctx.drawImage(rCanvas, x, y, w/zbit, h/zbit, 0, 0, w, h);
                        R11.settings.updateXY(x, y, "red");
                        flag["loading"] = 1;
                    } else {
                        drawReal(ctx, realC, x, y, xbit, ybit);
                        R11.settings.updateXY(x, y, "white");
                    }
                },
                postzoom: function (d) {
                 //   curX += Math.round((curX + 1) * 0.25);
                   // curY += Math.round((curY + 1) * 0.25);
                 //   R11.canvas.update();
                    curX = (zoom === 0) ? 0: curX;
                    curY = (zoom === 0) ? 0: curY;
                    R11.canvas.update();
                    flag["mousedown"] = 0;
                    R11.canvas.shift(Math.round(curX - xbit / 4 * d), Math.round(curY - ybit / 4 * d));
                    R11.grid.reset();
                    flag["draw"] = 1
                    
                },
                zoomin: function () {
                    zoom = (zoom < max) ? zoom + 1 : max;
                    R11.grid.reset();
                    R11.canvas.postzoom(-1);
                },
                zoomout: function () {
                    zoom = (zoom > 1) ? zoom - 1 : 0;
                    R11.grid.reset();
                    R11.canvas.postzoom(1);
                }
            };
        }()),
        ball: (function () {
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
                    R11.ball.checkCollision();
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
        settings: (function () {
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
                    R11.text("grid", ctx, 13, 145, "black", 8, 0.5, 5, 1.5, false);
                    R11.text("+", ctx, 15, 110, "black", 12, 0.5, 1, 1.5, false);
                    R11.text("-", ctx, 15, 210, "black", 12, 0.5, 1, 1.5, false);
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, h2, sw, h3);
                    ctx.strokeRect(0, h2, sw, h3);
                    R11.text(""+currentGrid+"", ctx, w2, h4, "black", 8, 0, 2, 1.5, true);
                    R11.text("x", ctx, w3, h4 + 3, "black", 6, 0, 2, 1.5, true);
                },
                update: function () {
                    ctx.fillStyle = "white";
                    ctx.fillRect(w - sw, h - 137, sw, h / 2);
                    ctx.strokeStyle = "black";
                    ctx.strokeStyle = "10px";
                    ctx.strokeRect(w - sw, h - 137, sw, h / 3);
                    R11.text("zoom", ctx, w - 7, h - 102, "black", 8, 0.5, 5, 1.5, false);
                    R11.text("+", ctx, w - 4, h - 124, "black", 12, 0.5, 1, 1.5, false);
                    R11.text("-", ctx, w - 4, h - 45, "black", 12, 0.5, 1, 1.5, false);
      //            R11.text("<-", ctx, 3, 310, "black", 6, 0, 1, 1.5, true);
                },
                updateXY: function (x, y, color){
                    ctx.fillStyle = (color) ? color: "green";
                    ctx.fillRect(w - sw, 0, sw, 180);
                    ctx.strokeRect(w - sw, 0, sw, 180);
                    R11.text("x:"+x, ctx, w - 6, 10, "black", 8, 0.5, 5, 1.5, false);
                    R11.text("y:"+y, ctx, w - 6, 100, "black", 8, 0.5, 5, 1.5, false);
                    R11.miniDisplay.miniBox(x, y);
                    curX = x;
                    curY = y;
                },
                subMenu: function () { // change function name
                    ctx.clearRect(0, 0, menuWidth, h);
                    ctx.fillStyle = "black";
                    ctx.fillRect(0, 0, 110, 30);
                    R11.text("eraser", ctx, 6   , 10, "white", 14, 0, 5, 2, true);
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 30, 65, 20);
                    ctx.strokeStyle = "black";
                    ctx.strokeRect(0, 30, 65, 20);
                    R11.text("match", ctx, 6, 37, "black", 8, 0, 3, 1.5, true);
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 50, 55, 20);
                    ctx.strokeRect(0, 50, 55, 20);
                    R11.text("save", ctx, 6, 57, "black", 8, 0, 3, 1.5, true);
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
                        R11.text(options[i], ctx, 6, 57, "black", 8, 0, 3, 1.5, true);
                    }
                },
                updateZoom: function () {
                    var h2 = 25;
                    ctx.fillStyle = "white";
                    ctx.fillRect(w - sw, h - h2, sw, h2);
                    ctx.strokeStyle = "black";
                    ctx.strokeRect(w - sw, h - h2, sw, h2);
                    R11.text(""+(zoom + 1)+"", ctx, w - 19, h - h2 / 1.5, "black", 8, 0, 2, 1.5, true);
                    R11.text("x", ctx, w - 10, h - 14, "black", 6, 0, 2, 1.5, true);
                },
                updateAll: function () {
                    R11.settings.update();
                    R11.settings.grid();
                    R11.settings.updateXY(curX, curY, "white");
                    R11.settings.updateZoom();
                }
            }
        }()),
        colorCharts: (function () {
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
                strokeW = 5,
                boxX = 0,
                boxY = 50,
                boxW = Math.round(w / 3),
                boxH = Math.round(h / 2),
                chartW = boxW - strokeW,
                chartX = boxX + strokeW/2,
                chartH = boxH - strokeW,
                chartY = boxY + strokeW/2,
                closeX = chartX + chartW + 3,
                closeY = chartY + 3,
                arrowX = chartX,
                arrowW = 160,
                arrowH = 50,
                arrowY = boxY + boxH - arrowH,
                curFaves = [],
                curChoice = curColor,
                colorPixel = getImage("chart").data;
            ctx.open = 0;
            for (var i = imageLen; i >= 0; i -= 1) {
                palette.src = palettes[chooseImage][0];
            }
            return {
                nextChart: function () {
                    chooseImage =
                        (chooseImage < imageLen) ? (chooseImage + 1):
                        (chooseImage < 0) ? 0:
                        imageLen;
                        
                    R11.colorCharts.showChart();
                },
                prevChart: function () {
                    chooseImage =
                        (chooseImage > 0) ? chooseImage - 1:
                        (chooseImage > imageLen) ? imageLen - 1:
                        0;
                        
                    chooseImage = (chooseImage < 0) ? 0: chooseImage;
                    R11.colorCharts.showChart();
                },
                check: function(x, y) {
                    var curPixel = getPixel(x, y);
                    if (flag["mousedown"] === 1) {
                        if (ctx.open === 1) {
                            if (x >= closeX && x <= closeX + closeW && y >= closeY && y <= closeY + closeH) {
                                flag["mousedown"] = 0;
                                R11.colorCharts.close();
                                return;
                            } else if (y >= arrowY && y <= arrowY + arrowH) {
                                flag["chartover"] = 1;
                                flag["draw"] = 0;
                                if (x >= arrowX && x <= (arrowX + boxW) / 2) {
                                    R11.colorCharts.prevChart();
                                } else {
                                    R11.colorCharts.nextChart();
                                }
                            } else if (colorPixel[curPixel + 3] !== 0) {
                                flag["chartover"] = 1;
                                flag["draw"] = 0;
                                    curColor.splice(0, 4, colorPixel[curPixel], colorPixel[curPixel + 1], colorPixel[curPixel + 2], colorPixel[curPixel + 3])
                                    updateFill();
                                    R11.colorCharts.curColor();
                                return;
                            }
                        } else if (x >= 0 && x <= closeW && y >= closeY && y <= closeY + closeH) {
                            R11.colorCharts.open();
                        
                            flag["draw"] = 0;
                            flag["mousedown"] = 0;
                            flag["chartover"] = 0;
                        }
                    }
                    flag["draw"] = 1;
                    flag["chartover"] = 0;
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
                showChart: function () {
                    var ph, pw;
                    palette.src = (palettes[chooseImage][0]) ? palettes[chooseImage][0]: palettes[0][0];
                    palette.name = (palettes[chooseImage][1]) ? palettes[chooseImage][1]: "error";
                    ph = palette.height;
                    pw = palette.width;
                    ctx.fillStyle = "white";
                    ctx.fillRect(chartX, chartY, chartW, chartH - arrowH);
                    ctx.drawImage(palette, 0, 0, pw, ph, chartX, chartY, chartW, ph*2);
                    colorPixel = getImage("chart").data;
                    
                    R11.colorCharts.updateName(palette.name);
                },
                updateName: function (name){
                    ctx.fillStyle = "white";
                    ctx.fillRect(arrowX + arrowW + strokeW, arrowY, boxW - arrowW * 2 - strokeW * 3, arrowH - strokeW);
                    ctx.font = "25px sans-serif";
                    ctx.fillStyle = "black";
                    ctx.beginPath();
                    ctx.fillText(""+ name +"", arrowX + arrowW + strokeW + 30, arrowY + arrowH - arrowH/3);
                    ctx.closePath();
                    ctx.fill();  
                },
                arrows: function () {

                    ctx.strokeStyle = "black";
                    ctx.font = "25px sans-serif";
                    ctx.fillStyle = "black";
                    
                    ctx.beginPath();
                    ctx.lineWidth = strokeW;
                    ctx.strokeRect(arrowX, arrowY, arrowW, arrowH);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fillText("prev", arrowX + 5, arrowY + arrowH - arrowH/3);
                    ctx.fill();
                    
                    ctx.beginPath();
                    ctx.lineWidth = strokeW;
                    ctx.strokeRect(arrowX + boxW - arrowW, arrowY, arrowW - strokeW, arrowH);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.fillText("next", arrowX + boxW - arrowW + 5, arrowY + arrowH - arrowH/3);
                    ctx.fill();                    
                },
                open: function () {
                    ctx.open = 1;
                    ctx.fillStyle = "white";
                    ctx.fillRect(boxX, boxY, boxW, boxH);
                    ctx.strokeStyle = "black";
                    ctx.lineWidth = strokeW;
                    ctx.strokeRect(boxX, boxY, boxW, boxH);
                    ctx.stroke();
                    xBox(ctx, closeX, closeY);
                    R11.colorCharts.arrows();
                    R11.colorCharts.showChart();

                },
                close: function () {
                    ctx.open = 0;
                    ctx.clearRect(0,0,w,h);
                    xBox(ctx, 0, closeY);
                    R11.colorCharts.curColor();
                }
            }
        }()),
        miniDisplay: (function () {
            var cv = createCanvas("miniDisplay", 11),
                ctx = cv.getContext("2d"),
                minicv = createCanvas("miniBox", 12),
                minictx = minicv.getContext('2d'),
                ratio = 4,
                displayW = Math.round(w / ratio),
                displayH = Math.round(h / ratio),
                displayX = 0,
                displayY = h - displayH,
                miniX = displayX + Math.round(curX / ratio),
                miniY = displayY + Math.round(curY / ratio),
                miniW = Math.round(displayW / zbit),
                miniH = Math.round(displayH / zbit),
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
                        miniX = displayX + Math.round(x / ratio);
                        miniY = displayY + Math.round(y / ratio);
                        miniW = displayW / zbit;
                        miniH = displayH / zbit;
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
                    R11.miniDisplay.bigBox(displayX, displayY);
                    R11.miniDisplay.miniBox(curX, curY);
                    R11.miniDisplay.updateImage();
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
                                    R11.miniDisplay.close();
                                    return;
                                }

                                x = Math.round((x - miniW / 2) * ratio - displayX * ratio);
                                y = Math.round((y - miniH / 2) * ratio - displayY * ratio);
                                R11.canvas.shift(x, y);
                                return;
                            }
                        }
                    } else if (x <= closeW && y >= closeY && y <= totalH && flag["mousedown"] === 1) {
 
                        R11.miniDisplay.open();
                      
                    }
                    flag["displayover"] = 0;
                }
            }
        }()),
        touchCheck: function (e) {
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
                R11.colorCharts.check(x, y);
                R11.miniDisplay.check(x, y);
            }
            if (flag["mousedown"] === 1 && flag["chartover"] === 0 && flag["displayover"] === 0 && flag["draw"] === 1) {
                flag["drawing"] = 1;
                R11.canvas.draw(x, y);
            }
            
        },
        
        buttons: function (e) {
            if (window.wiiu) {
                state = window.wiiu.gamepad.update();
                if (!state.isEnabled || !state.isDataValid) {
                    state = null;
                }
                if (state.tpValidity === 0) {
                    if (state.tpTouch === 1) {
                        R11.canvas.draw();
                    }
                }
                if (state.rStickX !== 0 || state.rStickY !== 0) {
                    R11.canvas.shift(); //  I need to ensure the canvasX and canvasY shift in the fillCanvas(?) function
                }
                if (state.lStickX !== 0 || state.lStickY !== 0) {
                    R11.picker.update();
                }
                switch (state.hold & 0x7f86fffc) { // wiiu buttons
                case 0x00002000:  // 
                    toggle("settings");
                    break;
                case 0x00008000:  // A button
                    toggle("ball", 1);
                    toggle("settings", 0);
                    toggle("grid", 0);
                    cImage = getImage("canvas");
                    ballGo = 1;
                    break;
                case 0x00000008: // + sign
                    // reminder:  add the ability to hold the rStick in order to zoom downward rather than always top-left
                    R11.canvas.zoomin();
                    break;
                case 0x00000004: // - sign
                    R11.canvas.zoomout();
                    break;
                case 0x00000800:  // left
                    R11.settings.subMenu();
         
                    break;
                case 0x00000400:  // right
                    R11.picker.update();
                    R11.settings.grid();
                    break;
                case 0x00000200:  // up
                    R11.grid.expand();
                    break;
                case 0x00000100:  // down
                    R11.grid.reduce();
                    break;
                case 0x00040000:  // lstick
                    toggle("grid", 1);
                    break;
                case 0x00020000:
                    toggle("grid", 0);
                    break;
                case 0x00000010:  // R shoulder
                    toggle("ball", 0);
                    toggle("settings", 1);
                    toggle("grid", 1);
                    ballGo = 0;
                    break;
                default:
                    break;   //change this to "return" when I isolate the switch
                }
                if (ballGo === 1) {
                    R11.ball.update();
                }
            } else {  // computer controls
                var event, zoomD, newZoom;
                if (e !== undefined) {
                    e = e || event;
                    if (e.pageX) {
                        R11.canvas.draw();
                    }
                    if (e.keyCode <= 57 && e.keyCode >= 49) {
                  //      newZoom = e.keyCode - 49;
                //        if (zoom !== e.keyCode - 49) {
              //              zoomD = (zoom < newZoom) ? -1: 1;
            //                zoom = newZoom;
          //                  R11.canvas.postzoom(zoomD);
          //              }
        //                return;
                    }
                    switch (e.keyCode) {
                    case 37: // left
                        curX -= shift;
                        R11.canvas.shift(curX, curY);
                        break;
                    case 39: // right
                        curX += shift;
                        R11.canvas.shift(curX, curY);
                        break;
                    case 38:  // up
                        curY -= shift;
                        R11.canvas.shift(curX, curY);
                        break;
                    case 40: // down
                        curY += shift;
                        R11.canvas.shift(curX, curY);
                        break;
                    case 190:  // period
                        R11.grid.expand();
                        break;
                    case 188:  // comma
                        R11.grid.reduce();
                        break;
                    case 66: // b
                        toggle("ball")
                        R11.ball.update();
                        ballGo = 1;
                        break;
                    case 13: // return/enter
                        break;
                    case 75: // k
                        R11.canvas.zoomout();
                        break;
                    case 76: // lÊ
                        R11.canvas.zoomin();
                        break;
                    case 71: // g
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
                    case 81: // q
                        flag["eraser"] = 1;
               //         R11.settings.subMenu();
                        break;
                    case 87: // w
                        flag["eraser"] = 0;
                        break;
                    case 83: // save
                        zoom = 1;
                        R11.canvas.zoomout();
                      //  toggle("grid", 0);
                        exportImage("canvas");
                        break;
                    case 84:
                        break;
                    case 219: // [ open bracket
                        if (flag["chartopen"] === 1) {
                            R11.colorCharts.prevChart();
                        }
                        break;
                    case 221: // ] close bracket
                        flag["chartopen"] = 1;
                        R11.colorCharts.nextChart();
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
                }
            }
        },
        init: function () {
            R11.grid.update();
            R11.canvas.update();
            R11.settings.updateAll();
            R11.colorCharts.close();
            R11.miniDisplay.open();
            if (window.wiiu) {
                window.onmousemove = function (e) {
                    flag["mousemove"] = 1;
                    R11.touchCheck(e);
                }
                window.setInterval(R11.buttons, 20);
            } else {
                state = new DummyData();
                R11.ball.setBall(200, 200);
                window.onkeydown = function (e) {
                    flag["keydown"] = 1;
                    R11.buttons(e);
                }
                window.onkeyup = function (e) {
                    flag["keydown"] = 0;   
                }
                window.onkeypress = function (e) {
                    flag['keypress'] = 1
                }
                window.onmousemove = function (e) {
                    flag["mousemove"] = 1;
                    R11.touchCheck(e);
                }
                window.onmousedown = function (e) {
                    flag["mousedown"] = 1;
                    R11.touchCheck(e);
                }
                window.onmouseup = function (e) {
                    flag["mousedown"] = 0;
                    flag["drawing"] = 0;
                    if (flag["loading"] === 1) {
                        R11.canvas.shift(curX, curY);
                        flag["loading"] = 0;
                        flag["draw"] = 1
                    }
                }
                
                flag["draw"] = 1;

            }
        }
    };
}());
window.onload = R11.init;