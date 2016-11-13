var SCggLayoutObjectType = {
    Node: 0,
    Edge: 1,
    Link: 2,
    Contour: 3,
    DotPoint: 4
};

// Layout algorithms


/**
 * Base layout algorithm
 */
SCgg.LayoutAlgorithm = function(nodes, edges, contours, onTickUpdate) {
    this.nodes = nodes;
    this.edges = edges;
    this.contours = contours;
    this.onTickUpdate = onTickUpdate;
};

SCgg.LayoutAlgorithm.prototype = {
    constructor: SCgg.LayoutAlgorithm
};

// --------------------------

SCgg.LayoutAlgorithmForceBased = function(nodes, edges, contours, onTickUpdate, rect) {
    SCgg.LayoutAlgorithm.call(this, nodes, edges, contours, onTickUpdate);
    this.rect = rect;
};

SCgg.LayoutAlgorithmForceBased.prototype = Object.create( SCgg.LayoutAlgorithm );

SCgg.LayoutAlgorithmForceBased.prototype.destroy = function() {
    this.stop();
};

SCgg.LayoutAlgorithmForceBased.prototype.stop = function() {
      if (this.force) {
        this.force.stop();
        delete this.force;
        this.force = null;
    }
};

SCgg.LayoutAlgorithmForceBased.prototype.start = function() {
    
    this.stop();
    
    // init D3 force layout
    var self = this;
    

    this.force = d3.layout.force()
    .nodes(this.nodes)
    .links(this.edges)
    .size(this.rect)
    .friction(0.9)
    .gravity(0.03)
    .linkDistance(function(edge){
        
        var p1 = edge.source.object.getConnectionPos(edge.target.object.position, edge.object.source_dot);
        var p2 = edge.target.object.getConnectionPos(edge.source.object.position, edge.object.target_dot);
        var cd = edge.source.object.position.clone().sub(edge.target.object.position).length();
        var d = cd - p1.sub(p2).length();
        
		if (edge.source.type == SCggLayoutObjectType.DotPoint ||
			edge.target.type == SCggLayoutObjectType.DotPoint) {
			return d + 50;
		}

		return 100 + d;
	})
	.linkStrength(function(edge){
		if (edge.source.type == SCggLayoutObjectType.DotPoint ||
			edge.target.type == SCggLayoutObjectType.DotPoint) {
			return 1;
		}

		return 0.3;
	})
    .charge(function(node) {
		if (node.type == SCggLayoutObjectType.DotPoint) {
            return 0;
		} else if (node.type == SCggLayoutObjectType.Link) {
            return -900;
        }
        
		return -700;
	})
    .on('tick', function() {
        self.onLayoutTick();
    })
    .start();
};

SCgg.LayoutAlgorithmForceBased.prototype.onLayoutTick = function() {
    
    var dots = [];
    for (idx in this.nodes) {
        var node_layout = this.nodes[idx];
        
        if (node_layout.type === SCggLayoutObjectType.Node) {
            node_layout.object.setPosition(new SCgg.Vector3(node_layout.x, node_layout.y, 0));
        } else if (node_layout.type === SCggLayoutObjectType.Link) {
            node_layout.object.setPosition(new SCgg.Vector3(node_layout.x, node_layout.y, 0));
        } else if (node_layout.type === SCggLayoutObjectType.DotPoint) {
            dots.push(node_layout);
        } else if (node_layout.type === SCggLayoutObjectType.Contour) {
            node_layout.object.setPosition(new SCgg.Vector3(node_layout.x, node_layout.y, 0));
        }
    }
    
    // setup dot points positions 
    for (idx in dots) {
        var dot = dots[idx];
        
        var edge = dot.object.target;
        if (dot.source)
            edge = dot.object.source;
                
        dot.x = edge.position.x;
        dot.y = edge.position.y;
    }
    
    this.onTickUpdate();
};


// ------------------------------------

SCgg.LayoutManager = function() {

};

SCgg.LayoutManager.prototype = {
    constructor: SCgg.LayoutManager
};

SCgg.LayoutManager.prototype.init = function(scene) {
    this.scene = scene;
    this.nodes = null;
    this.edges = null;
    
    this.algorithm = null;
};

/**
 * Prepare objects for layout
 */
SCgg.LayoutManager.prototype.prepareObjects = function() {

    this.nodes = new Array();
    this.edges = new Array();
    var objDict = {};
    
    // first of all we need to collect objects from scene, and build them representation for layout
    for (idx in this.scene.nodes) {
        var node = this.scene.nodes[idx];
        if (node.contour)
            continue;
        
        var obj = new Object();
        
        obj.x = node.position.x;
        obj.y = node.position.y;
        obj.object = node;
        obj.type = SCggLayoutObjectType.Node;
        
        objDict[node.id] = obj;
        this.nodes.push(obj);
    }
    
    for (idx in this.scene.links) {
        var link = this.scene.links[idx];
        if (link.contour)
            continue;
        
        var obj = new Object();
        
        obj.x = link.position.x;
        obj.y = link.position.y;
        obj.object = link;
        obj.type = SCggLayoutObjectType.Link;
        
        objDict[link.id] = obj;
        this.nodes.push(obj);
    }
    
    for (idx in this.scene.edges) {
        var edge = this.scene.edges[idx];
        if (edge.contour)
            continue;
        
        var obj = new Object();
        
        obj.object = edge;
        obj.type = SCggLayoutObjectType.Edge;
        
        objDict[edge.id] = obj;
        this.edges.push(obj);
    }
    
    for (idx in this.scene.contours) {
        var contour = this.scene.contours[idx];
        if (contour.contour)
            continue;
        
        var obj = new Object();
        
        obj.x = contour.position.x;
        obj.y = contour.position.y;
        obj.object = contour;
        obj.type = SCggLayoutObjectType.Contour;
        
        objDict[contour.id] = obj;
        this.nodes.push(obj);
    }
    
    // store begin and end for edges
    for (idx in this.edges) {
        edge = this.edges[idx];
        
        source = objDict[edge.object.source.id];
        target = objDict[edge.object.target.id];
        
        function getEdgeObj(srcObj, isSource) {
            if (srcObj.type == SCggLayoutObjectType.Edge) {
                var obj = new Object();
                obj.type = SCggLayoutObjectType.DotPoint;
                obj.object = srcObj.object;
                obj.source = isSource;
            
                return obj;
            }
            return srcObj;
        };
                
        edge.source = getEdgeObj(source, true);
        edge.target = getEdgeObj(target, false);
        
        if (edge.source != source)
            this.nodes.push(edge.source);
        if (edge.target != target)
            this.nodes.push(edge.target);
    }
    
};

/**
 * Starts layout in scene
 */
SCgg.LayoutManager.prototype.doLayout = function() {
    
    if (this.algorithm) {
        this.algorithm.stop();
        delete this.algorithm;
    }
    
    this.prepareObjects();
    this.algorithm = new SCgg.LayoutAlgorithmForceBased(this.nodes, this.edges, null, 
                                                        $.proxy(this.onTickUpdate, this), 
                                                        this.scene.getContainerSize());
    this.algorithm.start();
};

SCgg.LayoutManager.prototype.onTickUpdate = function() { 
    this.scene.updateObjectsVisual();
};
