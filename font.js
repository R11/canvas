// I need to fix:
//   the spacing for numbers
//   the half pixel differences on the bottom of words
//   refocus words so they are sitting on y = s and not coming down from y = 0
//   add more / functions, such as:
//             /c = center line (checks for next "/n", subtracts difference in text[i] values.....guesstimates a center based on s * dif, or maybe it gathers values before writing ctx)
//             // = write out "/" and other such functions to allow special characters like "


AR.R11.Text = function (obj) {
     this.def = {
          ctx: obj.ctx,
          text: obj.text || "error",
          x: obj.x || 0,
          y: obj.y || 0,
          w: obj.w || 0,
          h: obj.h || 0,
          size: obj.size || 20,
          spacing: obj.spacing || 5,
          leading: obj.leading || 5,
          angle: obj.angle || 0,
          fillStyle: obj.color || obj.fillStyle || "black",
          strokeStyle: obj.color || obj.strokeStyle || "black",
          lineWidth: obj.lineWidth || 5,
          align: obj.align || "left",
     }
     this.button = obj.button || null;
     if (this.button) {
          this.buttoninit = true;
     }
     this.bufferCanvas = obj.bufferCanvas || document.getElementById("buffer") || AR.R11.canvas("buffer", 0, false);
     this.buffer = this.bufferCanvas.getContext("2d");
     this.update();
}

AR.R11.Text.prototype.update = function (obj) {
     var d = this.def, idx;
     obj = obj || {};
     AR.R11.updateSettings(this, this.def, obj);
  /*   if (this.button) {
          if (this.buttoninit) {
               this.buttoninit = null;
               this.button.ctx = this.ctx;
               this.button = new AR.R11.Button(this.button);
          } else if (this.button.update) {
               this.button.update();
          }
     }  */
     this.rows = this.text.split("/n").length;
//     console.log(this.rows);
     this.draw();
}

AR.R11.Text.prototype.getPart = function (start, end) {
     var string = this.text[start],
          i = 1,
          e, l, next,
          go = true;
     end = end || "/";
     l = end.length;

     for (e = 0; e <= end.length; e += 1) {
          
     }
     while (go) {
          next = this.text[start + i];
          if (next === end) {
               go = false;
          } else {
               string += next;
               i += 1;
          }
     }
     return string;
}

AR.R11.Text.prototype.loopChar = function (i) {
     var  t = this.text[i],
          t2 = this.text[i + 1],
          f, g, p, l;
          if (t === "/"){
               switch (t2) {
                    case "n":
                         this.newLine = true;
                         this.rows += 1;
                         break;
                    case "t":
                         this.newx += this.tempsize * 6;
                         break;
                    case "f":
                         f = this.getPart(i + 2);
                         this.tempsize *= parseFloat(f);
                         l = f.length;
                         i += l + 3;
                         g = this.getPart(i)
                         for (p = 0; p !== g.length; p += 1) {
                              this.loopChar(this.text[i]);
                              i += 1;
                         }
                         this.tempsize = this.size;
                         break;
                    case "b":
                         i += 2;
                         this.ctx.lineWidth = this.lineWidth * 2;
                         g = this.getPart(i)
                         for (p = 0; p !== g.length; p += 1) {
                              this.loopChar(this.text[i]);
                              i += 1;
                         }
                         this.ctx.lineWidth = this.lineWidth;
                         break;
                    case "s":
                         this.newx += this.tempsize;
                         break;
                    default:
                         this.drawChar(t2);
                }
                i += 1;
          } else {
                this.drawChar(t);
                if (t2 === " ") {
                    this.gap = 1;
                }
          }
          if (this.newx + this.tempsize > window.innerWidth) {
                this.rows += 1;
                this.newLine = true;
                if (t2 === " ") {
                     i += 1;
                }
          }
          if (this.newLine) {
                this.newy += this.tempsize + this.leading;
                this.newx = this.def.x;
                this.newLine = false;
           }
           return i;

}

AR.R11.Text.prototype.draw = function (s) {
     var i, t, t2, p, g, f, l;
     this.newx = this.x;
     this.newy = this.y;
     this.tempsize = s || this.size;
     this.ctx.fillStyle = this.fillStyle;
     this.ctx.strokeStyle = this.strokeStyle;
     this.ctx.lineWidth = this.lineWidth;
     this.rows = 1;
     this.gap = 0;
     
     for (i = 0; this.text[i]; i += 1) {
          t = this.text[i];
          t2 = this.text[i + 1];
          if (t === "/"){
               switch (t2) {
                    case "n":
                         this.newLine = true;
                         this.rows += 1;
                         break;
                    case "t":
                         this.newx += this.tempsize * 6;
                         break;
                    case "f":
                         f = this.getPart(i + 2);
                         this.tempsize *= parseFloat(f);
                         l = f.length;
                         i += l + 3;
                         g = this.getPart(i)
                         for (p = 0; p !== g.length; p += 1) {
                              this.drawChar(this.text[i]);
                              i += 1;
                         }
                         this.tempsize = s || this.size;
                         break;
                    case "b":
                         i += 2;
                         this.ctx.lineWidth = this.lineWidth * 2;
                         g = this.getPart(i)
                         for (p = 0; p !== g.length; p += 1) {
                              this.drawChar(this.text[i]);
                              i += 1;
                         }
                         this.ctx.lineWidth = this.lineWidth;
                         break;
                    case "s":
                         this.newx += this.tempsize;
                         break;
                    default:
                         this.drawChar(t2);
                }
                i += 1;
          } else {
                this.drawChar(t);
                if (t2 === " ") {
                    this.gap = 1;
                }
          }
          if (this.newx + this.tempsize > window.innerWidth) {
                this.rows += 1;
                this.newLine = true;
                if (t2 === " ") {
                     i += 1;
                }
          }
          if (this.newLine) {
                this.newy += this.tempsize + this.leading;
                this.newx = this.def.x;
                this.newLine = false;
           }
     }
}

AR.R11.Text.prototype.drawChar = function (c) {
     var ctx = this.ctx;
     if (AR.R11.font[""+ c +""]) {
          ctx.save();
          ctx.translate(this.newx + 0.5, this.newy + 0.5);
          ctx.rotate(this.angle);
          ctx.beginPath();
          this.newx += AR.R11.font["" + c + ""](ctx, this.tempsize) + this.spacing | 0;
          this.w = (this.w < this.newx - this.x) ? this.newx - this.x: this.w;
          this.h = (this.h < this.newy - this.y) ? this.newy - this.y: this.h;
          ctx.restore();

     }
}

AR.R11.font = {
     "a": function (ctx, size) {
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.25,
               a2 = s * 0.15,
               a3 = s * 0.15,
               x = 0,
               x2 = a1,
               x3 = s - a1 - a3,
               x4 = s - a3,
               y = s + lw,
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
          var  s = size || 20,
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
          var  s = size || 20,
               a1 = s * 0.2,
               x = s - a1,
               x2 = s * 0.2,
               x3 = s * 0,
               y = s * 0,
               y2 = s * 0.3,
               y3 = s - y2,
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
          var  s = size || 20,
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
          var  s = size || 20,
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.3,
               x = s - a1,
               x2 = s * 0,
               x3 = s * 0.5,
               y = s * 0,
               y2 = s * 1 + lw,
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
          var  s = size || 20,
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.2,
               x = s * 0,
               x2 = s - a1,
               y = -lw,
               y2 = s + lw;
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
          var  s = size || 20,
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
          var  s = size || 20,
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.4,
               a2 = 0.5,
               x = 0,
               x2 = s - a1,
               y = -lw;
               y2 = s * a2,
               y3 = s + lw;
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.3,
               x = 0,
               x2 = s - a1,
               y = -lw,
               y2 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          return x2;
     },
     "m": function (ctx, size) {
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.2,
               x = 0,
               x2 = s * 0.5 - a1 / 2,
               x3 = s - a1,
               y = s + lw,
               y2 = lw / 2,
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.4,
               a2 = s * 0,
               x = 0,
               x2 = s - a1,
               y = -lw,
               y2 = a2,
               y3 = s - a2,
               y4 = s + lw;
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
          var  s = size || 20,
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
          var  s = size || 20
               lw = ctx.lineWidth / 2,
               a1 = s * 0.4,
               x = s * 0,
               x2 = s - a1,
               x3 = s * 0.25,
               y = s + lw,
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
          var  s = size || 20,
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.4;
               x = s * 0;
               x2 = s - a1;
               x3 = s * 0.25;
               x4 = x2 + s * 0.05;
               y = s + lw;
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.4;
               x = s - a1;
               x2 = 0;
               y = 0;
               y2 = s * 0.45;
               y3 = s;
          ctx.moveTo(x + lw, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x, y2);
          ctx.lineTo(x, y3);
          ctx.lineTo(x2 - lw, y3);
          ctx.stroke();
          return x;
     },
     "t": function (ctx, size) {
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.3 - lw,
               x = 0,
               x2 = s - a1,
               x3 = x2 / 2,
               y = 0,
               y2 = s + lw;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.moveTo(x3, y);
          ctx.lineTo(x3, y2);
          ctx.stroke();
          return x2;
     },
     "u": function (ctx, size) {
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.15,
               a2 = s * 0.25,
               a3 = a1,
               x = 0,
               x2 = a1,
               x3 = s - a1 - a2,
               x4 = s - a2,
               y = -lw;
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.4,
               x = 0,
               x3 = s - a1,
               x2 = x3 / 2,
               y = -lw,
               y2 = s + lw;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.moveTo(x2, y2);
          ctx.lineTo(x3, y);
          ctx.stroke();
          return x3;
     },
     "w": function (ctx, size) {
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.2,
               a2 = s * 0.2,
               x = 0,
               x2 = a2,
               x3 = a2 * 2,
               x4 = a2 * 3,
               x5 = a2 * 4,
               y = -lw,
               y2 = s + lw;
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.2,
               x = 0,
               x2 = s - a1,
               y = -lw,
               y2 = s + lw;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.moveTo(x, y2);
          ctx.lineTo(x2, y);
          ctx.closePath();
          ctx.stroke();
          return x2;
     },
     "y": function (ctx, size) {
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.2,
               x = 0,
               x2 = s - a1,
               x3 = x2 / 2,
               y = -lw,
               y2 = s * 0.6,
               y3 = s + lw;
          ctx.moveTo(x, y);
          ctx.lineTo(x3, y2);
          ctx.lineTo(x2, y);
          ctx.moveTo(x3, y2);
          ctx.lineTo(x3, y3);
          ctx.stroke();
          return x2;
     },
     "z": function (ctx, size) {
          var  s = size || 20,
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
          var  s = size || 20,
               a1 = s / 10,
               x = a1,
               y = s - a1 / 2;
          ctx.arc(x, y, a1, 0, Math.PI * 2, false);
          ctx.fill();
          return a1 * 2;
     },
     ",": function (ctx, size) {
          var  s = size || 20,
               a1 = s / 10,
               x = a1,
               y = s - a1 / 2;
          ctx.arc(x, y, a1, Math.PI * 1.75 , Math.PI / 2, false);
          ctx.stroke();
          return a1 * 2;
     },
     "'": function (ctx, size) {
          var s = size || 20,
               a1 = s / 10,
               x = a1,
               y = a1 / 2;
          ctx.arc(x, y, a1, Math.PI * 1.5, Math.PI / 2.6, false);
          ctx.stroke();
          return a1 * 2;
     },
     ":": function (ctx, size) {
          var  s = size || 20,
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s / 10,
               x = 0,
               y = -lw,
               y2 = s * 0.7,
               y3 = s - a1 / 4;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.closePath();
          ctx.stroke();
          ctx.arc(x, y3, a1, 0, Math.PI * 2, false);
          ctx.fill();
          return a1 * 2;
     },
     "+": function (ctx, size) {
          var  s = size || 20,
               a1 = s * 0.2,
               x = 0,
               x2 = s - a1 * 2,
               x3 = x2 / 2,
               y = s / 2,
               y2 = a1,
               y3 = s - a1;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.moveTo(x3, y2);
          ctx.lineTo(x3, y3);
          ctx.stroke();
          return x2;
     },
     "-": function (ctx, size) {
          var  s = size || 20,
          a1 = s * 0.2,
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
          var  s = size || 20,
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
          var  s = size || 20,
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
          var  s = size || 20,
          a1 = s * 0.4,
          x = 0,
          x2 = s - a1,
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
          var  s = size || 20,
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.4,
               x = s - a1,
               x2 = 0,
               y = -lw,
               y2 = s + lw,
               y3 = s * 0.5;
          ctx.moveTo(x, y);
          ctx.lineTo(x, y2);
          ctx.moveTo(x2, y);
          ctx.lineTo(x2, y3);
          ctx.lineTo(x, y3);
          ctx.stroke();
          return x;
     },
     "5": function (ctx, size) {
          var  s = size || 20,
               a1 = s * 0.4,
               x = s - a1,
               x2 = 0,
               y = 0,
               y2 = s * 0.55,
               y3 = s;
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
          var  s = size || 20,
               a1 = s * 0.4,
               x = s - a1,
               x2 = 0,
               y = 0,
               y2 = s * 0.55,
               y3 = s;
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.4,
               x = 0,
               x2 = s - a1,
               y = 0,
               y2 = s + lw;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          return x2;
     },
     "8": function (ctx, size) {
          var  s = size || 20,
               a1 = s * 0.4,
               x = 0,
               x2 = s - a1,
               y = 0,
               y2 = s,
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
          var  s = size || 20,
               lw = ctx.lineWidth / 2,
               a1 = s * 0.4,
               x = s - a1,
               x2 = 0,
               y = s + lw,
               y2 = 0,
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
          var  s = size || 20,
               a1 = s * 0.4,
               x = 0,
               x2 = s - a1,
               y = 0,
               y2 = s;
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x, y2);
          ctx.closePath();
          ctx.stroke();
          return x2;
     },
     " ": function (ctx, size) {
          var  s = size || 20;
          return s * 0.5;
     },
     "error": function (ctx, size) {
               var  s = size || 20;
               ctx.fillRect(0, 0, s, s);
               return s;
          }
}

