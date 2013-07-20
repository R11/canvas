window.onload = function () {
    AR.R11.home.init();
}

AR.R11.home = {};

AR.R11.home = {
    init: function () {
        var set, set2,
            cv = AR.R11.canvas("home", 100),
            ctx = cv.getContext("2d"),
            greeting = {
                x: 15,
                y: 20,
                w: 0,
                h: 0,
                rows: 0,
                ctx: ctx,
                align: "center",
                size: function () {
                    return window.innerHeight / 50;
                },
                spacing: function () {
                    return window.innerWidth / 80;
                },
                leading: function () {
                    var s = (typeof greeting.size === "function") ? greeting.size(): greeting.size;
                    return window.innerHeight / 80 + s * 0.1 | 0;
                },
                lineWidth: function () {
                    return greeting.size / 5;
                },
                text: function () {
                    return "/f1.2/welcome to somegamesimade.com/n/n"+
                    "w: "+window.innerWidth+" h: "+window.innerHeight+""+
                    "/n/n/n/n/n"+
                    ".....ok, so maybe they aren't all games./n/n"+
                    "either way/n/bthis site shall be my laboratory!/n"+
                    "/n/n/n"+
                    "for instance this font./n"+
                    "/f0.8/it is not a real font/n"+
                    "/n/n/n/n/n"+
                    "here. try this drawing tool:/n";
                },
                button: {
                    ctx: ctx,
                    x: 0,
                    y: 0,
                    w: function () {
                        return window.innerWidth;
                    },
                    h: function () {
                        return window.innerHeight;
                    },
                    border: "green",
                    lineWidth: 15,
                    background: "white",
                   // hoverBackground: "yellow",
                    hoverBorder: "grey",
                    mouseup: function () {
                        var mod = {
                                strokeStyle: "red",
                                fillStyle: "red"
                            };
                        greeting.update(mod);
                    },
                    mouseover: function () {
                        var mod = {
                                strokeStyle: "grey",
                                fillStyle: "grey"
                            };
                        greeting.update(mod);
                    }
                }
            },
            greeting2 = {
                x: greeting.x,
                y: function () {
                    if (button.x === greeting.x) {
                        return greeting.y + (greeting.size + greeting.leading) * (greeting.rows + 3);
                    } else {
                        return greeting.y + (greeting.size + greeting.leading) * (greeting.rows + 1);
                    }
                },
                w: 0,
                h: 0,
                rows: 0,
                ctx: ctx,
                align: "center",
                size: function () {
                    return greeting.size;
                },
                spacing: function () {
                    return greeting.spacing;
                },
                leading: function () {
                    return greeting.leading;
                },
                lineWidth: function () {
                    return greeting.lineWidth;
                },
                text:
                "or if you are using a wii u,/n"+
                "enjoy the gyroscopes!/n"
            },
            button = {
                x: function () {
                    var newx = greeting.x + greeting.w - greeting.spacing * 13,
                        w = (button.w > button2.w) ? button.w: button2.w;
                    if (newx + w >= window.innerWidth) {
                        return greeting.x;
                    } else {
                        return newx;
                    }
                },
                y: function () {
                    if (button.x === greeting.x) {
                        return greeting.y + (greeting.size + greeting.leading) * (greeting.rows) | 0;
                    } else {
                        return greeting.y + greeting.size + (greeting.size + greeting.leading) * (greeting.rows - 3) | 0;
                    }
                },
                w: function () {
                    if (button.text.x && button.text.size) {
                        return button.text.w + button.text.x - button.x + button.text.size | 0;
                    } else {
                        return 200;
                    }
                },
                h: function () {
                    return window.innerHeight / 20;
                },
                align: "center",
                ctx: ctx,
                border: "red",
                background: "red",
                hoverBorder: "green",
                hoverBackground: "grey",
                clickBorder: "black",
                clickBackground: "#f394ac",
                lineWidth: 2,
                text: {
                    x: function () {
                        return button.x + button.text.size * 2;
                    },
                    y: function () {
                        return button.y + (button.h - button.text.size ) / 2;
                    },
                    h: 0,
                    w: 0,
                    size: function () {
                        return window.innerHeight / 60;
                    },
                    lineWidth: function () {
                        return button.text.size / 4;
                    },
                    color: "white",
                    spacing: function () {
                        return window.innerWidth / 70;
                    },
                    text: "draw!"
                },
                mouseup: function () {
                    console.log("clicked!!");
                    window.location = "canvas/oneObject.html";
                }
            },
            button2 = {
                x: function () {
                    return button.x;
                },
                y: function () {
                    if (button.x === greeting.x) {
                        return greeting2.y + (greeting2.size + greeting2.leading) * (greeting2.rows) | 0;
                    } else {
                        return greeting2.y + greeting2.size + (greeting2.size + greeting2.leading) * (greeting2.rows - 3) | 0;
                    }
                },
                w: function () {
                        return button2.text.w + button2.text.x - button2.x + button2.text.size | 0;
                   
                },
                h: function () {
                    return window.innerHeight / 20;
                },
                align: "center",
                ctx: ctx,
                border: "red",
                background: "green",
                hoverBorder: "green",
                hoverBackground: "grey",
                clickBorder: "black",
                clickBackground: "aaaaaa",
                lineWidth: 2,
                text: {
                    x: function () {
                        return button2.x + button2.text.size * 2;
                    },
                    y: function () {
                        return button2.y + (button2.h - button2.text.size ) / 2 | 0;
                    },
                    h: 0,
                    w: 0,
                    size: function () {
                        return window.innerHeight / 60;
                    },
                    lineWidth: function () {
                        return button2.text.size / 5;
                    },
                    color: "white",
                    spacing: function () {
                        return window.innerWidth / 70;
                    },
                    text: "go go gyro!"
                },
                mouseup: function () {
                    var ball = {
                            canvas: cv,
                            r: 15,
                            x: 100,
                            y: 200,
                            fillStyle: "#09a812",
                            strokeStyle: "black"
                        };
                    console.log("something cool is supposed to happen");
                    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
                    HUD.deleteButtons();
                    window.onresize = null;
                    ball = new AR.R11.Ball(cv);
                    // ball go function
                }
            },
            HUD = new AR.R11.HUD(cv);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        greeting = new AR.R11.Text(greeting);
        greeting.button = new AR.R11.Button(greeting.button);
        greeting2 = new AR.R11.Text(greeting2);
        button = new AR.R11.Button(button);
        button2 = new AR.R11.Button(button2);
        greeting.button.update();
        button.update();
        button2.update();
        greeting.update();
        greeting2.update();
        HUD.addButton(button);
        HUD.addButton(button2);
        HUD.addButton(greeting.button);
        HUD.loadButtons();

        window.onresize = function () {
            cv.width = window.innerWidth;
            cv.height = window.innerHeight;
            greeting.button.update();
            button.update();
            button2.update();
            greeting.update();
            greeting2.update();
        }
    }
}

AR.R11.button = {
    make: function (buttons) {
        var idx;
        if (buttons) {
            for (idx in buttons) {
                
            }
        } else {
            console.log("no buttons!!");
        }
    }
}