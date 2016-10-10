/**
 * Segment controller.
 */

Drawings.EdgeController = function (model) {
    this.model = model;
};

Drawings.EdgeController.prototype = {

    handleContextMenuEvent: function (jxgSegment, event) {
        var segment = this.model.getShape(jxgSegment.id);

        var controller = this;

        var contextMenu = new Drawings.ContextMenu('#' + jxgSegment.rendNode.id, event);

        var setLengthMenuItem = {
            text: 'Задать вес ребра',
            action: function () {
                controller._setLengthAction(segment);
            }
        };

        contextMenu.show([setLengthMenuItem]);
    },

    _setLengthAction: function (segment) {
        var length = prompt('Введите вес ребра:');

        if (length != null) {
            segment.setLength(length);
            this.model.updated([segment]);
        }
    }
};