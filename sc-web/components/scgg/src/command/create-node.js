SCggCommandCreateNode = function (x, y, scene) {
    this.x = x;
    this.y = y;
    this.scene = scene;
    this.node = null;
};

SCggCommandCreateNode.prototype = {

    constructor: SCggCommandCreateNode,

    undo: function() {
        if (this.node.is_selected) {
            var idx = this.scene.selected_objects.indexOf(this.node);
            this.scene.selected_objects.splice(idx, 1);
            this.node._setSelected(false);
            this.scene.edit.onSelectionChanged();
        }
        this.scene.removeObject(this.node);
    },

    execute: function() {
        if (this.node == null){
            this.node = SCgg.Creator.createNode(SCggTypeNodeNow, new SCgg.Vector3(this.x, this.y, 0), '');
            this.scene.appendNode(this.node);
            this.scene.updateRender();
            this.scene.clearSelection();
            this.scene.appendSelection(this.node);
        } else {
            this.scene.appendNode(this.node);
        }
    }

};
