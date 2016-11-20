var SCggObjectState = {
    Normal: 0,
    MergedWithMemory: 1,
    NewInMemory: 2,
    FromMemory: 3
};

var ObjectId = 1;

/**
     * Initialize sc.g-object with specified options.
     * 
     * @param {Object} options
     * Initial options of object. There are possible options:
     * - observer - object, that observe this
     * - position - object position. SCgg.Vector3 object
     * - scale - object size. SCgg.Vector2 object.
     * - sc_type - object type. See sc-types for more info.
     * - text - text identifier of object
     */
SCgg.ModelObject = function(options) {
    
    this.need_observer_sync = true;

    if (options.position) {
        this.position = options.position;
    }  else {
        this.position = new SCgg.Vector3(0.0, 0.0, 0.0);
    }

    if (options.scale) {
        this.scale = options.scale;
    } else {
        this.scale = new SCgg.Vector2(20.0, 20.0);
    }

    if (options.sc_type) {
        this.sc_type = options.sc_type;
    } else {
        this.sc_type = sc_type_node;
    }

    if (options.sc_addr) {
        this.sc_addr = options.sc_addr;
    } else {
        this.sc_addr = null;
    }
    
    if (options.text) {
        this.text = options.text;
    } else {
        this.text = null;
    }
    
    this.id = ObjectId++;
    this.edges = [];    // list of connected edges
    this.need_update = true;    // update flag
    this.state = SCggObjectState.Normal;
    this.is_selected = false;
    this.scene = null;
    this.bus = null;
    this.contour = null;
};

SCgg.ModelObject.prototype = {

    constructor: SCgg.ModelObject

};

/**
 * Destroy object
 */
SCgg.ModelObject.prototype.destroy = function() {
};

/**
 * Setup new position of object
 * @param {SCgg.Vector3} pos
 *      New position of object
 */
SCgg.ModelObject.prototype.setPosition = function(pos) {
    this.position = pos;
    this.need_observer_sync = true;

    this.requestUpdate();
    this.notifyEdgesUpdate();
    this.notifyBusUpdate();
};

/**
 * Setup new scale of object
 * @param {SCgg.Vector2} scale
 *      New scale of object
 */
SCgg.ModelObject.prototype.setScale = function(scale) {
    this.scale = scale;
    this.need_observer_sync = true;

    this.requestUpdate();
    this.update();
};

/**
 * Setup new text value
 * @param {String} text New text value
 */
SCgg.ModelObject.prototype.setText = function(text) {
    this.text = text;
    this.need_observer_sync = true;
};

/**
 * Setup new type of object
 * @param {Integer} type New type value
 */
SCgg.ModelObject.prototype.setScType = function(type) {
    this.sc_type = type;
    this.need_observer_sync = true;
};


/**
 * Notify all connected edges to sync
 */
SCgg.ModelObject.prototype.notifyEdgesUpdate = function() {

    for (var i = 0; i < this.edges.length; i++) {
       this.edges[i].need_update = true;
       this.edges[i].need_observer_sync = true;
    }

};

/**
 * Notify connected bus to sync
 */
SCgg.ModelObject.prototype.notifyBusUpdate = function() {

    if (this.bus != undefined) {
        this.bus.need_update = true;
        this.bus.need_observer_sync = true;
    }
};

/** Function iterate all objects, that need to be updated recursively, and 
 * mark them for update.
 */
SCgg.ModelObject.prototype.requestUpdate = function() {
    this.need_update = true;
    for (var i = 0; i < this.edges.length; ++i) {
        this.edges[i].requestUpdate();
    }
    
    if (this.bus != undefined) {
        this.bus.requestUpdate();
    }
};

/** Updates object state.
 */
SCgg.ModelObject.prototype.update = function() {

    this.need_update = false;
    this.need_observer_sync = true;

    for (var i = 0; i < this.edges.length; ++i) {
        var edge = this.edges[i];

        if (edge.need_update) {
            edge.update();
        }
    }
};

/*! Calculate connector position.
 * @param {SCgg.Vector3} Position of other end of connector
 * @param {Float} Dot position on this object.
 * @returns Returns position of connection point (new instance of SCgg.Vector3, that can be modified later)
 */
SCgg.ModelObject.prototype.getConnectionPos = function(from, dotPos) {
    return this.position.clone();
};

/*! Calculates dot position on object, for specified coordinates in scene
 * @param {SCgg.Vector2} pos Position in scene to calculate dot position
 */
SCgg.ModelObject.prototype.calculateDotPos = function(pos) {
    return 0;
};

/*! Setup new state of object
 * @param {SCggObjectState} state New object state
 */
SCgg.ModelObject.prototype.setObjectState = function(state) {
    this.state = state;
    this.need_observer_sync = true;
};

/*!
 * Change value of selection flag
 */
SCgg.ModelObject.prototype._setSelected = function(value) {
    this.is_selected = value;
    this.need_observer_sync = true;
};

/**
 * Remove edge from edges list
 */
SCgg.ModelObject.prototype.removeEdge = function(edge) {
    var idx = this.edges.indexOf(edge);
    
    if (idx < 0) {
        SCgg.error("Something wrong in edges deletion");
        return;
    }
    
    this.edges.splice(idx, 1);
};

/**
 * Remove edge from edges list
 */
SCgg.ModelObject.prototype.removeBus = function() {
    this.bus = null;
};

/**
 * Setup new sc-addr of object
 * @param merged Flag that need to be true, when object merged with element in memory.
 * Automaticaly sets state MergedWithMemory
 */
SCgg.ModelObject.prototype.setScAddr = function(addr, merged) {
    
    // remove old sc-addr from map
    if (this.sc_addr && Object.prototype.hasOwnProperty.call(this.scene.objects, this.sc_addr)) {
        delete this.scene.objects[this.sc_addr];
    }
    this.sc_addr = addr;
   
    //! @todo update state
    if (this.sc_addr)
        this.scene.objects[this.sc_addr] = this;
        
    this.need_observer_sync = true;
    
    if (merged == true)
        this.setObjectState(SCggObjectState.MergedWithMemory);
}

// -------------- node ---------

/**
 * Initialize sc.g-node object.
 * @param {Object} options
 *      Initial options of sc.g-node. It can include params from base object
 */
SCgg.ModelNode = function(options) {

    SCgg.ModelObject.call(this, options);
};

SCgg.ModelNode.prototype = Object.create( SCgg.ModelObject.prototype );

SCgg.ModelNode.prototype.getConnectionPos = function(from, dotPos) {

    SCgg.ModelObject.prototype.getConnectionPos.call(this, from, dotPos);

    var radius = this.scale.x;
    var center = this.position;
    
    var result = new SCgg.Vector3(0, 0, 0);
    
    result.copyFrom(from).sub(center).normalize();
    result.multiplyScalar(radius).add(center);

    return result;
};
SCgg.ModelNode.prototype.setPosition = function(pos) {
    if(this.edges.length>0)
        for(var edge=0;edge<this.edges.length;edge++){
            if(this.edges[edge].source==this.edges[edge].target){
                for(var point =0;point<this.edges[edge].points.length;point++){
                    this.edges[edge].points[point].x -=this.position.x -pos.x;
                    this.edges[edge].points[point].y -=this.position.y -pos.y;
                }
                edge++;
            }
        }

    SCgg.ModelObject.prototype.setPosition.call(this, pos);
};


// ---------------- link ----------
SCgg.ModelLink = function(options) {
    SCgg.ModelObject.call(this, options);

    this.contentLoaded = false;
    this.containerId = options.containerId;
    this.content = options.content;
    this.contentType = 'string';
};

SCgg.ModelLink.prototype = Object.create( SCgg.ModelObject.prototype );

SCgg.ModelLink.prototype.getConnectionPos = function(from, dotPos) {
    
    var y2 = this.scale.y * 0.5,
        x2 = this.scale.x * 0.5;
    
    var left = this.position.x - x2 - 5,
        top = this.position.y - y2 - 5,
        right = this.position.x + x2 + 5,
        bottom = this.position.y + y2 + 5;
    
    var points = SCgg.Algorithms.polyclip([
        new SCgg.Vector2(left, top),
        new SCgg.Vector2(right, top),
        new SCgg.Vector2(right, bottom),
        new SCgg.Vector2(left, bottom)
        ], from, this.position);
    
    if (points.length == 0)
        throw "There are no intersection";
    
    // find shortes
    var dMin = null,
        res = null;
    for (var i = 0; i < points.length; ++i) {
        var p = points[i];
        var d = SCgg.Math.distanceSquared(p, from);
        
        if (dMin === null || dMin > d) {
            dMin = d;
            res = p;
        }
    }
    
    return res ? new SCgg.Vector3(res.x, res.y, this.position.z) : this.position;
};

 /**
 * Setup new content value
 * @param {String} content New content value
 * @param {String} contentType Type of content (string, float, int8, int16, int32)
 */
SCgg.ModelLink.prototype.setContent = function(content, contentType) {
    this.content = content;
    this.contentType = contentType ? contentType : 'string';
    this.need_observer_sync = true;
};

// --------------- arc -----------

/**
 * Initialize sc.g-arc(edge) object
 * @param {Object} options
 *      Initial opations of sc.g-arc. 
 */
SCgg.ModelEdge = function(options) {
    
    SCgg.ModelObject.call(this, options);

    this.source = null;
    this.target = null;

    if (options.source) {
        this.setSource(options.source);
    }

    if (options.target) {
        this.setTarget(options.target);
    }

    this.source_pos = null; // the begin position of egde in world coordinates
    this.target_pos = null; // the end position of edge in world coordinates
    this.points = [];
    this.source_dot = 0.5;
    this.target_dot = 0.5;
};

SCgg.ModelEdge.prototype = Object.create( SCgg.ModelObject.prototype );

SCgg.ModelEdge.prototype.setPosition = function(offset) {
    var dp = offset.clone().sub(this.position);
    for (var i = 0; i < this.points.length; i++) {
        this.points[i].x += dp.x;
        this.points[i].y += dp.y;
    }
    SCgg.ModelObject.prototype.setPosition.call(this, offset);
};

/**
 * Destroy object
 */
SCgg.ModelEdge.prototype.destroy = function() {
    SCgg.ModelObject.prototype.destroy.call(this);
    
    if (this.target)
        this.target.removeEdge(this);
    if (this.source)
        this.source.removeEdge(this);
};

/** 
 * Setup new source object for sc.g-edge
 * @param {Object} scgg_obj
 *      sc.g-object, that will be the source of edge
 */
SCgg.ModelEdge.prototype.setSource = function(scgg_obj) {
    
    if (this.source == scgg_obj) return; // do nothing
    
    if (this.source)
        this.source.removeEdge(this);
    
    this.source = scgg_obj;
    this.source.edges.push(this);
    this.need_observer_sync = true;
    this.need_update = true;
};

/**
 * Setup new value of source dot position
 */
SCgg.ModelEdge.prototype.setSourceDot = function(dot) {
    this.source_dot = dot;
    this.need_observer_sync = true;
    this.need_update = true;
};

/**
 * Setup new target object for sc.g-edge
 * @param {Object} scgg_obj
 *      sc.g-object, that will be the target of edge
 */
SCgg.ModelEdge.prototype.setTarget = function(scgg_obj) {
     
    if (this.target == scgg_obj) return; // do nothing
    
    if (this.target)
        this.target.removeEdge(this);
    
    this.target = scgg_obj;
    this.target.edges.push(this);
    this.need_observer_sync = true;
    this.need_update = true;
};

/**
 * Setup new value of target dot position
 */
SCgg.ModelEdge.prototype.setTargetDot = function(dot) {
    this.target_dot = dot;
    this.need_observer_sync = true;
    this.need_update = true;
};

SCgg.ModelEdge.prototype.update = function() {
    
    if (!this.source_pos)
        this.source_pos = this.source.position.clone();
    if (!this.target_pos)
        this.target_pos = this.target.position.clone();

    SCgg.ModelObject.prototype.update.call(this);

    // calculate begin and end positions
    if (this.points.length > 0) {

        if (this.source instanceof SCgg.ModelEdge) {
            this.source_pos = this.source.getConnectionPos(new SCgg.Vector3(this.points[0].x, this.points[0].y, 0), this.source_dot);
            this.target_pos = this.target.getConnectionPos(new SCgg.Vector3(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y, 0), this.target_dot);
        } else {
            this.target_pos = this.target.getConnectionPos(new SCgg.Vector3(this.points[this.points.length - 1].x, this.points[this.points.length - 1].y, 0), this.target_dot);
            this.source_pos = this.source.getConnectionPos(new SCgg.Vector3(this.points[0].x, this.points[0].y, 0), this.source_dot);
        }
        
    } else {

        if (this.source instanceof SCgg.ModelEdge) {
            this.source_pos = this.source.getConnectionPos(this.target_pos, this.source_dot);
            this.target_pos = this.target.getConnectionPos(this.source_pos, this.target_dot);
        } else {
            this.target_pos = this.target.getConnectionPos(this.source_pos, this.target_dot);
            this.source_pos = this.source.getConnectionPos(this.target_pos, this.source_dot);
        }
    }

    this.position.copyFrom(this.target_pos).add(this.source_pos).multiplyScalar(0.5);
};
 
/*! Checks if this edge need to be drawen with arrow at the end
 */
SCgg.ModelEdge.prototype.hasArrow = function() {
   return this.sc_type & (sc_type_arc_common | sc_type_arc_access);
};
 
/*!
 * Setup new points for edge
 */
SCgg.ModelEdge.prototype.setPoints = function(points) {
    this.points = points;
    this.need_observer_sync = true;
    this.requestUpdate();
};

SCgg.ModelEdge.prototype.getConnectionPos = function(from, dotPos) {
    
    if (this.need_update)   this.update();
    
    // first of all we need to determine sector an it relative position
    var sector = Math.floor(dotPos);
    var sector_pos = dotPos - sector;
    
    // now we need to determine, if sector is correct (in sector bounds)
    if ((sector < 0) || (sector > this.points.length + 1)) {
        sector = this.points.length / 2;
    }
    
    var beg_pos, end_pos;
    if (sector == 0) {
        beg_pos = this.source_pos;
        if (this.points.length > 0)
            end_pos = new SCgg.Vector3(this.points[0].x, this.points[0].y, 0);
        else
            end_pos = this.target_pos;
    } else if (sector == this.points.length) {
        end_pos = this.target_pos;
        if (this.points.length > 0) 
            beg_pos = new SCgg.Vector3(this.points[sector - 1].x, this.points[sector - 1].y, 0);
        else
            beg_pos = this.source_pos;
    } else {
        if (this.points.length > sector){
            beg_pos = new SCgg.Vector3(this.points[sector - 1].x, this.points[sector - 1].y, 0);
            end_pos = new SCgg.Vector3(this.points[sector].x, this.points[sector].y, 0);
        } else {
            beg_pos = new SCgg.Vector3(this.source.x, this.source.y, 0);
            end_pos = new SCgg.Vector3(this.target.x, this.target.y, 0);
        }
    }
        
    var l_pt = new SCgg.Vector3(0, 0, 0);
    
    l_pt.copyFrom(beg_pos).sub(end_pos);
    l_pt.multiplyScalar(1 - sector_pos).add(end_pos);
    
    var result = new SCgg.Vector3(0, 0, 0);
    result.copyFrom(from).sub(l_pt).normalize();
    result.multiplyScalar(10).add(l_pt);
    
    return result;
};

SCgg.ModelEdge.prototype.calculateDotPos = function(pos) {
    
    var pts = [this.source_pos.to2d()];
    for (idx in this.points)
        pts.push(new SCgg.Vector2(this.points[idx].x, this.points[idx].y));
    pts.push(this.target_pos.to2d());
    
    var minDist = -1.0;
    var result = 0.0;
    
    for (var i = 1; i < pts.length; i++) {
        var p1 = pts[i - 1];
        var p2 = pts[i];

        var v = p2.clone().sub(p1);
        var vp = pos.clone().sub(p1);

        var vn = v.clone().normalize();

        // calculate point on line
        var p = p1.clone().add(vn.clone().multiplyScalar(vn.clone().dotProduct(vp)));
        
        if (v.length() == 0)
            return result;
            
        var dotPos = p.clone().sub(p1).length() / v.length();

        if (dotPos < 0 || dotPos > 1)
            continue;

        // we doesn't need to get real length, because we need minimum
        // so we get squared length to make that procedure faster
        var d = pos.clone().sub(p).lengthSquared();

        // compare with minimum distance
        if (minDist < 0 || minDist > d)
        {
            minDist = d;
            result = (i - 1) + dotPos;
        }
    }
    
    return result;
};
 
 //---------------- contour ----------------
 /**
 * Initialize sc.g-arc(edge) object
 * @param {Object} options
 *      Initial opations of sc.g-arc. 
 */
SCgg.ModelContour = function(options) {
    
    SCgg.ModelObject.call(this, options);

    this.childs = [];
    this.points = options.verticies ? options.verticies : [];
    this.sc_type = options.sc_type ? options.sc_type : sc_type_node_struct | sc_type_node;
    this.previousPoint = null;

    var cx = 0;
    var cy = 0;
    for (var i = 0; i < this.points.length; i++) {
        cx += this.points[i].x;
        cy += this.points[i].y;
    }

    cx /= this.points.length;
    cy /= this.points.length;
    
    this.position.x = cx;
    this.position.y = cy;
};

SCgg.ModelContour.prototype = Object.create( SCgg.ModelObject.prototype );


SCgg.ModelContour.prototype.setPosition = function(pos) {

    var dp = pos.clone().sub(this.position);
    
    for (var i = 0; i < this.childs.length; i++) {
        var newPos = this.childs[i].position.clone().add(dp);
        this.childs[i].setPosition(newPos);
    }

    for (var i = 0; i < this.points.length; i++) {
        this.points[i].x += dp.x;
        this.points[i].y += dp.y;
    }
    
    SCgg.ModelObject.prototype.setPosition.call(this, pos);
};

SCgg.ModelContour.prototype.update = function() {
    SCgg.ModelObject.prototype.update.call(this);
};

/**
 * Append new child into contour
 * @param {SCgg.ModelObject} child Child object to append
 */
SCgg.ModelContour.prototype.addChild = function(child) {
    this.childs.push(child);
    child.contour = this;
};

/**
 * Remove child from contour
 * @param {SCgg.ModelObject} child Child object for remove
 */
SCgg.ModelContour.prototype.removeChild = function(child) {
    var idx = this.childs.indexOf(child);
    this.childs.splice(idx, 1);
    child.contour = null;
};

SCgg.ModelContour.prototype.isNodeInPolygon = function (node) {
    return SCgg.Algorithms.isPointInPolygon(node.position, this.points);
};

/**
 * Convenient function for testing, which does mass checking nodes is in the contour
 * and adds them to childs of the contour
 * @param nodes array of {SCgg.ModelNode}
 */
SCgg.ModelContour.prototype.addNodesWhichAreInContourPolygon = function (nodes) {
    for (var i = 0; i < nodes.length; i++) {
        if (!nodes[i].contour && this.isNodeInPolygon(nodes[i])) {
            this.addChild(nodes[i]);
        }
    }
};

SCgg.ModelContour.prototype.isEdgeInPolygon = function (edge) {
    return !edge.contour && this.isNodeInPolygon(edge.source) && this.isNodeInPolygon(edge.target);
};

SCgg.ModelContour.prototype.addEdgesWhichAreInContourPolygon = function (edges) {
    for (var i = 0; i < edges.length; i++) {
        if (this.isEdgeInPolygon(edges[i])) {
            this.addChild(edges[i]);
        }
    }
};

SCgg.ModelContour.prototype.getConnectionPos = function (from, dotPos) {
    var points = SCgg.Algorithms.polyclip(this.points, from, this.position);
    var nearestIntersectionPoint = new SCgg.Vector3(points[0].x, points[0].y, 0);
    for (var i = 1; i < points.length; i++) {
        var nextPoint = new SCgg.Vector3(points[i].x, points[i].y, 0);
        var currentLength = from.clone().sub(nearestIntersectionPoint).length();
        var newLength = from.clone().sub(nextPoint).length();
        if (currentLength > newLength) {
            nearestIntersectionPoint = nextPoint;
        }
    }
    return nearestIntersectionPoint;
};

SCgg.ModelContour.prototype.getCenter = function() {
    var center = new SCgg.Vector3();
    
    center.x = this.points[0].x;
    center.y = this.points[1].x;
    center.z = 0;
    
    for (var i = i; i < points.length; ++i) {
        var p = points[i];
        
        center.x += p.x;
        center.y += p.y;
    }
    
    center.x /= points.length;
    center.y /= points.length;
    
    return center;
};

SCgg.ModelBus = function(options) {
    
    SCgg.ModelObject.call(this, options);
    this.id_bus = this.id;
    this.source = null;
    if (options.source)
        this.setSource(options.source);
    this.source_pos = null; // the begin position of bus in world coordinates
    this.target_pos = null; // the end position of bus in world coordinates
    this.points = [];
    this.source_dot = 0.5;
    this.target_dot = 0.5;
    this.previousPoint = null;
    //this.requestUpdate();
    //this.update();
};

SCgg.ModelBus.prototype = Object.create( SCgg.ModelObject.prototype );

SCgg.ModelBus.prototype.setPosition = function(offset) {
    var dp = offset.clone().sub(this.position);
    for (var i = 0; i < this.points.length; i++) {
        this.points[i].x += dp.x;
        this.points[i].y += dp.y;
    }
    SCgg.ModelObject.prototype.setPosition.call(this, offset);
};

SCgg.ModelBus.prototype.update = function() {
    
    if (!this.source_pos)
        this.source_pos = this.source.position.clone();
    if (!this.target_pos) {
        var target = this.points[this.points.length - 1];
        this.target_pos = new SCgg.Vector3(target.x, target.y, 0);
    }
    SCgg.ModelObject.prototype.update.call(this);

    // calculate begin and end positions
    if (this.points.length > 0) {
        
        if (this.source instanceof SCgg.ModelEdge) {
            this.source_pos = this.source.getConnectionPos(new SCgg.Vector3(this.points[0].x, this.points[0].y, 0), this.source_dot);
        } else {
            this.source_pos = this.source.getConnectionPos(new SCgg.Vector3(this.points[0].x, this.points[0].y, 0), this.source_dot);
        }
        
    } else {
        
        if (this.source instanceof SCgg.ModelEdge) {
            this.source_pos = this.source.getConnectionPos(this.target_pos, this.source_dot);
        } else {
            this.source_pos = this.source.getConnectionPos(this.target_pos, this.source_dot);
        }
    }

    this.position.copyFrom(this.target_pos).add(this.source_pos).multiplyScalar(0.5);
};

SCgg.ModelBus.prototype.setSource = function(scgg_obj) {
    if (this.source) this.source.removeBus();
    this.source = scgg_obj;
    this.id = scgg_obj.id;
    this.source.bus = this;
    this.need_observer_sync = true;
    this.need_update = true;
};

/**
 * Setup new value of source dot position
 */
SCgg.ModelBus.prototype.setSourceDot = function(dot) {
    this.source_dot = dot;
    this.need_observer_sync = true;
    this.need_update = true;
};

/**
 * Setup new value of target dot position
 */
SCgg.ModelBus.prototype.setTargetDot = function(dot) {
    this.target_dot = dot;
    this.need_observer_sync = true;
    this.need_update = true;
};

/*!
 * Setup new points for bus
 */
SCgg.ModelBus.prototype.setPoints = function(points) {
    this.points = points;
    this.need_observer_sync = true;
    this.requestUpdate();
};

SCgg.ModelBus.prototype.getConnectionPos = SCgg.ModelEdge.prototype.getConnectionPos;

SCgg.ModelBus.prototype.calculateDotPos = SCgg.ModelEdge.prototype.calculateDotPos;

SCgg.ModelBus.prototype.changePosition = function(mouse_pos) {

    var dx = mouse_pos.x - this.previousPoint.x,
        dy = mouse_pos.y - this.previousPoint.y,
        diff = new SCgg.Vector3(dx, dy, 0);

    this.position.add(diff);
    
    for (var i = 0; i < this.points.length; i++) {
        this.points[i].x += diff.x;
        this.points[i].y += diff.y;
    }

    var new_pos = this.source.position.clone().add(diff);
    this.source.setPosition(new_pos);


    this.previousPoint.x = mouse_pos.x;
    this.previousPoint.y = mouse_pos.y;

    this.need_observer_sync = true;

    this.requestUpdate();
    this.notifyEdgesUpdate();
};

SCgg.ModelBus.prototype.destroy = function() {
    SCgg.ModelObject.prototype.destroy.call(this);
    if (this.source)
        this.source.removeBus();
};


