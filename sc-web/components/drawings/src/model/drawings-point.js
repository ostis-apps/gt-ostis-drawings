/**
 * Point model.
 */

Drawings.Vertex = function Vertex(x, y) {
    this.id = Drawings.Utils.randomUUID();
    this.x = x;
    this.y = y;
    this.name = '';
    this.className = this.constructor.name;
    this.scAddr = null;
};

Drawings.Vertex.prototype.getId = function () {
    return this.id;
};

Drawings.Vertex.prototype.setId = function (id) {
    this.id = id;
};

Drawings.Vertex.prototype.getX = function () {
    return this.x;
};

Drawings.Vertex.prototype.setX = function (x) {
    this.x = x;
};

Drawings.Vertex.prototype.getY = function () {
    return this.y;
};

Drawings.Vertex.prototype.setY = function (y) {
    return this.y = y;
};

Drawings.Vertex.prototype.setXY = function (x, y) {
    this.x = x;
    this.y = y;
};

Drawings.Vertex.prototype.getName = function () {
    return this.name;
};

Drawings.Vertex.prototype.setName = function (name) {
    this.name = name;
};

Drawings.Vertex.prototype.getScAddr = function () {
    return this.scAddr;
};

Drawings.Vertex.prototype.setScAddr = function (scAddr) {
    this.scAddr = scAddr;
};
