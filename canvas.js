AR.R11.Canvas = function (obj) {
    this.canvas = obj.canvas || document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = obj.width || window.innerWidth;
    this.canvas.height = obj.height || window.innerHeight;
    this.id = obj.id || "blank";
    
    this.style = {}
    this.style.zIndex = obj.zIndex || 1;  // create function to check if z/id is currently in use by another element
    this.style.left = obj.left || "0";
    this.style.top = obj.top || "0";
    this.style.position = obj.position || "absolute";
    this.style.visibility = obj.visibility || 'visible';
    this.on = obj.on || true;
    if (this.on) {
        document.body.appendChild(this.canvas);
    }
}

AR.R11.Canvas.prototype.toggle = function (t) {
    var v, tog = t || -1;
    if (tog >= 0) {
        v = (tog === 1) ? 'visible' : 'hidden';
     } else {
       v = (this.style.visibility === 'hidden') ? 'visible' : 'hidden';              
    }
    this.style.visibility = v;
}



/// using this currently - plan to switch to object above at some point
// !!!!!!  I should also combine the HUD and the canvas.  this way, I apply buttons to a
// particular canvas along with having prototyped event function


AR.R11.canvas =  function (id, z, viz) {
    var cv, ctx;
    cv = document.createElement("canvas");
    ctx = cv.getContext("2d");
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    cv.style.zIndex = z || 1;  // create function to check if z/id is currently in use by another element
    cv.style.left = "0";
    cv.style.top = "0";
    cv.style.position = "absolute";
    cv.style.visibility = (viz === false) ? 'hidden' : 'visible';
    cv.id = id || 1;
    cv.toggle = function (t) {
        var v, tog = t || -1;
        if (tog >= 0) {
            v = (tog === 1) ? 'visible' : 'hidden';
         } else {
           v = (this.style.visibility === 'hidden') ? 'visible' : 'hidden';              
        }
        this.style.visibility = v;
    };
    document.body.appendChild(cv);
    return cv;
}