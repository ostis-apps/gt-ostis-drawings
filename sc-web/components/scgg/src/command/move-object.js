SCggCommandMoveObject = function (object, offset) {
    this.object = object;
    this.offset = offset;
};

SCggCommandMoveObject.prototype = {

    constructor: SCggCommandMoveObject,

    undo: function() {
        this.object.setPosition(this.object.position.clone().add(this.offset));
    },

    execute: function() {
        this.object.setPosition(this.object.position.clone().sub(this.offset));
    }

};
