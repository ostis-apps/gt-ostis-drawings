SCggComponent = {
    ext_lang: 'scgg_code',
    formats: ['format_scgg_json'],
    struct_support: true,
    factory: function(sandbox) {
        sandbox.decompositionNodeAddr = null;
        sandbox.graphNodeAddr = null;

        return new Promise(function(resolve, reject){
            scggKeynodesInit(sandbox, function(load){
                resolve(new scggViewerWindow(sandbox, load));
            });
        });
    }
};

function loadGraphOrCreateNew(callBackLoad, callBackNew){
    var keynodes = ['ui_graph_choose_load','ui_graph_choose_new','ui_graph_choose_message'];
    SCWeb.core.Server.resolveScAddr(keynodes, function (keynodes) {
        SCWeb.core.Server.resolveIdentifiers(keynodes, function (idf) {
            var confirmMessage = idf[keynodes['ui_graph_choose_message']];
            var buttonLoad = idf[keynodes['ui_graph_choose_load']];
            var buttonNew = idf[keynodes['ui_graph_choose_new']];
            $('#confirmChooseBox').modal({show:true,
                backdrop:false,
                keyboard: false
            });
            $('#confirmMessage').html(confirmMessage);
            $('#confirmLoadGraph').html(buttonLoad);
            $('#confirmCreateNew').html(buttonNew);
            $('#confirmLoadGraph').click(function(){
                $('#confirmChooseBox').modal('hide');
                callBackLoad();
            });
            $('#confirmCreateNew').click(function(){
                $('#confirmChooseBox').modal('hide');
                callBackNew();
            });
        });
    });
}

var createScggComponent = function(sandbox, callback){
    function findCounterInSCn() {
        return $("#" + sandbox.container + ' .sc-contour > .scs-scn-view-toogle-button').parent().attr('sc_addr');
    }
    function findCurrentVersionGraph(callback) {
            var rootNode = $("#" + sandbox.container + ' .scs-scn-keyword > .scs-scn-element').attr('sc_addr');
            var decompositionNode = null;
            // Find node tuple
            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5A_A_F_A_F,
                [   sc_type_node | sc_type_const | sc_type_node_tuple,
                    sc_type_arc_common | sc_type_const,
                    rootNode,
                    sc_type_arc_pos_const_perm,
                    SCggKeynodesHandler.scKeynodes.nrel_temporal_decomposition
                ]
            ).done(function (results) {
                decompositionNode = results[0][0];
                // Find current_version graph
                window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                    [   results[0][0],
                        sc_type_arc_pos_const_perm,
                        sc_type_node | sc_type_const | sc_type_node_struct,
                        sc_type_arc_pos_const_perm,
                        SCggKeynodesHandler.scKeynodes.rrel_current_version
                    ]
                ).done(function (results) {
                    $('#' + sandbox.container).load('static/components/html/scgg-choose-new-or-load.html', function () {
                        loadGraphOrCreateNew(function () {
                                sandbox.addr = results[0][2];
                                sandbox.graphNodeAddr = rootNode;
                                sandbox.decompositionNodeAddr = decompositionNode;
                                callback(true);
                            }, function () {
                                callback(false);
                            });
                    });
                }).fail(function () {
                    //console.log("Not find rrel_current_version");
                    callback(false);
                });
            }).fail(function () {
                //console.log("Not find nrel_temporal_decomposition");
                callback(false);
            });
    }
    function findGraphAndDecomposition(addr, callback) {
        var decompositionNode = null;

        window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3A_A_F,
            [   sc_type_node | sc_type_const | sc_type_node_tuple,
                sc_type_arc_pos_const_perm,
                addr
            ]
        ).done(function (results) {
            decompositionNode = results[0][0];
            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                [   decompositionNode,
                    sc_type_arc_common | sc_type_const,
                    sc_type_node,
                    sc_type_arc_pos_const_perm,
                    SCggKeynodesHandler.scKeynodes.nrel_temporal_decomposition
                ]
            ).done(function (results) {
                sandbox.graphNodeAddr = results[0][2];
                sandbox.decompositionNodeAddr = decompositionNode;
                callback();
            }).fail(function () {
                //console.log("Not find rootNode");
                callback();
            });
        }).fail(function () {
            //console.log("Not find decompositionNode");
            callback();
        });
    }

    if (findCounterInSCn() !== undefined){
        $('#' + sandbox.container).load('static/components/html/scgg-choose-new-or-load.html', function () {
            loadGraphOrCreateNew(function () {
                sandbox.addr = findCounterInSCn();
                findGraphAndDecomposition(sandbox.addr, function () {
                    callback(true);
                });
            }, function () {
                callback(false);
            });
        });
    } else {
        findCurrentVersionGraph(function(load){
            callback(load);
        });
    }

};

var scggKeynodesInit = function (sandbox, callback) {
    if (SCggKeynodesHandler.load == false){
        SCggKeynodesHandler.initSystemIds(function () {
            createScggComponent(sandbox, function(load){
                callback(load);
            });
        });
    } else {
        createScggComponent(sandbox, function(load){
            callback(load);
        });
    }
};

/**
 * scggViewerWindow
 * @param config
 * @constructor
 */
var scggViewerWindow = function(sandbox, load) {
    this.domContainer = sandbox.container;
    this.sandbox = sandbox;
    this.sandbox.loadGraph = load;
    this.tree = new SCgg.Tree();
    this.editor = new SCgg.Editor();
    
    var self = this;
    if (sandbox.is_struct) {
        this.scStructTranslator = new scggScStructTranslator(this.editor, this.sandbox);
    }

    var autocompletionVariants = function(keyword, callback, self) {

        SCWeb.core.Server.findIdentifiersSubStr(keyword, function(data) {
            keys = [];
            for (key in data) {
                var list = data[key];
                for (idx in list) {
                    var value = list[idx]
                    keys.push({name: value[1], addr: value[0], group: key});
                }
            }

            callback(keys);
        });
    };
    
    this.editor.init(
        {
            sandbox: sandbox,
            containerId: sandbox.container,
            autocompletionVariants : autocompletionVariants,
            translateToSc: function(scene, callback) {
                return self.scStructTranslator.translateToSc(callback);
            },
            canEdit: this.sandbox.canEdit(),
            resolveControls: this.sandbox.resolveElementsAddr
        }
    );


    this.receiveData = function(data) {
        var dfd = new jQuery.Deferred();
    
        /*this.collectTriples(data);
        this.tree.build(this.triples);*/
        this._buildGraph(data);

        dfd.resolve();
        return dfd.promise();
    };

    this.collectTriples = function(data) {

        this.triples = [];
        
        var elements = {};
        var edges = [];
        for (var i = 0; i < data.length; i++) {
            var el = data[i];

            elements[el.id] = el;
            if (el.el_type & sc_type_arc_mask) {
                edges.push(el);
            }
        }

        var founded = true;
        while (edges.length > 0 && founded) {
            founded = false;
            for (idx in edges) {
                var obj = edges[idx];
                var beginEl = elements[obj.begin];
                var endEl = elements[obj.end];

                // try to get begin and end object for arc
                if (beginEl && endEl) {
                    founded = true;
                    edges.splice(idx, 1);
                    
                    this.triples.push([beginEl, {type: obj.el_type, addr: obj.id}, endEl]);
                } 
            }
        }

        alert(this.triples.length);
    };

    this._buildGraph = function(data) {
        
        var elements = {};
        var edges = new Array();
        for (var i = 0; i < data.length; i++) {
            var el = data[i];
            
            if (elements.hasOwnProperty(el.id))
                continue;
            if (Object.prototype.hasOwnProperty.call(this.editor.scene.objects, el.id)) {
                elements[el.id] = this.editor.scene.objects[el.id];
                continue;
            }
            
            if (el.el_type & sc_type_node || el.el_type & sc_type_link) {
                var model_node = SCgg.Creator.createNode(el.el_type, new SCgg.Vector3(10 * Math.random(), 10 * Math.random(), 0), '');
                this.editor.scene.appendNode(model_node);
                this.editor.scene.objects[el.id] = model_node;
                model_node.setScAddr(el.id);
                model_node.setObjectState(SCggObjectState.FromMemory);
                elements[el.id] = model_node;
            } else if (el.el_type & sc_type_arc_mask) {
                edges.push(el);
            }
        }
        
        // create edges
        var founded = true;
        while (edges.length > 0 && founded) {
            founded = false;
            for (idx in edges) {
                var obj = edges[idx];
                var beginId = obj.begin;
                var endId = obj.end;
                // try to get begin and end object for arc
                if (elements.hasOwnProperty(beginId) && elements.hasOwnProperty(endId)) {
                    var beginNode = elements[beginId];
                    var endNode = elements[endId];
                    founded = true;
                    edges.splice(idx, 1);
                    var model_edge = SCgg.Creator.createEdge(beginNode, endNode, obj.el_type);
                    this.editor.scene.appendEdge(model_edge);
                    this.editor.scene.objects[obj.id] = model_edge;
                    model_edge.setScAddr(obj.id);
                    model_edge.setObjectState(SCggObjectState.FromMemory);
                    elements[obj.id] = model_edge;
                } 
            }
        }
        
        if (edges.length > 0)
            alert("error");
        
        this.editor.render.update();
        this.editor.scene.layout();
    };

    this.destroy = function(){
        delete this.editor;
        return true;
    };

    this.getObjectsToTranslate = function() {
        return this.editor.scene.getScAddrs();
    };

    this.applyTranslation = function(namesMap) {
        for (addr in namesMap) {
            var obj = this.editor.scene.getObjectByScAddr(addr);
            if (obj) {
                obj.text = namesMap[addr];
            }
        }
        this.editor.render.updateTexts();
        this.editor.updateGraphName();
    };

    this.eventStructUpdate = function() {
        self.scStructTranslator.updateFromSc.apply(self.scStructTranslator, arguments);
    };

    // delegate event handlers
    this.sandbox.eventDataAppend = $.proxy(this.receiveData, this);
    this.sandbox.eventGetObjectsToTranslate = $.proxy(this.getObjectsToTranslate, this);
    this.sandbox.eventApplyTranslation = $.proxy(this.applyTranslation, this);
    this.sandbox.eventStructUpdate = $.proxy(this.eventStructUpdate, this);

    if (load){
        this.sandbox.updateContent();
    }

    var startIdIndex = 7;
    this.window_id = this.domContainer.substring(startIdIndex) + '_' + this.sandbox.command_state.format;
    SCWeb.ui.KeyboardHandler.subscribeWindow(this.window_id, this.editor.keyboardCallbacks);
};



SCWeb.core.ComponentManager.appendComponentInitialize(SCggComponent);
