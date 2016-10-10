/**
 * Line model.
 */

Drawings.Arc = function Arc(point1, point2) {
    Drawings.Arc.superclass.constructor.apply(this, [[point1, point2]]);
};

extend(Drawings.Arc, Drawings.Shape);

Drawings.Arc.prototype.point1 = function () {
    return this.points[0];
};

Drawings.Arc.prototype.point2 = function () {
    return this.points[1];
};
Drawings.Arc.prototype.setLength = function (length) {
    this.length = length;
};

Drawings.Arc.prototype.getLength = function () {
    return this.length;
};