AR.R11.Ball = function (obj) {
    var ctx, that,
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
        };
    this.canvas = obj.canvas || AR.R11.canvas("ball", 200);
    ctx = this.canvas.getContext("2d");
    that = this;
    this.def = {
        ctx: ctx,
        r: obj.r || 10,
        x: obj.x || 40,
        y: obj.y || 40,
        state: function () {
            if (window.wiiu) {
                return window.wiiu.gamepad.update();
            } else {
                return obj.state || new DummyData();
            }
        },
        shiftx: obj.shiftx || function () {
            var ax = 0.8,
                ay = 0.8,
                state = this.def.state();
            return ((ax * state.accX) + (state.accY * ay));
        },
        shifty: obj.shifty || function () {
            var az = 0.8,
                ay = 0.8,
                state = this.def.state();
                return ((az * state.accZ) + (state.accY * ay));
        },
        angleStart: obj.angleStart || 0,
        angleEnd: obj.angleEnd || Math.PI * 2,
        fillStyle: obj.color || obj.fillStyle || "black",
        strokeStyle: obj.color || obj.strokeStyle || "black",
        shadow: 1 / 4,
        shadowAngle: 0
    }
    oldBallX = this.x;
    oldBallY = this.y;
    cImage = getImage("canvas");

}
AR.R11.Ball.prototype.update = function (obj) {
    var d = this.def;
    this.ctx = obj.ctx || d.ctx;
    this.r = obj.r || (typeof d.r === "function") ? d.r(): d.r;
    this.x = obj.x || (typeof d.x === "function") ? d.x(): d.x;
    this.y = obj.y || (typeof d.y === "function") ? d.y(): d.y;
    this.state = obj.state || d.state();
    this.shiftx = obj.shiftx || (typeof d.shiftx === "function") ? d.shiftx(): d.shiftx;
    this.shifty = obj.shifty || (typeof d.shifty === "function") ? d.shifty(): d.shifty;
    this.angleStart = obj.angleStart || (typeof d.angleStart === "function") ? d.angleStart(): d.angleStart;
    this.angleEnd = obj.angleEnd || (typeof d.angleEnd === "function") ? d.angleEnd(): d.angleEnd;
    this.fillStyle = obj.fillStyle || (typeof d.fillStyle === "function") ? d.fillStyle(): d.fillStyle;
    this.strokeStyle = obj.strokeStyle || (typeof d.strokeStyle === "function") ? d.strokeStyle(): d.strokeStyle;
    this.shadow = obj.shadow || (typeof d.shadow === "function") ? d.shadow(): d.shadow;
    this.shadowAngle = obj.shadowAngle || (typeof d.shadowAngle === "function") ? d.shadowAngle(): d.shadowAngle;
}
AR.R11.Ball.prototype.checkCollision = function (zoom) {
    var aX = 20,
        aZ = 20,
        aY = 1,
        z = zoom || 1,
        newX = (this.x - shiftX),
        newY = (this.y - shiftY),
        curPixel, i, xCorner, yCorner;
    // loop through canvas 
    if (newX >= (canvas.width + this.r * z)) {
        newX = 1 - this.r * z;
    }
    if (newX <= -this.r * z) {
        newX = canvas.width + this.r * z;
    }
    if (newY >= (canvas.height + this.r * z)) {
        newY = 1 - this.r * z;
    }
    if (newY <= -this.r * z) {
        newY = canvas.height + this.r * z;
    }
    for(i = 0 ; i <= 360 ; i += 15 ) {
        xCorner = thisRadius * thisRadius * Math.cos(i * radians);
        yCorner = thisRadius * thisRadius * Math.sin(i * radians);
        curPixel = getPixel(newX + xCorner, newY + yCorner);
        if (cImage.data[curPixel + 3] > 20) {
            newX += shiftX;
            newY += shiftY;
        }
    }
    this.x = newX;
    this.y = newY;
 //   thisGo = 0;
}
AR.R11.Ball.prototype.update = function (zoom) {
    var ctx = this.ctx,
        z = zoom || 1
    this.checkCollision();
    ctx.clearRect(oldBallX - this.r - 50, oldBallY - this.r - 50, (this.r + 10) * 2 * 50, (this.r + 10) * 2 * 50);
    // this
    ctx.beginPath();
    ctx.arc(this.x + state.gyroZ * 5, this.y, this.r * z, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.fillStyle;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.strokeStyle;
    ctx.stroke();
    // shadow
    ctx.beginPath();
    ctx.arc(this.x + state.gyroZ * 5, this.y, (this.r - this.shadow) * z, (state.angleY * 360 + 50) * radians, (state.angleY * 360 + 360) * radians, true);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'red';
    ctx.stroke();
}

