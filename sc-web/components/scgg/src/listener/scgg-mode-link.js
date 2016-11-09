SCggLinkListener = function(scene) {
    this.scene = scene;
};

SCggLinkListener.prototype = {

    constructor: SCggLinkListener,

    onMouseMove: function(x, y) {
        return false;
    },

    onMouseDown: function(x, y) {
        return false;
    },

    onMouseDoubleClick: function (x, y) {
        if (this.scene.pointed_object && !(this.scene.pointed_object instanceof SCgg.ModelContour)) {
            return false;
        }
        this.scene.commandManager.execute(new SCggCommandCreateLink(x, y, this.scene));
        return true;
    },

    onMouseDownObject: function(obj) {
        return false;
    },

    onMouseUpObject: function(obj) {
        return true;
    },

    onKeyDown: function(event) {
        return false;
    },

    onKeyUp: function(event) {
        return false;
    }

};