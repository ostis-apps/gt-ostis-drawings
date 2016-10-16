/**
 * Shape model.
 */

Drawings.Shape = function Shape(points) {
    this.id = Drawings.Utils.randomUUID();
    this.name = '';
    this.points = points;
    this.className = this.constructor.name;
    this.scAddr = null;
};

Drawings.Shape.prototype.getId = function () {
    return this.id;
};

Drawings.Shape.prototype.setId = function (id) {
    this.id = id;
};

Drawings.Shape.prototype.getName = function () {
    return this.name;
};

Drawings.Shape.prototype.setName = function (name) {
    return this.name = name;
};

Drawings.Shape.prototype.getPoints = function () {
    return this.points;
};

Drawings.Shape.prototype.getPoint = function (pointId) {
    return Drawings.Utils.getObjectById(this.points, pointId);
};

Drawings.Shape.prototype.getScAddr = function () {
    return this.scAddr;
};

Drawings.Shape.prototype.setScAddr = function (scAddr) {
    this.scAddr = scAddr;
};