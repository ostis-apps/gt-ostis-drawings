function SCggFromScImpl(_sandbox, _editor, aMapping) {
    
    var self = this,
        arcMapping = aMapping,
        tasks = [],
        timeout = 0, 
        batch = null,
        tasksLength = 0,
        editor = _editor,
        sandbox = _sandbox;

    function resolveIdtf(addr, obj) {
        if (obj instanceof SCgg.ModelNode){
            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                [   addr,
                    sc_type_arc_common | sc_type_const,
                    sc_type_link,
                    sc_type_arc_pos_const_perm,
                    SCggKeynodesHandler.scKeynodes.nrel_gt_idtf
                ]
            ).done(function(results) {
                window.sctpClient.get_link_content(results[0][2],'string').done(function(content) {
                    obj.setText(content);
                });
            }).fail(function(r){
                //console.log("not find nrel_gt_idtf in SCggFromScImpl");
                // Try set nrel_main_idtf
                sandbox.getIdentifier(addr, function(idtf) {
                    obj.setText(idtf);
                });
            });
        } else if (obj instanceof SCgg.ModelEdge){
            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                [   addr,
                    sc_type_arc_common | sc_type_const,
                    sc_type_link,
                    sc_type_arc_pos_const_perm,
                    SCggKeynodesHandler.scKeynodes.nrel_weight
                ]
            ).done(function(results) {
                window.sctpClient.get_link_content(results[0][2],'string').done(function(content) {
                        obj.setText(content);
                });
            }).fail(function(r){
                //console.log("not find nrel_weight in SCggFromScImpl");
            });
        }
    }

    function randomPos() {
        return new SCgg.Vector3(100 * Math.random(), 100 * Math.random(), 0);
    }
    
    var doBatch = function() {
        
        if (!batch) {
            if (!tasks.length || tasksLength === tasks.length) {
                window.clearInterval(self.timeout);
                self.timeout = 0;
                return;
            }
            batch = tasks.splice(0, Math.max(150, tasks.length));
            tasksLength = tasks.length;
        }
        if (batch) {

            taskDoneCount = 0;
            for (var i = 0; i < batch.length; ++i) {
                var task = batch[i];
                var addr = task[0];
                var type = task[1];

                if (editor.scene.getObjectByScAddr(addr))
                    continue;

                if (type & sc_type_node) {
                    var model_node = SCgg.Creator.createNode(type, randomPos(), '');
                    editor.scene.appendNode(model_node);
                    editor.scene.objects[addr] = model_node;
                    model_node.setScAddr(addr);
                    model_node.setObjectState(SCggObjectState.FromMemory);
                    resolveIdtf(addr, model_node);
                } else if (type & sc_type_arc_mask) {
                    var bObj = editor.scene.getObjectByScAddr(task[2]);
                    var eObj = editor.scene.getObjectByScAddr(task[3]);
                    if (!bObj || !eObj) {
                        tasks.push(task);
                    } else {
                        var model_edge = SCgg.Creator.createEdge(bObj, eObj, type);
                        editor.scene.appendEdge(model_edge);
                        editor.scene.objects[addr] = model_edge;
                        model_edge.setScAddr(addr);
                        model_edge.setObjectState(SCggObjectState.FromMemory);
                        resolveIdtf(addr, model_edge);
                    }
                } else if (type & sc_type_link) {
                    var containerId = 'scgg-window-' + sandbox.addr + '-' + addr + '-' + new Date().getUTCMilliseconds();;
                    var model_link = SCgg.Creator.createLink(randomPos(), containerId);
                    editor.scene.appendLink(model_link);
                    editor.scene.objects[addr] = model_link;
                    model_link.setScAddr(addr);
                    model_link.setObjectState(SCggObjectState.FromMemory);
                }
                
            }

            editor.render.update();
            editor.scene.layout();
            
            batch = null;
        }
    };
    
    var addTask = function(args) {
        tasks.push(args);
        if (!self.timeout) {
            self.timeout = window.setInterval(doBatch, 10);
        }
        doBatch();
    };
    
    var removeElement = function(addr) {
        var obj = editor.scene.getObjectByScAddr(addr);
        if (obj)
            editor.scene.deleteObjects([obj]);
        editor.render.update();
        editor.scene.layout();
    };
    
    return {
        update: function(added, element, arc) {
            
            if (added) {
                window.sctpClient.get_arc(arc).done(function (r) {
                    var el = r[1];
                    window.sctpClient.get_element_type(el).done(function(t) {
                        arcMapping[arc] = el;
                        if (t & (sc_type_node | sc_type_link)) {
                            addTask([el, t]);
                        } else if (t & sc_type_arc_mask) {
                            window.sctpClient.get_arc(el).done(function(r) {
                                addTask([el, t, r[0], r[1]]);
                            });
                        } else
                            throw "Unknown element type " + t;
                    });
                });
            } else {
                var e = arcMapping[arc];
                if (e)
                    removeElement(e);
            }
        }
    };
    
};

// ----------------------------------------------------------------------

//! TODO: refactoring
function scggScStructTranslator(_editor, _sandbox) {
    var r, editor = _editor,
        sandbox = _sandbox,
        tasks = [],
        processBatch = false,
        taskDoneCount = 0,
        arcMapping = {};
    
    if (!sandbox.is_struct)
        throw "Snadbox must to work with sc-struct";
    
    var scggFromSc = new SCggFromScImpl(sandbox, editor, arcMapping);
    
    var appendToConstruction = function(obj) {
        var dfd = new jQuery.Deferred();
        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, sandbox.addr, obj.sc_addr).done(function(addr) {
            arcMapping[addr] = obj;
            dfd.resolve();
        }).fail(function() {
            dfd.reject();
        });
        return dfd.promise();
    };
    
    var currentLanguage = sandbox.getCurrentLanguage();
    var translateIdentifier = function(obj) {
        var dfd = new jQuery.Deferred();
        if (currentLanguage) {
            window.sctpClient.create_link().done(function(link_addr) {
                window.sctpClient.set_link_content(link_addr, obj.text).done(function () {
                    window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, obj.sc_addr, link_addr).done(function(arc_addr) {
                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, currentLanguage, link_addr).done(function() {
                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, window.scKeynodes.nrel_main_idtf, arc_addr)
                                .done(dfd.resolve)
                                .fail(dfd.reject);
                        }).fail(dfd.reject);
                    }).fail(dfd.reject);
                }).fail(dfd.reject);
            }).fail(dfd.reject);
            
        } else {
            dfd.reject();
        }
        return dfd.promise();
    };

    var translateGtIdentifier = function (obj) {
        var dfd = new jQuery.Deferred();
        window.sctpClient.create_link().done(function (link_addr) {
            window.sctpClient.set_link_content(link_addr, obj.text).done(function () {
                window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, obj.sc_addr, link_addr).done(function (arc_addr) {
                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, SCggKeynodesHandler.scKeynodes.nrel_gt_idtf, arc_addr)
                        .done(dfd.resolve)
                        .fail(dfd.reject);
                }).fail(dfd.reject);
            }).fail(dfd.reject);
        }).fail(dfd.reject);
        return dfd.promise();
    };
    
    return r = {
        mergedWithMemory: function(obj) {
            if (!obj.sc_addr)
                throw "Invalid parameter";
            
            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_F,
                                               [sandbox.addr, sc_type_arc_pos_const_perm, obj.sc_addr]).done(function(r) {
                if (r.length == 0) {
                    appendToConstruction(obj);
                }
            });
        },
        updateFromSc: function(added, element, arc) {
            scggFromSc.update(added, element, arc);
        },

translateToSc: function(callback) {
                       //wtf
            if (!sandbox.is_struct)
                throw "Invalid state. Trying translate sc-link into sc-memory";

            var addrStruct = undefined;
            
            var appendObjects = function() {
                $.when.apply($, objects.map(function(obj) {
                    return appendToConstruction(obj);
                })).done(function() {
                    callback(true);
                }).fail(function() {
                    callback(false);
                });
            };

            function fireCallback() {
                editor.render.update();
                editor.scene.layout();
                appendObjects();
            }

            var addrStruct;
            // editor.scene.comandManager.clear();

            var nodes = editor.scene.nodes.slice();
            var objects = [];


            var translateStruct = function() {
                console.log("translateStruct");
                var dfd = new jQuery.Deferred();
                var createNodeGraph = function() {
                    var dfdAddrStruct = new jQuery.Deferred();

                    window.sctpClient.create_node(sc_type_node | sc_type_const | sc_type_node_struct).done(function (nodeNewGraph){
                        addrStruct = nodeNewGraph;

                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, SCggKeynodesHandler.scKeynodes.concept_graph, nodeNewGraph)
                        .done(dfdAddrStruct.resolve)
                        .fail(dfdAddrStruct.reject);;

                    });
                        return dfdAddrStruct.promise();
                };

                var translateTemporalDecomposition = function() {
                    var dfdTranslateDecomposition = new jQuery.Deferred();
                    var graphName = editor.getGraphName();
                    var graphNameAddr = editor.render.sandbox.addr;

                    var graphDecomposition =  new SCgg.ModelNode({
                                text: graphName
                                // sc_addr: graphDecompositionAddr
                            });

                    // var temporary_entity;
                    
                        var findDecomposition = function(){
                            var dfdFind = new jQuery.Deferred();

                            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3A_A_F,
                            [   sc_type_node | sc_type_const | sc_type_node_tuple,
                                sc_type_arc_pos_const_perm,
                                editor.render.sandbox.addr,
                            ]).done(function(results){
                                //could be a prob with prev iterator...
                                window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                [   results[0][0],
                                    sc_type_arc_common | sc_type_const,
                                    sc_type_node | sc_type_const,
                                    sc_type_arc_pos_const_perm,
                                    SCggKeynodesHandler.scKeynodes.nrel_temporal_decomposition
                                ]).done(function(results){
                                    editor.render.sandbox.decompositionNodeAddr = results[0][0];
                                    editor.render.sandbox.graphNodeAddr = results[0][2];
                                    dfdFind.resolve();
                                }).fail(dfdFind.reject);
                            }).fail(dfdFind.reject);

                            
                            return dfdFind.promise();                        
                        };

                        var createDecomposition = function() {
                            editor.render.sandbox.loadGraph = true; //?

                            var dfdCreate = new jQuery.Deferred();

                            window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (graphDecompositionAddr) {
                            
                                graphDecomposition.sc_addr = graphDecompositionAddr;
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, SCggKeynodesHandler.scKeynodes.concept_graph, graphDecompositionAddr);
                            
                                    window.sctpClient.create_node(sc_type_node | sc_type_const | sc_type_node_tuple).done(function (graphDecompositionTupleAddr) {
                                        editor.render.sandbox.decompositionNodeAddr = graphDecompositionTupleAddr;
                                        editor.render.sandbox.graphNodeAddr = graphDecompositionAddr;
                                        window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, graphDecompositionTupleAddr, graphDecomposition.sc_addr).done(function(arcTemporalDecomposition) {
                                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, SCggKeynodesHandler.scKeynodes.nrel_temporal_decomposition, arcTemporalDecomposition).done(function(){
                                                        if ((graphDecomposition.text !== '') && (graphDecomposition.text !== null)) {
                                                        // translateIdentifier(graphDecomposition)
                                                            window.sctpClient.create_link().done(function (link_addr) {
                                                                window.sctpClient.set_link_content(link_addr, graphDecomposition.text).done(function () {
                                                                    window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, graphDecomposition.sc_addr, link_addr).done(function (arc_addr) {
                                                                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, window.scKeynodes.nrel_main_idtf, arc_addr)
                                                                        .done(dfdCreate.resolve)
                                                                        .fail(dfdCreate.reject);
                                                                    }).fail(dfdCreate.reject);
                                                                }).fail(dfdCreate.reject);
                                                            }).fail(dfdCreate.reject);
                                                            }
                                                        else {
                                                            dfdCreate.resolve();
                                                            }
                                                        })
                                                    .fail(dfdCreate.reject);
                                        }).fail(dfdCreate.reject);
                                    }).fail(dfdCreate.reject);
                            }).fail(dfdCreate.reject);
                            
                             return dfdCreate.promise();
                        };
                    

                            var addCurrentGraph = function() {
                                var dfdAddCurrentGraph = new jQuery.Deferred();

                                var deleteCurrent = function (){
                                    var dfdDeleteCurrent = new jQuery.Deferred();

                                    window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                                        [   editor.render.sandbox.decompositionNodeAddr,
                                            sc_type_arc_pos_const_perm,
                                            sc_type_node | sc_type_const,
                                            sc_type_arc_pos_const_perm,
                                            SCggKeynodesHandler.scKeynodes.rrel_current_version
                                        ]).done(function(results){ 
                                            SCWeb.core.Server.resolveScAddr(['sc_garbage'], function (keynodes) {     
                                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, keynodes.sc_garbage, results[0][3])
                                                .done(dfdDeleteCurrent.resolve)
                                                .fail(dfdDeleteCurrent.reject);
                                            });
                                            window.sctpClient.erase_element(results[0][2]).done(dfdDeleteCurrent.resolve)
                                            .fail(dfdDeleteCurrent.reject);
                                        }).fail(dfdDeleteCurrent.resolve);

                                    return dfdDeleteCurrent.promise();
                                }

                                var addCurrent = function(){
                                    var addCurrent = new jQuery.Deferred();

                                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, editor.render.sandbox.decompositionNodeAddr, addrStruct).done(function (arcSysIdtf){
                                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, SCggKeynodesHandler.scKeynodes.rrel_current_version, arcSysIdtf)
                                            .done(function(){
                                                addCurrent.resolve();
                                            }).fail(addCurrent.reject);        
                                        }).fail(addCurrent.reject);

                                    return addCurrent.promise();
                                }

                                deleteCurrent().always(function(){
                                    addCurrent()
                                    .done(dfdAddCurrentGraph.resolve)
                                    .fail(dfdAddCurrentGraph.reject);
                                });

                                return dfdAddCurrentGraph.promise();
                            };

                           
                       // findOrCreateDecomposition().done(dfdTranslateDecomposition.resolve);
                        if (!editor.render.sandbox.loadGraph){
                        createDecomposition().done(function() {
                            addCurrentGraph().done(dfdTranslateDecomposition.resolve)
                            .fail(dfdTranslateDecomposition.reject);
                        }).fail(dfdTranslateDecomposition.reject);
                       }
                        else{
                        if (editor.render.sandbox.graphNodeAddr === null){
                            findDecomposition().done(function(){
                                addCurrentGraph().done(dfdTranslateDecomposition.resolve)
                                .fail(dfdTranslateDecomposition.reject);
                        }).fail(dfdTranslateDecomposition.reject);
                            }
                        else {
                                addCurrentGraph().done(dfdTranslateDecomposition.resolve)
                                .fail(dfdTranslateDecomposition.reject);
                            }
                        }   
                    

                    return dfdTranslateDecomposition.promise();
                }

                createNodeGraph().done(function(){
                            translateTemporalDecomposition()
                            .done(dfd.resolve)
                            .fail(dfd.reject)
                            });

                return dfd.promise();
            };

            var translateNodes = function(){
                console.log("translateNodes");
                var dfd = new jQuery.Deferred();
                
                var implFunc = function(node){
                    var dfdNode = new jQuery.Deferred();
                        window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (nodeAddr) {

                            node.setScAddr(nodeAddr);
                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, addrStruct, nodeAddr).done(function (arcSystemIdentifier){
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, SCggKeynodesHandler.scKeynodes.rrel_vertex, arcSystemIdentifier)
                                .done(dfdNode.resolve)
                                .fail(dfdNode.reject);
                                //add idtf changed 
                            if ((node.text !== '') && (node.text !== null) && (node.text !== undefined)) {
                                translateGtIdentifier(node)
                                .done(dfdNode.resolve)
                                .fail(dfdNode.reject);
                            }
                            else {
                                dfdNode.resolve();

                            }
                            
                            })
                            //leave it for me right now :D
                            .fail(function() {
                                console.log("WTF THIS MISTAKE " + addrStruct + " " + nodeAddr )
                            });
                        });
                        return dfdNode.promise();
                }

                var funcs = [];
                for (var i = 0; i < nodes.length; ++i){
                    funcs.push(fQueue.Func(implFunc, [ nodes[i] ]));
                }
                fQueue.Queue.apply(this, funcs).done(dfd.resolve).fail(dfd.reject);

                return dfd.promise();
            }
            

            var translateEdges = function(){
                console.log("translateEdges");
                var dfd = new jQuery.Deferred();
                var edges = editor.scene.edges.slice();
                
                var edgesNew = [];
                var translatedCount = 0;
                function doIteration(){
                    

                    function newxIteration() {
                        if (edges.length === 0) {
                            if (translatedCount === 0 || (edges.length === 0 && edgesNew.length === 0))
                                dfd.resolve();
                            else {
                                edges = edgesNew;
                                edgesNew = [];
                                translatedCount = 0;
                                window.setTimeout(doIteration, 0);
                            }
                        }
                        else 
                            window.setTimeout(doIteration, 0);
                    }

                    var edge = edges.shift();

                    var src = edge.source.sc_addr;
                    var trg = edge.target.sc_addr;
                    var createOrEdge = function(src,target)
                    {
                        var dfdEdge = new jQuery.Deferred();
                        window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, src, target).done(function(r){
                            edge.setScAddr(r);
                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, addrStruct, r).done(function (arcSystemIdentifier){
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, SCggKeynodesHandler.scKeynodes.rrel_oredge, arcSystemIdentifier)
                                .done(dfdEdge.resolve(r));
                            });
                            
                        });
                        return dfdEdge.promise();
                    }

                    var translateWeight = function(edge){
                        var dfdWeight = new jQuery.Deferred();

                        if ((edge.text !== '') && (edge.text !== null) && (edge.text !== undefined)) {
                                window.sctpClient.create_link().done(function (link_addr) {
                                    window.sctpClient.set_link_content(link_addr, edge.text).done(function () {
                                        window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, edge.sc_addr, link_addr).done(function (arc_addr) {
                                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, SCggKeynodesHandler.scKeynodes.nrel_weight, arc_addr)
                                            .done(dfdWeight.resolve)
                                            .fail(dfdWeight.reject);
                                        }).fail(dfdWeight.reject);
                                    }).fail(dfdWeight.reject);
                                }).fail(dfdWeight.reject);                                
                        }
                        else {
                            dfdWeight.resolve();
                        }


                        return dfdWeight.promise();
                    }

                    if (src && trg) {
                        if (edge.sc_type === (sc_type_edge_common | sc_type_const)) {                            
                            createOrEdge(trg,src)
                            .done(function(){
                                translateWeight(edge).done(function(){
                                    createOrEdge(src,trg).done(function (r){
                                    translateWeight(edge);
                                    edge.setObjectState(SCggObjectState.NewInMemory);

                                    objects.push(edge);
                                    newxIteration();
                                    });
                                }) 
                            });
                        }
                        else {
                        createOrEdge(src,trg).done(function (r){
                            translateWeight(edge);
                            edge.setObjectState(SCggObjectState.NewInMemory);

                            objects.push(edge);
                            newxIteration();
                            });
                        }
                    }
                    else {
                        edgesNew.push(edge);
                        newxIteration();
                    }

                }

                if (edges.length > 0)
                    window.setTimeout(doIteration, 0);
                else
                    dfd.resolve();
                
                return dfd.promise();
            }


            

            fQueue.Queue(
                    fQueue.Func(translateStruct),
                    fQueue.Func(translateNodes),
                    fQueue.Func(translateEdges)
                ).done(fireCallback);
                
        }

    };
};