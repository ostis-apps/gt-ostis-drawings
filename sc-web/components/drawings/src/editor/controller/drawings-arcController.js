/**
 * Created by qosmio on 24.05.15.
 */
Drawings.ArcController = function(model) {
    this.model = model;
};

Drawings.ArcController.prototype = {

    handleContextMenuEvent: function (jxgSegment, event) {
        var segment = this.model.getShape(jxgSegment.id);

        var controller = this;

        var contextMenu = new Drawings.ContextMenu('#' + jxgSegment.rendNode.id, event);

        var setLengthMenuItem = {
            text: 'Задать вес дуги',
            action: function () {
                controller._setLengthAction(segment);
            }
        };

        contextMenu.show([setLengthMenuItem]);
    },

    _setLengthAction: function (segment) {
        var length = prompt('Введите длину дуги:');

        if (length != null) {
            segment.setLength(length);
            this.model.updated([segment]);
        }
    }
}

