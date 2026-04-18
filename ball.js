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
    this.oldX = this.def.x;
    this.oldY = this.def.y;
    this.update();
};

AR.R11.Ball.prototype.update = function (obj) {
    obj = obj || {};
    AR.R11.updateSettings(this, this.def, obj);
};

AR.R11.Ball.prototype.setBall = function (x, y) {
    this.oldX = this.x;
    this.oldY = this.y;
    this.x = x;
    this.y = y;
};

AR.R11.Ball.prototype.draw = function (zoom) {
    var ctx = this.ctx,
        z = zoom || 1,
        s = this.state || {},
        gyroZ = s.gyroZ || 0,
        angleY = s.angleY || 0,
        radians = Math.PI / 180;
    ctx.clearRect(this.oldX - this.r - 2, this.oldY - this.r - 2,
                  (this.r + 4) * 2, (this.r + 4) * 2);
    ctx.beginPath();
    ctx.arc(this.x + gyroZ * 5, this.y, this.r * z, 0, 2 * Math.PI, false);
    ctx.fillStyle = this.fillStyle;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = this.strokeStyle;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(this.x + gyroZ * 5, this.y, (this.r - this.shadow) * z,
            (angleY * 360 + 50) * radians, (angleY * 360 + 360) * radians, true);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'red';
    ctx.stroke();
    this.oldX = this.x;
    this.oldY = this.y;
};

