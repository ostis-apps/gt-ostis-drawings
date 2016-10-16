/**
 * Segment model.
 */

Drawings.Edge = function Edge(point1, point2) {
    Drawings.Edge.superclass.constructor.apply(this, [[point1, point2]]);
    this.length = null;
    this.scType = sc_type_edge_common | sc_type_const;
};

extend(Drawings.Edge, Drawings.Shape);

Drawings.Edge.prototype.point1 = function () {
    return this.points[0];
};

Drawings.Edge.prototype.point2 = function () {
    return this.points[1];
};

Drawings.Edge.prototype.setLength = function (length) {
    this.length = length;
};

Drawings.Edge.prototype.getLength = function () {
    return this.length;
};
