AR.R11.HUD = function (canvas) {
    var that = this,
        events, idx;
  //  o.HUD = o.HUD || {};
    if (canvas !== undefined) {
        this.canvas = canvas;
    
        this.buttonSelected = false;
        this.buttons = [];  // the collection of things to be drawn
        
        
        /*   /// doesn't work...
        events = {
            onmousedown: "mousedown",
            onmouseup: "mouseup",
            onclick: "click",
            ondblclick: "dblclick",
            onmouseover:"mouseover",
            onmousemove: "mousemove",
            onmouseout: "mouseout",
            onresize: "resize"
        };
        for (idx in events) {
            this.canvas[idx] = function (e) {
                var x = e.pageX || 0,
                    y = e.pageY || 0;
                that.checkButtons(events[idx], x, y);
            }
        }
        */
        
        this.canvas.onmousedown = function (e) {
            var x = e.pageX || 0, y = e.pageY || 0;
            that.checkButtons("mousedown", x, y);
        };
        this.canvas.onmousemove = function (e) {
            var x = e.pageX || 0, y = e.pageY || 0;
            that.checkButtons("mouseover", x, y);
        };
        this.canvas.onmouseup = function (e) {
            var x = e.pageX || 0, y = e.pageY || 0;
            that.checkButtons("mouseup", x, y);
        };
        this.canvas.ondblclick  = function (e) {
            var x = e.pageX || 0, y = e.pageY || 0;
            that.checkButtons("dblclick", x, y);
        };
//        this.canvas.onresize  = function (e) {
  //          var x = e.pageX || -1, y = e.pageY || -1;
    //        that.checkButtons("resize", x, y);
      //  };
        this.canvas.onclick = function (e) {
            var x = e.pageX || 0, y = e.pageY || 0;
            that.checkButtons("click", x, y);
        };
       
  
    } else {
        console.log("no canvas for HUD")
    }
}

AR.R11.HUD.prototype.loadButtons = function () {
    var button = this.buttons,
        b;    
    for (var i = button.length - 1; i >= 0; i -= 1) {
        b = button[i];
        if (typeof b.onload === 'function') {
            b.onload();
        }
    }
   
}

AR.R11.HUD.prototype.checkButtons = function (func, mx, my) {
    var button = this.buttons,
        f = "on"+func,
        x = mx || 0,
        y = my || 0,
        b;            
    for (var i = button.length - 1; i >= 0; i -= 1) {
        b = button[i];
        if (b.on && b[f] && b.contains(x, y)) {
            b[f]();
            this[f] = true;
            if (b[func] && typeof b[func] === "function") {
                b[func]();
            };
            this.buttonSelected = true;
            return;
        } else {
            if (b["onmouseout"]) {
                b["onmouseout"]();
            }
            this.buttonSelected = false;
            if (f === "onresize" || f === "onload") {
                b[f]();
            }
        }
    }
    if (this[f]) {
        this[f] = false;
    }   
}

AR.R11.HUD.prototype.addButton = function(button) {
    if (button.length) {
        for (var l = button.length - 1; l >= 0; l--) {
          //  this.buttons.push(button[l]);
            if (button[l].length) {
                this.addButton(button[l]);
            } else {
                this.buttons.push(button[l]);
            }
        }
    } else {
        this.buttons.push(button);
    }
}
AR.R11.HUD.prototype.deleteButtons = function () {
    this.buttons = null;
    this.buttons = [];
}
