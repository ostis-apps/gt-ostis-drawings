var GwfgObjectController = {
    x_offset: 0,
    y_offset: 0,

    fixOffsetOfPoints: function (args) {
        var x = parseFloat(args.x);
        var y = parseFloat(args.y);

        if (x < this.x_offset)
            this.x_offset = x;

        if (y < this.y_offset)
            this.y_offset = y;
    },

    getXOffset: function () {
        return Math.abs(this.x_offset) + 60;
    },

    getYOffset: function () {
        return Math.abs(this.y_offset) + 30;
    }
};

var GwfgObject = function (args) {
    this.id = -1;
    this.attributes = {};
    this.required_attrs = [];
};

GwfgObject.prototype = {
    constructor: GwfgObject
};

GwfgObject.prototype.parseObject = function (args) {

};

GwfgObject.prototype.buildObject = function (args) {

};

GwfgObject.prototype.parsePoints = function (args) {

    var gwfg_object = args.gwfg_object;
    var reader = args.reader;

    var points = gwfg_object.getElementsByTagName("points")[0].getElementsByTagName("point");
    this.attributes.points = [];
    for (var i = 0; i < points.length; i++) {
        var point = reader.fetchAttributes(points[i], ["x", "y"]);
        this.attributes.points.push(point);
        GwfgObjectController.fixOffsetOfPoints({x: point["x"], y: point["y"]});
    }
};

GwfgObject.prototype.fixParent = function (args) {
    var parent = this.attributes["parent"];

    if (parent != "0") {
        var parent_object = args.builder.getOrCreate(parent);
        parent_object.addChild(args.scgg_object);
        args.scgg_object.update();
        parent_object.update();
    }
};

var GwfgObjectNode = function (args) {
    GwfgObject.call(this, args);
    this.required_attrs = ["id", "type", "x", "y", "parent", "idtf"];
};

GwfgObjectNode.prototype = Object.create(GwfgObject.prototype);

// have to specify node and reader
GwfgObjectNode.prototype.parseObject = function (args) {
    var node = args.gwfg_object;
    var reader = args.reader;

    this.attributes = reader.fetchAttributes(node, this.required_attrs);

    if (this.attributes == false) {
        return false;
    }

    //fix some attrs
    this.attributes["type"] = reader.getTypeCode(this.attributes.type);
    this.attributes["x"] = parseFloat(this.attributes["x"]);
    this.attributes["y"] = parseFloat(this.attributes["y"]);

    //fixing points
    GwfgObjectController.fixOffsetOfPoints({x: this.attributes["x"], y: this.attributes["y"]});

    this.id = this.attributes["id"];

    return this;
};

// have to specify scene,builder
GwfgObjectNode.prototype.buildObject = function (args) {
    var scene = args.scene;
    var node = SCgg.Creator.createNode(this.attributes["type"], new SCgg.Vector3(this.attributes["x"] + GwfgObjectController.getXOffset(), this.attributes["y"] + +GwfgObjectController.getYOffset(), 0), this.attributes["idtf"]);

    scene.appendNode(node);
    scene.appendSelection(node);
    args.scgg_object = node;
    this.fixParent(args);
    node.update();

    return node;
};

///// pairs

var GwfgObjectPair = function (args) {
    GwfgObject.call(this, args);
    this.required_attrs = ["id", "type", "id_b", "id_e", "dotBBalance", "dotEBalance", "idtf"];
};

GwfgObjectPair.prototype = Object.create(GwfgObject.prototype);

// have to specify pair and reader
GwfgObjectPair.prototype.parseObject = function (args) {
    var pair = args.gwfg_object;
    var reader = args.reader;

    this.attributes = reader.fetchAttributes(pair, this.required_attrs);

    if (this.attributes == false)
        return false;

    //fix some attrs

    this.attributes["type"] = reader.getTypeCode(this.attributes.type);
    this.attributes["dotBBalance"] = parseFloat(this.attributes["dotBBalance"]);
    this.attributes["dotEBalance"] = parseFloat(this.attributes["dotEBalance"]);

    this.id = this.attributes["id"];

    // line points

    this.parsePoints(args);

    return this;
};

GwfgObjectPair.prototype.buildObject = function (args) {
    var scene = args.scene;
    var builder = args.builder;
    var source = builder.getOrCreate(this.attributes["id_b"]);
    var target = builder.getOrCreate(this.attributes["id_e"]);
    var edge = SCgg.Creator.createEdge(source, target, this.attributes["type"]);

    scene.appendEdge(edge);
    scene.appendSelection(edge);
    edge.source_dot = parseFloat(this.attributes["dotBBalance"]);
    edge.target_dot = parseFloat(this.attributes["dotEBalance"]);

    var edge_points = this.attributes["points"];
    var points = [];

    for (var i = 0; i < edge_points.length; i++) {
        var edge_point = edge_points[i];
        var point = new SCgg.Vector2(parseFloat(edge_point.x) + GwfgObjectController.getXOffset(), parseFloat(edge_point.y) + GwfgObjectController.getYOffset());

        points.push(point);
    }

    edge.setPoints(points);
    source.update();
    target.update();
    edge.update();

    return edge;
};

//contour

var GwfgObjectContour = function (args) {
    GwfgObject.call(this, args);
    this.required_attrs = ["id", "parent"];
};

GwfgObjectContour.prototype = Object.create(GwfgObject.prototype);

GwfgObjectContour.prototype.parseObject = function (args) {
    var contour = args.gwfg_object;
    var reader = args.reader;

    this.attributes = reader.fetchAttributes(contour, this.required_attrs);

    if (this.attributes == false)
        return false;

    this.id = this.attributes['id'];

    //contour points
    this.parsePoints(args);

    return this;
};

GwfgObjectContour.prototype.buildObject = function (args) {
    var scene = args.scene;
    var contour_points = this.attributes["points"];
    var verticies = [];

    for (var i = 0; i < contour_points.length; i++) {
        var contour_point = contour_points[i];
        var vertex_x = parseFloat(contour_point.x);
        var vertex_y = parseFloat(contour_point.y);
        var vertex = new SCgg.Vector3(vertex_x + GwfgObjectController.getXOffset(), vertex_y + GwfgObjectController.getYOffset(), 0);

        verticies.push(vertex);
    }

    var contour = SCgg.Creator.createCounter(verticies);

    args.scgg_object = contour;
    this.fixParent(args);

    scene.appendContour(contour);
    scene.appendSelection(contour);
    contour.update();

    return contour;
};

var GwfgObjectBus = function (args) {
    GwfgObject.call(this, args);
    this.required_attrs = ["id", "parent", "b_x", "b_y", "e_x", "e_y", "owner", "idtf"];
};

GwfgObjectBus.prototype = Object.create(GwfgObject.prototype);

GwfgObjectBus.prototype.parseObject = function (args) {
    var bus = args.gwfg_object;
    var reader = args.reader;

    this.attributes = reader.fetchAttributes(bus, this.required_attrs);

    if (this.attributes == false)
        return false;

    //fix attrs

    this.attributes["e_x"] = parseFloat(this.attributes["e_x"]);
    this.attributes["e_y"] = parseFloat(this.attributes["e_y"]);

    GwfgObjectController.fixOffsetOfPoints({x: this.attributes["e_x"], y: this.attributes["e_y"]});

    this.id = this.attributes['id'];

    //bus points
    this.parsePoints(args);

    return this;
};

GwfgObjectBus.prototype.buildObject = function (args) {
    var scene = args.scene;
    var builder = args.builder;
    var bus = SCgg.Creator.createBus(builder.getOrCreate(this.attributes["owner"]));

    bus.setTargetDot(0);

    var bus_points = this.attributes["points"];
    var points = [];

    for (var i = 0; i < bus_points.length; i++) {
        var bus_point = bus_points[i];
        var point = new SCgg.Vector2(parseFloat(bus_point.x) + GwfgObjectController.getXOffset(), parseFloat(bus_point.y) + GwfgObjectController.getYOffset());
        points.push(point);
    }

    points.push(new SCgg.Vector2(this.attributes["e_x"] + GwfgObjectController.getXOffset(), this.attributes["e_y"] + GwfgObjectController.getYOffset()));

    bus.setPoints(points);
    args.scgg_object = bus;

    this.fixParent(args);

    scene.appendBus(bus);
    scene.appendSelection(bus);
    bus.update();

    return bus;
};

var GwfgObjectLink = function (args) {
    GwfgObject.call(this, args);
    this.content = null;
    this.type = -1;
    this.requiredAttrs = ["id", "x", "y", "parent"];
};

GwfgObjectLink.prototype = Object.create(GwfgObject.prototype);

GwfgObjectLink.prototype.parseObject = function (args) {
    var link = args.gwfg_object;
    var reader = args.reader;

    this.attributes = reader.fetchAttributes(link, this.requiredAttrs);

    if (this.attributes == false) {
        return false;
    }

    this.attributes["x"] = parseFloat(this.attributes["x"]);
    this.attributes["y"] = parseFloat(this.attributes["y"]);
    GwfgObjectController.fixOffsetOfPoints({x: this.attributes["x"], y: this.attributes["y"]});
    this.id = this.attributes["id"];

    var content = link.getElementsByTagName("content")[0];

    this.type = reader.fetchAttributes(content, ["type"])["type"];
    this.content = content.textContent;

    return this;
};

GwfgObjectLink.prototype.buildObject = function (args) {
    var scene = args.scene;
    var vecX = this.attributes["x"] + GwfgObjectController.getXOffset();
    var vecY = this.attributes["y"] + +GwfgObjectController.getYOffset();
    var vecZ = 0;
    var scgVector = new SCgg.Vector3(vecX, vecY, vecZ);
    var link = SCgg.Creator.createLink(scgVector, '');

    link.setContent(this.content);
    scene.appendLink(link);
    scene.appendSelection(link);
    args.scgg_object = link;
    this.fixParent(args);
    link.update();

    return link;
};
