
// ------------------------------

SCgg.Widget = function(postition, size) {
}

SCgg.Widget.prototype = {
    constructor: SCgg.Widget
};

/// ------------------------------
SCgg.Button = function(position, size) {
    SCgg.Widget.call(this, position, size);
};

SCgg.Button.prototype = Object.create( SCgg.Widget.prototype );


