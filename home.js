window.onload = function () {
    AR.R11.home.init();
}

AR.R11.home = {};

AR.R11.home = {
    cv: null,
    ctx: null,
    message: {
        ctx: null,
        x: 20,
        y: 20,
        size: 5,
        spacing:5,
        leading: 10,
        lineWidth: 1.1,
        text:
        "welcome to somegamesimade.com/n"+
        "this shall henceforth be my playground/n"+
        "/n/n"+
        "here is where i teach myself coding./n"+
        "i plan to give myself various challenges for seemingly no reason/n"+
        "/n"+
        "for instance this font./n"+
        "it is not a real font.  it is made in code and resizes with the page/n"+
        "/n/n"+
        "or this drawing app:/n"+
        "/n/n/n/n"+
        "(save with s)"+
        "/n/n/n"+
        "or if you are using a wii u, enjoy the gyroscopes!/n"
    },
    init: function () {
        var set, c = 1,
            cv = AR.R11.canvas("homePage", 1),
            ctx = cv.getContext("2d"),
            size = 50;
        this.message.ctx = ctx;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        set = AR.R11.font.set(this.message);
        set.draw(cv.height / size | 0);
        window.onresize = function () {
            cv.height = window.innerHeight;
            cv.width = window.innerWidth;
            set.draw(cv.height / size | 0);
        }

        window.onclick = function () {
            if (c === 1) {
                //AR.R11.clear
                ctx.clearRect(0, 0, cv.width, cv.height);
                window.onclick = null;
                AR.R11.draw.init();
                c = 0;
            } else {
                //AR.R11.home.init();
                //AR.R11.clear;
                //document.body.appendChild(cv);
                c = 1;
            }
            //window.location.href="canvas/oneObject.html";
        }
    },
    clear: function (ctx) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        document.removeChild();
    }
}

AR.R11.clear = function () {
    var element = document.body;
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
}

AR.R11.load = function (obj) {
    try {
    
    var gridCanvas = new AB.R1.Canvas({id: "grid", zIndex: 5}),
        hudCanvas = new AB.R1.Canvas({id: "HUD", zIndex: 90}),
        drawingCanvas = new AB.R1.Canvas({id: "canvas", zIndex: 1}),
        grid = new AB.R1.Grid({canvas: gridCanvas.canvas}),
        hud = new AB.R1.HUD({canvas: hudCanvas.canvas, grid: grid}),
        gridButtons = grid.buttons({x: 100, y: 80, w: 50});
    drawingCanvas.grid = grid;
    for (var l = gridButtons.length - 1; l >= 0; l-=1) {
        hud.addButton(new AB.R1.Button(gridButtons[l]))
    }
    hud.initDraw(drawingCanvas);
    hud.loadButtons();
    
    } catch (exception) {
        console.log(exception);
    }
}