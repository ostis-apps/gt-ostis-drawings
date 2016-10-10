/**
 * Point renderer.
 */

Drawings.VertexRenderer = function (board) {
    this.board = board;
};

Drawings.VertexRenderer.prototype = {

    render: function (point) {
        this._drawPoint(point);
    },

    erase: function(point) {
        var jxgPoint = Drawings.Utils.getJxgObjectById(this.board, point.getId());

        this._erasePointName(jxgPoint);
        this._erasePoint(jxgPoint);
    },

    _drawPoint: function (point) {
        var strokeColor = Drawings.Utils.getStrokeColor(point);
        var fillColor = Drawings.Utils.getFillColor(point);

        var properties = {
            id: point.getId(),
            name: point.getName(),
            size: 5,
            showInfobox: false,
            strokeColor: strokeColor,
            fillColor: fillColor
        };

        var jxgPoint = this.board.create('point', [point.getX(), point.getY()], properties);

        jxgPoint.coords.on('update', function () {
            point.setXY(this.X(), this.Y());
        }, jxgPoint);
    },

    _erasePointName: function(jxgPoint) {
        if (jxgPoint.textLabel) {
            this.board.removeObject(jxgPoint.textLabel);
        }
    },

    _erasePoint: function(jxgPoint) {
        this.board.removeObject(jxgPoint);
    }
};