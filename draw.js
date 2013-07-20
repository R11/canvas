AR.R11.draw = {
        state,
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
                this.state = new DummyData();
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
            eraser: 0
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
            cv.style.zIndex = z || 1;  // create function to check if z/id is currently in use by another element
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
            var check, curPixel, a, b;
            ctx.save();
            for (a = 0; a <= xbit; a += 1) {
                for (b = 0; b <= ybit; b += 1) {
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
        grid = (function () {
            var cv = createCanvas("grid", 3);
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
        makeGrid = function (cv, size, x, y, w, h) {
            var ctx, step, f, e, t;
            cv = cv || document.createElement("canvas");
            size = size || 1;
            step = Math.pow(2, size);
            ctx = cv.getContext("2d");
            w = w || cv.width || 100;
            h = h || cv.height || 100;
            x = x || 0;
            y = y || 0;
            t = 0.7;
            ctx.clearRect(x, y, w, h);
            ctx.fillStyle = cv. color || "black";
            for (f = x; f <= w; f += step) {
                ctx.fillRect(f, y, t, h);
            }
            for (e = y; e <= h; e += step) {
                ctx.fillRect(x, e, w, t);
            }
            settings.updateZoom();
            settings.grid();
            return step;
        },
        realCanvas = (function () {
            var image, data,
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
                context: ctx
            };
        }()),
        canvas = (function () {
            var gridX, gridY, startX, startY, range, curZoom, xbit, ybit, tempX, tempY, rX, rY,
                remainderW, remainderH,
                cv = createCanvas("canvas", 2),
                ctx = cv.getContext("2d"),
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
                    realCanvas.draw(rX, rY, range, range, fill);
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
                        i,
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

                backTextX = 5,
                backTextY = 5,
                curFaves = [],
                colorPixel = getImage("chart").data,
                pheight,
                paletteHeight = 0,
                func = {
                    next: function () {
                        chooseImage = next1(chooseImage, imageLen);  
                        func.updateChart(chooseImage);
                    },
                    back: function () {
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
                        palette.src = palettes[x][0] || palettes[0][0];
                        palette.name = palettes[x][1] || "error";
                        ph = palette.height;
                        pw = palette.width;
                        ctx.fillStyle = "white";
                        ctx.fillRect(chart.x, chart.y, chart.w, chart.h - back.h);
                        ctx.drawImage(palette, 0, 0, pw, ph, chart.x, chart.y, chart.w, ph*2);
                        colorPixel = getImage("chart").data;
                        name.text = palette.name;
                        func.button(name);
                        paletteHeight = (pheight > paletteHeight) ? pheight : paletteHeight;
                    },
                    open: function () {
                        ctx.open = 1;
                        ctx.fillStyle = "white";
                        ctx.fillRect(box.x, box.y, box.w, box.h);
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = box.borderWidth || 3;
                        ctx.strokeRect(box.x, box.y, box.w, box.h);
                        ctx.stroke();
                        xBox(ctx, close.x, close.y);
                        func.updateChart(chooseImage);
                        func.button(back);
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
                        ctx.lineWidth = b.borderWidth || 3;
                        ctx.strokeRect(b.x, b.y, b.w, b.h);
                        ctx.closePath();
                        ctx.stroke();
                        customFont(""+b.text+"", ctx, backTextX + b.x, b.y + backTextY, b.color || "black", 15, 8, 2.5, true);
                    }
                },
                box = {}, chart = {}, close = {}, open = {}, back = {}, next = {}, name = {}, text = {};
            ctx.open = 0;
            func.open();
            for (var i = 0; i !== imageLen; i += 1) {
                palette.src = palettes[i][0];
                palette.name = palettes[i][1];
                pheight = palette.height;
                //console.log(palette.height);
               // func.updateChart(i);
            }
            func.close();

            box.h = paletteHeight;
            box = {
                x: 0,
                y: 50,
                w: w / 3 | 0,
                h: (paletteHeight + strokeW) * 2
            };
            chart = {
                x: box.x + strokeW / 2,
                y: box.y + strokeW / 2,
                w: box.w - strokeW,
                h: box.h - strokeW,
                func: function () {
                    flag["chartover"] = 1;
                    flag["draw"] = 0;
                }
            };
            close = {
                x: chart.x + chart.w + 3,
                y: chart.y + 3,
                w: closeW,
                h: closeH
            };
            open = {
                x: 0,
                y: close.y,
                w: close.w,
                h: close.h
            };
            back = {
                x: chart.x,
                y: 242,
                w: 85,
                h: 25,
                text: "back"
            };
            next = {
                x: back.x + back.w + strokeW,
                y: back.y,
                w: back.w - strokeW,
                h: back.h,
                text: "next"
            };
            name = {
                x: next.x + back.w,
                y: next.y,
                w: box.w - back.w * 2 - strokeW * 2, 
                h: back.h,
                text: "default",
                background: "yellow",
                color: "red"
            };
            text = {
                "back": {
                    x: back.x + 15,
                    y: back.y + back.w - 30
                },
                "next": {
                    
                }
            };
            return {
                nextChart: func.next,
                backChart: func.back,
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
                            } else if (contains(back, x, y)) {
                                func.back();
                            } else if (contains(next, x, y)){
                                func.next();
                            
                            } else if (colorPixel[curPixel + 3] !== 0) {
                                curColor.splice(0, 4, colorPixel[curPixel], colorPixel[curPixel + 1], colorPixel[curPixel + 2], colorPixel[curPixel + 3]);
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
            };
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
            };
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
            var event;
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
            } else { state = new DummyData();}
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
                toggle("ball");
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
                    colorCharts.backChart();
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