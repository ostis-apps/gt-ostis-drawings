var Drawings = {};

function extend(child, parent) {
    var F = function () {
    };
    F.prototype = parent.prototype;
    child.prototype = new F();
    child.prototype.constructor = child;
    child.superclass = parent.prototype;
}

Drawings.DrawingMode = {
    VERTEX: 0,
    EDGE: 1,
    ARC: 2
};

Drawings.FILL_COLOR = "Black";
Drawings.STOKE_COLOR = "Black";
Drawings.TRANSLATED_FILL_COLOR = "Black";
Drawings.TRANSLATED_STROKE_COLOR = "Black";