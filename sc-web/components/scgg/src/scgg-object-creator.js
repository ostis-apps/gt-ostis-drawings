SCgg.Creator = {};

/**
 * Create new node
 *
 * @param {number} sc_type Type of node
 * @param {SCgg.Vector3} pos Position of node
 * @param {String} text Text associated with node
 *
 * @return SCgg.ModelNode created node
 */
SCgg.Creator.createNode = function(sc_type, pos, text) {
    return new SCgg.ModelNode({
        position: pos.clone(),
        scale: new SCgg.Vector2(20, 20),
        sc_type: sc_type,
        text: text
    });
};

SCgg.Creator.createLink = function(pos, containerId) {
    var link = new SCgg.ModelLink({
        position: pos.clone(),
        scale: new SCgg.Vector2(50, 50),
        sc_type: sc_type_link,
        containerId: containerId
    });
    link.setContent("");
    return link;
};

/**
 * Create edge between two specified objects
 *
 * @param {SCgg.ModelObject} source Edge source object
 * @param {SCgg.ModelObject} target Edge target object
 * @param {number} sc_type SC-type of edge
 *
 * @return SCgg.ModelEdge created edge
 */
SCgg.Creator.createEdge = function(source, target, sc_type) {
    return new SCgg.ModelEdge({
        source: source,
        target: target,
        sc_type: sc_type ? sc_type : sc_type_edge_common
    });
};

SCgg.Creator.createBus = function(source) {
    return new SCgg.ModelBus({
        source: source
    });
};

SCgg.Creator.createCounter = function(polygon) {
    return new SCgg.ModelContour({
        verticies: polygon
    });
};
