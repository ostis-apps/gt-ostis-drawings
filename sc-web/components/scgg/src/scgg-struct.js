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
        sandbox.getIdentifier(addr, function(idtf) {
            obj.setText(idtf);
        });
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
                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, window.scKeynodes.nrel_gt_idtf, arc_addr)
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

            // var dfdNodes = jQuery.Deferred();
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

            var nrel_gt_idtf = undefined;
            var rrel_vertex = undefined;
            var rrel_edge = undefined;
                
            //undefined
            // editor.scene.comandManager.clear();
            
            var nodes = editor.scene.nodes.slice();
            var objects = [];


            var translateStruct = function() {
                console.log("translateStruct");
                var dfd = new jQuery.Deferred();
                var wtfImplFunc = function() {
                    window.sctpClient.create_node(sc_type_node | sc_type_const | sc_type_node_struct).done(function (nodeNewGraph){
                        addrStruct = nodeNewGraph;

                        //TODO CREATA GRAPH NAME


                        var createGraphName = function(addrStruct){
                            window.sctpClient.create_link().done(function (nodeNameGraph) {
                                window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, nodeNewGraph, nodeNameGraph).done(function (arcSystemIdentifier){
                                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, window.scKeynodes.nrel_main_idtf, arcSystemIdentifier).fail(dfd.reject);;
                                }).fail(dfd.reject);
                            var currentdate = new Date();
                            var nameGraph = "newgraph"  + "_"
                                + currentdate.getDate() + "."
                                + (currentdate.getMonth()+1)  + "."
                                + currentdate.getFullYear() + "_"
                                + currentdate.getHours() + "."
                                + currentdate.getMinutes() + "."
                                + currentdate.getSeconds();
                            window.sctpClient.set_link_content(nodeNameGraph, nameGraph)
                            .done(dfd.resolve)
                            .fail(dfd.reject);
                            });

                            return dfd.promise();
                        }

                        createGraphName(addrStruct);
                        //я нуб в js и зачем делать очередь для 1-го эл-та
                        // var funcs = [];
                        // funcs.push(fQueue.Func(createGraphName,[ addrStruct ]));
                        // fQueue.Queue.apply(this, funcs).done(dfd.resolve).fail(dfd.reject);
                        return dfd.promise();

                    });
                    return dfd.promise();
                };
                wtfImplFunc();
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
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, window.scKeynodes['rrel_vertex'], arcSystemIdentifier)
                                .done(dfdNode.resolve)
                                .fail(dfdNode.reject);
                                //add idtf changed 
                            if ((node.text !== '') && (node.text !== null)) {
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
                    var target = edge.source.sc_addr;

                    if (src && target) {
                        window.sctpClient.create_arc(edge.sc_type, src, target).done(function(r){
                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, addrStruct, r).done(function (arcSystemIdentifier){
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, window.scKeynodes['rrel_edge'], arcSystemIdentifier).fail(function() {
                                    console.log("Error while translating Edge");
                                });
                            });
                            edge.setScAddr(r);
                            edge.setObjectState(SCggObjectState.NewInMemory);

                            objects.push(edge);
                            translatedCount++;
                            newxIteration();
                        }).fail(function(){
                                console.log('Error while create edge ???');
                        });
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