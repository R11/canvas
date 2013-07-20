AR.R11.Button = function (obj) {
    
    this.text = obj.text || null;
    this.ctx = obj.ctx;
    if (this.text) {
        this.text.ctx = obj.text.ctx || this.ctx;
        this.text = new AR.R11.Text(this.text);
    }
    
    this.def = {
        x: obj.x || 0,
        y: obj.y || 0,
        w: obj.w || 0,
        h: obj.h || 0,
        r: obj.r || null,
        style: obj.style || 0,
        defaultBorder: obj.border || obj.defaultBorder || "black",
        defaultBackground: obj.background || obj.defaultBackground || "white",
        hoverBorder: obj.hoverBorder || null,
        hoverBackground: obj.hoverBackground || null,
        clickBorder: obj.clickBorder || null,
        clickBackground: obj.clickBackground || null,
        lineWidth: obj.lineWidth || null
    }
    this.border = this.def.defaultBorder;
    this.background = this.def.defaultBackground;
    this.update();
    
    this.id = obj.id || "no id Button";
    
    this.image = obj.image || null;
    

    this.on = (obj.on) ? false: true;
    this.pressed = 0;

    this.load = obj.load || null;
    this.click = obj.click || null;
    this.dblclick = obj.dblclick || null;
    this.mousedown = obj.mousedown || null;
    this.mouseup = obj.mouseup || null;
    this.mousemove = obj.mousemove || null;
    this.mouseout = obj.mouseout || null;
    this.mouseover = obj.mouseover || null;
    this.resize = obj.resize || null;
}

/// for later - copy default setting like in Font
AR.R11.Button.prototype.update = function (obj) {
    var d = this.def;
    obj = obj || {};
   // this.ctx.clearRect(this.x, this.y, this.w, this.h);
    if (this.text) {
        this.text.update();
    }
    AR.R11.updateSettings(this, this.def, obj);
    this.draw();
}

AR.R11.Button.prototype.draw = function () {
    var ctx = this.ctx;
    ctx.fillStyle = this.background;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.border;
    ctx.strokeRect(this.x, this.y, this.w, this.h);
    if (this.text) {
        this.text.update();
    }
}

AR.R11.Button.prototype.onclick = function () {
    if (this.click && typeof this.click === "function") {
        this.click();
    }
}; 
AR.R11.Button.prototype.ondblclick = function () {
};
AR.R11.Button.prototype.onresize = function () {
    this.resetStyle();
    this.update();
    if (this.resize && typeof this.resize === "function") {
        this.resize();
    }
}
AR.R11.Button.prototype.onload = function () {
    this.resetStyle();
    this.update();
    if (this.load && typeof this.load === "function") { this.load(); }
};
AR.R11.Button.prototype.onmousedown = function () {
    this.clickStyle();
    this.update();
    this.pressed = 1;
    if (this.mousedown && typeof this.mousedown === "function") { this.mousedown(); }
};
AR.R11.Button.prototype.onmouseup = function () {
    if (this.pressed === 1 && this.hover === 1) {
        this.hoverStyle();
    } else if (this.hover === 0) {
        this.resetStyle();
    }
    this.pressed = 0;
    this.update();
    if (this.mouseup && typeof this.mouseup === "function") { this.mouseup(); }

};
AR.R11.Button.prototype.onmouseout =  function () {
    if (this.hover) {
        this.resetStyle();
        this.update();
        this.hover = false;
        if (this.mouseout && typeof this.mouseout === "function") { this.mouseout(); }
    }
};
AR.R11.Button.prototype.onmouseover = function () {
    if (!this.hover) {
        this.hoverStyle();
        this.update();
        this.hover = true;
        if (this.mouseover && typeof this.mouseover === "function") { this.mouseover(); }
    }
};
AR.R11.Button.prototype.resetStyle = function () {
    switch (this.style) {
        case 1:
            this.border = "black";
            this.background = "white";
            break;
        case 2:
            this.border = "blue";
            this.background = "yellow";
            break;
        default:
            this.border = this.defaultBorder;
            this.background = this.defaultBackground;
        break;
    }
}
AR.R11.Button.prototype.clickStyle = function () {
    switch (this.style) {
       case 1:
           this.border = "black";
           this.background = "red";
           break;
       case 2:
           this.border = "blue";
           this.background = "yellow";
           break;
       default:
            this.border = this.clickBorder || this.defaultBorder;
            this.background = this.clickBackground || this.defaultBackground;
       break;
    }
}
AR.R11.Button.prototype.hoverStyle = function () {
    switch (this.style) {
       case 1:
           this.border = "black";
           this.background = "green";
           break;
       case 2:
           this.border = "blue";
           this.background = "blue";
           break;
       default:
            this.border = this.hoverBorder || this.defaultBorder;
            this.background = this.hoverBackground || this.defaultBackground;
       break;
    }
}
AR.R11.Button.prototype.contains = function(x, y) {
  return  (this.x <= x) && (this.x + this.w >= x) &&
          (this.y <= y) && (this.y + this.h >= y);
}


