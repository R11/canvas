
AR.R11.font = {
     set: function (obj) {
          var text = obj.text || "error",
               split = text.toLowerCase().split(""),
               num = split.length,
               ctx = obj.ctx,
               initx = obj.x || 0,
               inity = obj.y || 0,
               x = initx,
               y = inity,
               size = obj.size || 20,
               spacing = obj.spacing || 5,
               leading = obj.leading || 5,
               angle = obj.angle || 0,
               newLine = false,
               i, t, t2;
          
          ctx.fillStyle = obj.color || "black";
          ctx.strokeStyle = obj.color || "black";
          ctx.lineWidth = obj.lineWidth || 5;
          return {
               draw: function (s) {
                    s = s || size;
                    x = initx;
                    y = inity;
                    for (i = 0; i !== num; i += 1) {
                        t = split[i];
                        t2 = split[i + 1];
                        if (t === "/"){
                              if (t2 === "n") {
                                   newLine = true;
                                   i += 1;
                              }
                        } else if (AR.R11.font.chr[""+ t +""]) {
                              ctx.save();
                              ctx.translate(x + 0.5, y + 0.5);
                              ctx.rotate(angle);
                              ctx.beginPath();
                              x += AR.R11.font.chr[""+ t +""](ctx, s) + spacing | 0;
                              ctx.restore();
                        }
                        if (x + s > window.innerWidth) {
                              newLine = true;
                              if (t2 === " ") {
                                   i += 1;
                              }
                        }
                        if (newLine) {
                              y += s + leading;
                              x = obj.x || 0;
                              newLine = false;
                         }
                    }
               }
          }
     },
     chr: {
     "a": function (ctx, size) {
          var s = size || 1;
               a1 = s * 0.25,
               a2 = s * 0.15,
               a3 = s * 0.15,
               x = 0,
               x2 = a1,
               x3 = s - a1 - a3,
               x4 = s - a3,
               y = s,
               y2 = s * 0.5,
               y3 = s * 0,
               y4 = s * 0.6;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.lineTo(x2, y3);
          ctx.lineTo(x3, y3);
          ctx.lineTo(x4, y2);
          ctx.lineTo(x4, y);
          ctx.moveTo(x4, y4);
          ctx.lineTo(x, y4);
          ctx.stroke();
          return x4;
     },
     "b": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.25,
               x = 0,
               x2 = s - a1,
               x3 = s * 0.55,
               y = s * 1,
               y2 = s * 0.5,
               y3 = 0;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y2);
          ctx.lineTo(x3, y3);
          ctx.lineTo(x, y3);
          ctx.closePath();
          ctx.moveTo(x, y2);
          ctx.lineTo(x3, y2);
          ctx.stroke();
          return x2;
     },
     "c": function (ctx, size) {/// needs lots of work
          var s = size || 1,
               a1 = s * 0.2;
               x = s - a1;
               x2 = s * 0.2;
               x3 = s * 0;
               y = s * 0;
               y2 = s * 0.3;
               y3 = s - y2;
               y4 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x3, y2);
          ctx.lineTo(x3, y3);
          ctx.lineTo(x2, y4);
          ctx.lineTo(x, y4);
          ctx.stroke();
          return x;
     },
     "d": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               x = s * 0,
               x2 = s * 0.5,
               x3 = s - a1,
               y = s * 0,
               y2 = s * 0.2,
               y3 = s - y2,
               y4 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x3, y2);
          ctx.lineTo(x3, y3);
          ctx.lineTo(x2, y4);
          ctx.lineTo(x, y4);
          ctx.closePath();
          ctx.stroke();
          return x3;
     },
     "e": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               a2 = s * 0.2,
               x = s - a1,
               x2 = s * 0,
               x3 = s - a1 - a2,
               y = s * 0,
               y2 = s * 1,
               y3 = s * 0.45;
               ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x, y2);
          ctx.moveTo(x2, y3);
          ctx.lineTo(x3, y3);
          ctx.stroke();
          return x;
     },
     "f": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.3,
               x = s - a1,
               x2 = s * 0,
               x3 = s * 0.5,
               y = s * 0,
               y2 = s * 1,
               y3 = s * 0.5;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.moveTo(x2, y3);
          ctx.lineTo(x3, y3);
          ctx.stroke();
          return x;
     },
     "g": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               x = s - a1,
               x2 = s * 0,
               x3 = x - s * 0.35,
               y = s * 0.1,
               y2 = s * 0,
               y3 = s * 1,
               y4 = s * 0.4;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x2, y3);
          ctx.lineTo(x, y3);
          ctx.lineTo(x, y4);
          ctx.lineTo(x3, y4);
          ctx.stroke();
          return x;
     },
     "h": function (ctx, size) {
          var s = size || 1,
          a1 = s * 0.2,
          x = s * 0,
          x2 = s - a1,
          y = 0,
          y2 = s * 1;
          y3 = s * 0.45;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.moveTo(x, y3);
          ctx.lineTo(x2, y3);
          ctx.moveTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          return x2;
     },
     "i": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               x = 0,
               x2 = s - a1,
               x3 = x2 * 0.5,
               y = s * 0,
               y2 = s * 1;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.moveTo(x, y2);
          ctx.lineTo(x2, y2);
          ctx.moveTo(x3, y2);
          ctx.lineTo(x3, y);
          ctx.stroke();
          return x2;
     },
     "j": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.3,
               a2 = s * 0.2,
               x = s - a1,
               x2 = x - a2 * 2,
               x3 = x - a2,
               x4 = 0,
               y = s * 0;
               y2 = s * 1,
               y3 = s * 0.6;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.moveTo(x3, y);
          ctx.lineTo(x3, y2);
          ctx.lineTo(x4, y2);
          ctx.lineTo(x4, y3);
          ctx.stroke();
          return x;
     },
     "k": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.4,
               a2 = 0.5,
               x = 0,
               x2 = s - a1,
               y = 0;
               y2 = s * a2,
               y3 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y3);
          ctx.moveTo(x, y2);
          ctx.lineTo(x2, y);
          ctx.moveTo(x, y2);
          ctx.lineTo(x2, y3);
          ctx.stroke();
          return x2;
     },
     "l": function (ctx, size) {
          var s = size || 1,
          a1 = s * 0.3,
          x = 0,
          x2 = s - a1,
          y = 0,
          y2 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          return x2;
     },
     "m": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               x = 0,
               x2 = s * 0.5 - a1 / 2,
               x3 = s - a1,
               y = s,
               y2 = 0,
               y3 = s * 0.4;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.lineTo(x2, y3);
          ctx.lineTo(x3, y2);
          ctx.lineTo(x3, y);
          ctx.stroke();
          return x3;
     },
     "n": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.4,
               a2 = s * 0,
               x = 0,
               x2 = s - a1,
               y = 0,
               y2 = a2,
               y3 = s - a2,
               y4 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y4);
          ctx.moveTo(x, y2);
          ctx.lineTo(x2, y4);
          ctx.moveTo(x2, y);
          ctx.lineTo(x2, y4);
          ctx.stroke();
          return x2;
     },
     "o": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               a2 = s * 0.1,
               x = 0,
               x2 = a1,
               x3 = s - a1 - a2,
               x4 = s - a2,
               y = a1,
               y2 = 0,
               y3 = s - y,
               y4 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y2);
          ctx.lineTo(x4, y);
          ctx.lineTo(x4, y3);
          ctx.lineTo(x3, y4);
          ctx.lineTo(x2, y4);
          ctx.lineTo(x, y3);
          ctx.closePath();
          ctx.stroke();
          return x4;
     },
     "p": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.4,
               x = s * 0,
               x2 = s - a1,
               x3 = s * 0.25,
               y = s * 1,
               y2 = s * 0,
               y3 = s * 0.4;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x2, y3);
          ctx.lineTo(x, y3);
          ctx.stroke();
          return x2;
     },
     "q": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               a2 = s * 0.1,
               a3 = s * 0.3,
               x = 0,
               x2 = a1,
               x3 = s - a1 - a2,
               x4 = s - a2,
               x5 = s - a3 - a2,
               x6 = s * 0.55,
               y = a1,
               y2 = 0,
               y3 = s - y,
               y4 = s,
               y5 = s - a3,
               y6 = s * 0.6;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y2);
          ctx.lineTo(x4, y);
          ctx.lineTo(x4, y5);
          ctx.lineTo(x5, y4);
          ctx.lineTo(x2, y4);
          ctx.lineTo(x, y3);
          ctx.closePath();
          ctx.moveTo(x6, y6);
          ctx.lineTo(x4, y4);
          ctx.stroke();
          return x4;
     },
     "r": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.4;
               x = s * 0;
               x2 = s - a1;
               x3 = s * 0.25;
               x4 = x2 + s * 0.05;
               y = s * 1;
               y2 = s * 0;
               y3 = s * 0.4;
               y4 = y - s * 0.025;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x2, y3);
          ctx.lineTo(x, y3);
          ctx.moveTo(x3, y3);
          ctx.lineTo(x4, y4);
          ctx.stroke();
          return x2;
     },
     "s": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.4;
               x = s - a1;
               x2 = s * 0;
               y = s * 0;
               y2 = s * 0.45;
               y3 = s * 1;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x, y2);
          ctx.lineTo(x, y3);
          ctx.lineTo(x2, y3);
          ctx.stroke();
          return x;
     },
     "t": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.3,
               x = 0,
               x2 = s - a1,
               x3 = x2 / 2,
               y = 0,
               y2 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.moveTo(x3, y);
          ctx.lineTo(x3, y2);
          ctx.stroke();
          return x2;
     },
     "u": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.15,
               a2 = s * 0.25,
               a3 = a1,
               x = 0,
               x2 = a1,
               x3 = s - a1 - a2,
               x4 = s - a2,
               y = 0;
               y2 = s - a3,
               y3 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.lineTo(x2, y3);
          ctx.lineTo(x3, y3);
          ctx.lineTo(x4, y2);
          ctx.lineTo(x4, y);
          ctx.stroke();
          return x4;
     },
     "v": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.4,
               x = 0,
               x3 = s - a1,
               x2 = x3 / 2,
               y = 0,
               y2 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.moveTo(x2, y2);
          ctx.lineTo(x3, y);
          ctx.stroke();
          return x3;
     },
     "w": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               a2 = s * 0.2,
               x = 0,
               x2 = a2,
               x3 = a2 * 2,
               x4 = a2 * 3,
               x5 = a2 * 4,
               y = 0,
               y2 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.moveTo(x2, y2);
          ctx.lineTo(x3, y);
          ctx.moveTo(x3, y);
          ctx.lineTo(x4, y2);
          ctx.moveTo(x4, y2);
          ctx.lineTo(x5, y);
          ctx.stroke();
          return x5;
     },
     "x": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               x = 0,
               x2 = s - a1,
               y = 0,
               y2 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.moveTo(x, y2);
          ctx.lineTo(x2, y);
          ctx.closePath();
          ctx.stroke();
          return x2;
     },
     "y": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               x = 0,
               x2 = s - a1,
               x3 = x2 / 2,
               y = 0,
               y2 = s * 0.6,
               y3 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x3, y2);
          ctx.lineTo(x2, y);
          ctx.moveTo(x3, y2);
          ctx.lineTo(x3, y3);
          ctx.stroke();
          return x2;
     },
     "z": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               x = 0,
               x2 = s - a1,
               y = 0,
               y2 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.moveTo(x2, y);
          ctx.lineTo(x, y2);
          ctx.moveTo(x, y2);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          return x2;
     },
     ".": function (ctx, size) {
          var s = size || 1,
               a1 = s / 10,
               x = a1,
               y = s - a1 / 2;
          ctx.arc(x, y, a1, 0, Math.PI * 2, false);
          ctx.fill();
          return a1 * 2;
     },
     ",": function (ctx, size) {
          var s = size || 1,
               a1 = s / 10,
               x = a1,
               y = s - a1 / 2;
          ctx.arc(x, y, a1, 0, Math.PI / 2, false);
          ctx.stroke();
          ctx.fill();
          return a1 * 2;
     },
     "'": function (ctx, size) {
          
     },
     ":": function (ctx, size) {
          var s = size || 1,
               a1 = s / 10,
               a2 = s * 0.05,
               x = a1,
               y = a1 + a2,
               y2 = s - a1 - a2;
          ctx.arc(x, y, a1, 0, Math.PI * 2, false);
          ctx.arc(x, y2, a1, 0, Math.PI * 2, false);
          ctx.fill(); 
          return a1 * 2;
     },
     "!": function (ctx, size) {
          var s = size || 1,
               a1 = s / 10,
               x = 0,
               y = 0,
               y2 = s * 0.7,
               y3 = s - a1 / 2;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.closePath();
          ctx.stroke();
          ctx.arc(x, y3, a1, 0, Math.PI * 2, false);
          ctx.fill();
          return a1 * 2;
     },
     "+": function (ctx, size) {
          var s = size || 1,
               a1 = s * 0.2,
               x = 0,
               x2 = s - a1 * 2,
               x3 = x2 / 2,
               y = a1,
               y2 = s - a1;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.moveTo(x3, y2);
          ctx.lineTo(x3, y3);
          ctx.stroke();
          return x2;
     },
     "-": function (ctx, size) {
          var s = size || 1,
          a1 = s * 0.1,
          x = 0,
          x2 = s - a1,
          y = s / 2;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.closePath();
          ctx.stroke();
          return x2;
     },
     "<": function (ctx, size) {
          var s = size || 1,
          x = s * 0.8,
          x2 = 0,
          y = 0,
          y2 = s * 0.5,
          y3 = s * 0.8;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x, y3);
          ctx.stroke();
          return x;
     },
     "1": function (ctx, size) {
          var s = size || 1,
          a1 = s * 0.25,
          a2 = s * 0.2,
          x = 0,
          x2 = s - a1,
          x3 = x2 / 2 | 0,
          x4 = x,
          y = s * 1,
          y2 = s * 0,
          y3 = s * 0;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.moveTo(x3, y);
          ctx.lineTo(x3, y2);
          ctx.lineTo(x4, y3);
          ctx.stroke();
          return x2;
     },
     "2": function (ctx, size) {
          var s = size || 1,
          x = s * 0.2,
          x2 = s - x,
          y = s * 0,
          y2 = s * 0.55,
          y3 = s * 1;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x, y2);
          ctx.lineTo(x, y3);
          ctx.lineTo(x2, y3);
          ctx.stroke();
          return x2;
     },
     "3": function (ctx, size) {
          var s = size || 1,
          a1 = s * 0.4;
          x = 0,
          x2 = s - a1,
          x3 = s * 0.3,
          y = s * 0,
          y2 = s * 1,
          y3 = s * 0.54;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x, y2);
          ctx.moveTo(x2, y3);
          ctx.lineTo(x3, y3);
          ctx.stroke();
          return x2;
     },
     "4": function (ctx, size) {
          var s = size || 1,
          a1 = s * 0.2,
          x2 = 0,
          x = (s - a1) * 0.5,
          y = s * 0,
          y2 = s * 1,
          y3 = s * 0.5;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.moveTo(x2, y);
          ctx.lineTo(x2, y3);
          ctx.lineTo(x, y3);
          ctx.stroke();
          return x2;
     },
     "5": function (ctx, size) {
          var s = size || 1,
          x = s * 0.8,
          x2 = s - x,
          y = s * 0,
          y2 = s * 0.55,
          y3 = s * 1;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x, y2);
          ctx.lineTo(x, y3);
          ctx.lineTo(x2, y3);
          ctx.stroke();
          return x;
     },
     "6": function (ctx, size) {
          var s = size || 1,
          x = s * 0.8,
          x2 = s - x,
          y = s * 0,
          y2 = s * 0.55,
          y3 = s * 1;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y3);
          ctx.lineTo(x, y3);
          ctx.lineTo(x, y2);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          return x;
     },
     "7": function (ctx, size) {
          var s = size || 1,
          x = s * 0.2,
          x2 = s - x,
          y = s * 0,
          y2 = s * 1;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          return x2;
     },
     "8": function (ctx, size) {
          var s = size || 1,
          x = s * 0.2,
          x2 = s - x,
          y = s * 0,
          y2 = s * 1,
          y3 = s * 0.54;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x, y2);
          ctx.closePath();
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x2, y3);
          ctx.lineTo(x, y3);
          ctx.stroke();
          return x2;
     },
     "9": function (ctx, size) {
          var s = size || 1,
          x = s * 1,
          x2 = x - s * 0.6,
          y = s * 1,
          y2 = s * 0,
          y3 = s * 0.5;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x2, y3);
          ctx.lineTo(x, y3);
          ctx.stroke();
          return x;
     },
     "0": function (ctx, size) {
          var s = size || 1,
          x = s * 0.2,
          x2 = s * 0.8,
          y = s * 0,
          y2 = s * 1;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x, y2);
          ctx.closePath();
          ctx.stroke();
          return x2;
     },
     " ": function (ctx, size) {
          var s = size || 1;
          return s;
     },
     "error": function (ctx, size) {
               var s = size || 1;
               ctx.fillRect(0, 0, s, s);
               return s;
          }
     },
}