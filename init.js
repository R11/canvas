var window,document, AR = {};
AR.R11 = {};

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
    cv.id = id;
    document.body.appendChild(cv);
    return cv;
}