function SCggFromScImpl(_sandbox, _editor, aMapping) {

    var self = this,
        arcMapping = aMapping,
        tasks = [],
        timeout = 0,
        batch = null,
        tasksLength = 0,
        editor = _editor,
        sandbox = _sandbox;

    const resolveIdtf = async (addr, obj) => {
        if (obj instanceof SCgg.ModelNode) {
            const linkAlias = '_linkAlias';
            const results = await scClient.templateSearch(
                new sc.ScTemplate().tripleWithRelation(
                    new sc.ScAddr(addr),
                    sc.ScType.EdgeDCommonVar,
                    [sc.ScType.LinkVar, linkAlias],
                    sc.ScType.EdgeAccessVarPosPerm,
                    new sc.ScAddr(SCggKeynodesHandler.scKeynodes.nrel_gt_idtf),
                )
            );
            if (results[0]) {
                const content = await scClient.getLinkContents([results[0].get(linkAlias)]);
                obj.setText(content[0].data);
            }
            else {
                //console.log("not find nrel_gt_idtf in SCggFromScImpl");
                // Try set nrel_main_idtf
                sandbox.getIdentifier(addr, idtf => {
                    obj.setText(idtf);
                });
            }
        }
        else if (obj instanceof SCgg.ModelEdge) {
            const linkAlias = '_linkAlias';
            const results = await scClient.templateSearch(
                new sc.ScTemplate().tripleWithRelation(
                    new sc.ScAddr(addr),
                    sc.ScType.EdgeDCommonVar,
                    [sc.ScType.LinkVar, linkAlias],
                    sc.ScType.EdgeAccessVarPosPerm,
                    new sc.ScAddr(SCggKeynodesHandler.scKeynodes.nrel_weight),
                )
            );
            if (results[0]) {
                const content = await scClient.getLinkContents([results[0].get(linkAlias)]);
                obj.setText(content[0].data);
            }
            else {
                // console.log("not find nrel_weight in SCggFromScImpl");
            }
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
                    var containerId = 'scgg-window-' + sandbox.addr + '-' + addr + '-' + new Date().getUTCMilliseconds();
                    var model_link = SCgg.Creator.createLink(randomPos(), containerId);

                    editor.scene.appendLink(model_link);
                    editor.scene.objects[addr] = model_link;
                    model_link.setScAddr(addr);
                    model_link.setObjectState(SCggObjectState.FromMemory);
                }
            }

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

        if (obj) {
            editor.scene.deleteObjects([obj]);
        }

        editor.scene.layout();
    };

    return {
        update: function(added, element, arc) {
            
            if (added) {
                // TODO: What does get_arc do??
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

                if (e) {
                    removeElement(e);
                }
            }
        }
    };
}

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
    
    const appendToConstruction = async obj => {
        const addrAlias = '_addrAlias';
        const construction = new sc.ScConstruction();
        construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(sandbox.addr), obj.sc_addr, addrAlias);
        const result = await scClient.createElements(construction);
        arcMapping[result[0].value] = obj;
    };

    var currentLanguage = sandbox.getCurrentLanguage();
    var translateIdentifier = async function(identifier, scAddr) {
        if (currentLanguage) {
            const linkAlias = '_linkAlias';
            const arcAlias = '_arcAlias';
            const construction = new sc.ScConstruction();
            construction.createLink(sc.ScType.LinkConst, new sc.ScLinkContent(identifier, sc.ScLinkContentType.String), linkAlias);
            construction.createEdge(sc.ScType.EdgeDCommonConst, new sc.ScAddr(scAddr), linkAlias, arcAlias);
            construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(window.scKeynodes.nrel_main_idtf), linkAlias);
            construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(window.scKeynodes.nrel_main_idtf), arcAlias);
            await scClient.createElements(construction);
        }
    };

    const translateGtIdentifier = async obj => {
        const linkAlias = '_linkAlias';
        const arcAlias = '_arcAlias';
        const construction = new sc.ScConstruction();
        construction.createLink(sc.ScType.LinkConst, new sc.ScLinkContent(obj.text, sc.ScLinkContentType.String), linkAlias);
        construction.createEdge(sc.ScType.EdgeDCommonConst, obj.sc_addr, linkAlias, arcAlias);
        construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(SCggKeynodesHandler.scKeynodes.nrel_gt_idtf), arcAlias);
        await scClient.createElements(construction);
    };

    return r = {
        mergedWithMemory: async function (obj) {
            if (!obj.sc_addr)
                throw "Invalid parameter";

            const results = await scClient.templateSearch(
                new sc.ScTemplate().triple(
                    new sc.ScAddr(sandbox.addr),
                    sc.ScType.EdgeAccessVarPosPerm,
                    obj.sc_addr,
                )
            );
            if (!results.length) {
                appendToConstruction(obj);
            }
        },
        updateFromSc: function (added, element, arc) {
            scggFromSc.update(added, element, arc);
        },

        translateToSc: async function (callback) {
            if (!sandbox.is_struct)
                throw "Invalid state. Trying translate sc-link into sc-memory";

            var appendObjects = function () {
                $.when.apply($, objects.map(function (obj) {
                    return appendToConstruction(obj);
                })).done(function () {
                    callback(true);
                }).fail(function () {
                    callback(false);
                });
            };

            function fireCallback() {
                editor.scene.layout();
                appendObjects();
            }

            var addrStruct;
            // editor.scene.comandManager.clear();

            var nodes = editor.scene.nodes.slice();
            var objects = [];


            const translateStruct = async () => {
                console.log('translateStruct');
                const createNodeGraph = async function() {
                    const nodeNewGraphAlias = '_nodeNewGraphAlias';
                    const construction = new sc.ScConstruction();
                    construction.createNode(sc.ScType.NodeConstTuple, nodeNewGraphAlias);
                    construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(SCggKeynodesHandler.scKeynodes.concept_graph), nodeNewGraphAlias);
                    const result = await scClient.createElements(construction);
                    addrStruct = result[0].value;
                };

                const translateTemporalDecomposition = async () => {
                    const graphName = editor.getGraphName();

                    const createDecomposition = async () => {
                        editor.render.sandbox.loadGraph = true;

                        const graphDecompositionAlias = '_graphDecompositionAlias';
                        const graphDecompositionTupleAlias = '_graphDecompositionTupleAlias';
                        const arcTemporalDecompositionAlias = '_arcTemporalDecompositionAlias';

                        const construction = new sc.ScConstruction();

                        construction.createNode(sc.ScType.NodeConst, graphDecompositionAlias);
                        construction.createEdge(
                            sc.ScType.EdgeAccessConstPosPerm,
                            new sc.ScAddr(SCggKeynodesHandler.scKeynodes.concept_graph),
                            graphDecompositionAlias,
                        );
                        construction.createEdge(
                            sc.ScType.EdgeAccessConstPosPerm,
                            new sc.ScAddr(SCggKeynodesHandler.scKeynodes.temporary_entity),
                            graphDecompositionAlias,
                        );
                        construction.createNode(sc.ScType.NodeConstTuple, graphDecompositionTupleAlias);
                        construction.createEdge(
                            sc.ScType.EdgeDCommonConst,
                            graphDecompositionTupleAlias,
                            graphDecompositionAlias,
                            arcTemporalDecompositionAlias,
                        );
                        construction.createEdge(
                            sc.ScType.EdgeAccessConstPosPerm,
                            new sc.ScAddr(SCggKeynodesHandler.scKeynodes.nrel_temporal_decomposition),
                            arcTemporalDecompositionAlias,
                        );

                        if (graphName) {
                            const linkAlias = '_linkAlias';
                            const arcAlias = '_arcAlias';
                            construction.createLink(sc.ScType.LinkConst, new sc.ScLinkContent(graphName, sc.ScLinkContentType.String), linkAlias);
                            construction.createEdge(
                                sc.ScType.EdgeDCommonConst,
                                graphDecompositionAlias,
                                linkAlias,
                                arcAlias,
                            );
                            construction.createEdge(
                                sc.ScType.EdgeAccessConstPosPerm,
                                new sc.ScAddr(window.scKeynodes.nrel_main_idtf),
                                arcAlias,
                            );

                            if (currentLanguage) {
                                construction.createEdge(
                                    sc.ScType.EdgeAccessConstPosPerm,
                                    new sc.ScAddr(currentLanguage),
                                    linkAlias,
                                );
                            }
                        }

                        const result = await scClient.createElements(construction);

                        editor.render.sandbox.decompositionNodeAddr = result[3].value;
                        editor.render.sandbox.graphNodeAddr = result[0].value;
                    };

                    const addCurrentGraph = async graphAddr => {
                        const deleteCurrent = async () => {
                            const toDelete = '_toDelete';
                            const results = await scClient.templateSearch(
                                new sc.ScTemplate().tripleWithRelation(
                                    new sc.ScAddr(editor.render.sandbox.decompositionNodeAddr),
                                    sc.ScType.EdgeAccessVarPosPerm,
                                    sc.ScType.NodeVar,
                                    [sc.ScType.EdgeAccessVarPosPerm, toDelete],
                                    new sc.ScAddr(SCggKeynodesHandler.scKeynodes.rrel_current_version),
                                )
                            );
                            if (!results[0]) return;
                            await scClient.deleteElements([results[0].get(toDelete)]);
                        };

                        const addCurrent = async () => {
                            const arcSysIdtfAlias = '_arcSysIdtfAlias';
                            const construction = new sc.ScConstruction();
                            construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(SCggKeynodesHandler.scKeynodes.temporary_entity), new sc.ScAddr(graphAddr));
                            construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(editor.render.sandbox.decompositionNodeAddr), new sc.ScAddr(graphAddr), arcSysIdtfAlias);
                            construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(SCggKeynodesHandler.scKeynodes.rrel_current_version), arcSysIdtfAlias);
                            await scClient.createElements(construction);
                        };

                        await deleteCurrent();
                        await addCurrent();
                        editor.render.sandbox.addr = graphAddr;
                    };

                    const translateTemporalInclusion = async (firstGraph, secondGraph) => {
                        const prevToCurArcIdtfAlias = '_prevToCurArcIdtfAlias';
                        const construction = new sc.ScConstruction();
                        construction.createEdge(sc.ScType.EdgeDCommonConst, new sc.ScAddr(firstGraph), new sc.ScAddr(secondGraph), prevToCurArcIdtfAlias);
                        construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(SCggKeynodesHandler.scKeynodes.nrel_temporal_inclusion), prevToCurArcIdtfAlias);
                        await scClient.createElements(construction);
                    };

                    if (!editor.render.sandbox.loadGraph) {
                        await createDecomposition();
                        await addCurrentGraph(addrStruct);
                    }
                    else {
                        if (editor.render.sandbox.graphNodeAddr === null) {
                            const toDelete = '_toDelete';
                            const results = await scClient.templateSearch(
                                new sc.ScTemplate().tripleWithRelation(
                                    new sc.ScAddr(editor.render.sandbox.addr),
                                    [sc.ScType.EdgeDCommonVar, toDelete],
                                    sc.ScType.LinkVar,
                                    sc.ScType.EdgeAccessVarPosPerm,
                                    new sc.ScAddr(window.scKeynodes.nrel_main_idtf),
                                )
                            );

                            // NOTE: Do not wait for operation to finish?..
                            scClient.deleteElements(results.map(result => result.get(toDelete)));

                            // NOTE: Possibly run all at once? What are the deps?
                            await createDecomposition();
                            await addCurrentGraph(editor.render.sandbox.addr);
                            await addCurrentGraph(addrStruct);
                            await translateTemporalInclusion(editor.render.sandbox.addr, addrStruct);
                        }
                        else {
                            await addCurrentGraph(addrStruct);
                            await translateTemporalInclusion(editor.render.sandbox.addr, addrStruct);
                        }
                    }
                };

                await createNodeGraph();
                await translateTemporalDecomposition();
            };

            const translateNodes = async () => {
                console.log('translateNodes');

                const implFunc = async node => {
                    const nodeAlias = '_nodeAlias';
                    const arcSystemIdentifierAlias = '_arcSystemIdentifierAlias';
                    const construction = new sc.ScConstruction();
                    construction.createNode(sc.ScType.NodeConst, nodeAlias);
                    construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(addrStruct), nodeAlias, arcSystemIdentifierAlias);
                    construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(SCggKeynodesHandler.scKeynodes.rrel_vertex), arcSystemIdentifierAlias);
                    const result = await scClient.createElements(construction);
                    
                    node.setScAddr(result[0].value);
                    
                    // add idtf changed
                    if (node.text) await translateGtIdentifier(node);
                };

                await Promise.all(nodes.map(node => implFunc(node)));
            };


            const translateEdges = () => new Promise(resolve => {
                console.log('translateEdges');
                const edges = editor.scene.edges.slice();

                const edgesNew = [];
                const translatedCount = 0;

                const doIteration = async () => {
                    const newxIteration = () => {
                        if (edges.length === 0) {
                            if (translatedCount === 0 || (edges.length === 0 && edgesNew.length === 0))
                                resolve();
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

                    const edge = edges.shift();

                    const src = edge.source.sc_addr;
                    const trg = edge.target.sc_addr;
                    const createOrEdge = async (src, target) => {
                        const rAlias = '_rAlias';
                        const arcSystemIdentifierAlias = '_arcSystemIdentifierAlias';
                        const construction = new sc.ScConstruction();
                        construction.createEdge(sc.ScType.EdgeDCommonConst, new sc.ScAddr(src), new sc.ScAddr(target), rAlias);
                        construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(addrStruct), rAlias, arcSystemIdentifierAlias);
                        construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(SCggKeynodesHandler.scKeynodes.rrel_oredge), arcSystemIdentifierAlias);
                        const result = await scClient.createElements(construction);
                        edge.setScAddr(result[0]); // use addr from result instead of alias
                    };

                    const translateWeight = async edge => {
                        if (!edge.text) return;

                        const linkAlias = '_linkAlias';
                        const arcAlias = '_arcAlias';
                        const construction = new sc.ScConstruction();
                        construction.createLink(sc.ScType.LinkConst, new sc.ScLinkContent(edge.text, sc.ScLinkContentType.String), linkAlias);
                        construction.createEdge(sc.ScType.EdgeDCommonConst, new sc.ScAddr(edge.sc_addr), linkAlias, arcAlias);
                        construction.createEdge(sc.ScType.EdgeAccessConstPosPerm, new sc.ScAddr(SCggKeynodesHandler.scKeynodes.nrel_weight), arcAlias);
                        await scClient.createElements(construction);
                    };

                    if (src && trg) {
                        if (edge.sc_type === (sc_type_edge_common | sc_type_const)) {
                            await createOrEdge(trg, src);
                            await translateWeight(edge);
                            await createOrEdge(src, trg);
                            translateWeight(edge);
                            objects.push(edge);
                            newxIteration();
                        }
                        else {
                            await createOrEdge(src, trg)
                            translateWeight(edge);
                            objects.push(edge);
                            newxIteration();
                        }
                    }
                    else {
                        edgesNew.push(edge);
                        newxIteration();
                    }
                }

                if (edges.length > 0) window.setTimeout(doIteration, 0);
            });
            await translateStruct();
            await translateNodes();
            await translateEdges();
            fireCallback();
        }

    };
}
