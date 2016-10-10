/**
 * Point renderer.
 */

Drawings.ArcRenderer = function (board) {
    this.board = board;
};

Drawings.ArcRenderer.prototype = {

    render: function (line) {
        var jxgSegment = this._drawLine(line);

        if (line.length != null) {
            this._drawSegmentLength(jxgSegment, line);
        }
    },

    erase: function(line) {
        var jxgLine = Drawings.Utils.getJxgObjectById(this.board, line.getId());
        this._eraseSegmentLength(jxgLine);
        this._eraseLine(jxgLine);
    },

    _drawLine: function (line) {
        var jxgPoint1 = Drawings.Utils.getJxgObjectById(this.board, line.point1().getId());
        var jxgPoint2 = Drawings.Utils.getJxgObjectById(this.board, line.point2().getId());

        var strokeColor = Drawings.Utils.getStrokeColor(line);

        var properties = {
            id: line.getId(),
            name: line.getName(),
            strokeWidth: 5,
            strokeColor: strokeColor
        };

        return this.board.create('arrow', [jxgPoint1, jxgPoint2], properties);
    },

    _drawSegmentLength: function (jxgSegment, segment) {
        var point1 = segment.point1();
        var point2 = segment.point2();

        var labelX = function () {
            return (point1.getX() + point2.getX()) / 1.95 + 0.5;
        };

        var labelY = function () {
            return (point1.getY() + point2.getY()) / 1.95 + 0.6;
        };

        var properties = {
            fontSize: 16
        };

        jxgSegment.textLabel = this.board.create('text', [labelX, labelY, segment.getLength()], properties);
    },

    _eraseSegmentLength: function(jxgSegment) {
        if (jxgSegment.textLabel) {
            this.board.removeObject(jxgSegment.textLabel);
        }
    },



    _eraseLine: function(jxgLine) {
        this.board.removeObject(jxgLine);
    }
};