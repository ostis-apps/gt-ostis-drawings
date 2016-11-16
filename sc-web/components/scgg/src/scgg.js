var SCgg = SCgg || {version: "0.1.0"};

SCgg.Editor = function () {
    this.render = null;
    this.scene = null;
};

SCgg.Editor.prototype = {
    init: function (params) {
        this.typesMap = {
            'scgg-type-node': sc_type_node,
            'scgg-type-node-const': sc_type_node | sc_type_const,
            'scgg-type-node-const-group': sc_type_node | sc_type_const | sc_type_node_class,
            'scgg-type-node-const-abstract': sc_type_node | sc_type_const | sc_type_node_abstract,
            'scgg-type-node-const-material': sc_type_node | sc_type_const | sc_type_node_material,
            'scgg-type-node-const-norole': sc_type_node | sc_type_const | sc_type_node_norole,
            'scgg-type-node-const-role': sc_type_node | sc_type_const | sc_type_node_role,
            'scgg-type-node-const-struct': sc_type_node | sc_type_const | sc_type_node_struct,
            'scgg-type-node-const-tuple': sc_type_node | sc_type_const | sc_type_node_tuple,
            'scgg-type-node-var': sc_type_node | sc_type_var,
            'scgg-type-node-var-group': sc_type_node | sc_type_var | sc_type_node_class,
            'scgg-type-node-var-abstract': sc_type_node | sc_type_var | sc_type_node_abstract,
            'scgg-type-node-var-material': sc_type_node | sc_type_var | sc_type_node_material,
            'scgg-type-node-var-norole': sc_type_node | sc_type_var | sc_type_node_norole,
            'scgg-type-node-var-role': sc_type_node | sc_type_var | sc_type_node_role,
            'scgg-type-node-var-struct': sc_type_node | sc_type_var | sc_type_node_struct,
            'scgg-type-node-var-tuple': sc_type_node | sc_type_var | sc_type_node_tuple,
            'scgg-type-edge-common': sc_type_edge_common,
            'scgg-type-arc-common': sc_type_arc_common,
            'scgg-type-arc-common-access': sc_type_arc_access,
            'scgg-type-edge-const': sc_type_edge_common | sc_type_const,
            'scgg-type-arc-const': sc_type_arc_common | sc_type_const,
            'scgg-type-arc-const-perm-pos-access': sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_perm,
            'scgg-type-arc-const-perm-neg-access': sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_perm,
            'scgg-type-arc-const-perm-fuz-access': sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_perm,
            'scgg-type-arc-const-temp-pos-access': sc_type_arc_access | sc_type_const | sc_type_arc_pos | sc_type_arc_temp,
            'scgg-type-arc-const-temp-neg-access': sc_type_arc_access | sc_type_const | sc_type_arc_neg | sc_type_arc_temp,
            'scgg-type-arc-const-temp-fuz-access': sc_type_arc_access | sc_type_const | sc_type_arc_fuz | sc_type_arc_temp,
            'scgg-type-edge-var': sc_type_edge_common | sc_type_var,
            'scgg-type-arc-var': sc_type_arc_common | sc_type_var,
            'scgg-type-arc-var-perm-pos-access': sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_perm,
            'scgg-type-arc-var-perm-neg-access': sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_perm,
            'scgg-type-arc-var-perm-fuz-access': sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_perm,
            'scgg-type-arc-var-temp-pos-access': sc_type_arc_access | sc_type_var | sc_type_arc_pos | sc_type_arc_temp,
            'scgg-type-arc-var-temp-neg-access': sc_type_arc_access | sc_type_var | sc_type_arc_neg | sc_type_arc_temp,
            'scgg-type-arc-var-temp-fuz-access': sc_type_arc_access | sc_type_var | sc_type_arc_fuz | sc_type_arc_temp
        };

        this.render = new SCgg.Render();
        this.scene = new SCgg.Scene( {render: this.render , edit: this} );
        this.scene.init();
        this.render.scene = this.scene;
        this.render.init(params);
        this.scsComponent = new SCggSCsComponent(params, this);
        this.containerId = "graph-" + params.containerId;

        if (params.sandbox.loadGraph)
            this.scsComponent.setGraphActive();
        if (params.autocompletionVariants)
            this.autocompletionVariants = params.autocompletionVariants;
        if (params.translateToSc)
            this.translateToSc = params.translateToSc;
        if (params.resolveControls)
            this.resolveControls = params.resolveControls;

        this.canEdit = params.canEdit ? true : false;
        this.initUI();
    },
    
    /**
     * Initialize user interface
     */
    initUI: function() {
        var self = this;
        var container = '#' + self.containerId;
        var tools_container = '#tools-' + self.containerId;
        var graph_name = '#graph-name-' + self.containerId;

        $(container).prepend('<div id="tools-' + self.containerId + '"></div>');
        $(container).prepend('<div id="graph-name-' + self.containerId + '"></div>');

        $(tools_container).load('static/components/html/scgg-tools-panel.html', function() {
             $.ajax({
                    url: "static/components/html/scgg-types-panel-nodes.html", 
                    dataType: 'html',
                    success: function(response) {
                           self.node_types_panel_content = response;
                    },
                    error: function() {
                        SCggDebug.error("Error to get nodes type change panel");
                    },
                    complete: function() {
                        $.ajax({
                                url: "static/components/html/scgg-types-panel-edges.html", 
                                dataType: 'html',
                                success: function(response) {
                                       self.edge_types_panel_content = response;
                                },
                                error: function() {
                                        SCggDebug.error("Error to get edges type change panel");
                                },
                                complete: function() {
                                    self.bindToolEvents();
                                }
                            });
                    }
                });
            if (!self.canEdit) {
                self.hideTool(self.toolEdge());
                self.hideTool(self.toolOpen());
                self.hideTool(self.toolSave());
                self.hideTool(self.toolIntegrate());
                self.hideTool(self.toolUndo());
                self.hideTool(self.toolRedo());
            }

            if (self.resolveControls) {
                self.resolveControls(tools_container);
            }
        });

        $(graph_name).load('static/components/html/scgg-graph-name-input.html', function() {
            self.bindGraphNameEvents();
            self.updateGraphName();

            if (self.resolveControls){
                self.resolveControls(graph_name);
            }
        });

        this.scene.event_selection_changed = function() {
            self.onSelectionChanged();
        };

        this.scene.event_modal_changed = function() {
            self.onModalChanged();
        };

        this.keyboardCallbacks = {
            'onkeydown': function(event) {
                self.scene.onKeyDown(event)
            },
            'onkeyup': function(event){
                self.scene.onKeyUp(event);
            }
        };

        this.openComponentCallbacks = function () {
            self.render.requestUpdateAll();
        }
    },
    
    hideTool: function(tool) {
        tool.addClass('hidden');
    },
    
    showTool: function(tool) {
        tool.removeClass('hidden');
    },

    toggleTool: function(tool) {
        tool.toggleClass('hidden');
    },
    
    tool: function(name) {
        return $('#' + this.containerId).find('#scgg-tool-' + name);
    },
    
    toolSelect: function() {
        return this.tool('select');
    },
    
    toolEdge: function() {
        return this.tool('edge');
    },

    toolUndo: function() {
        return this.tool('undo');
    },

    toolRedo: function() {
        return this.tool('redo');
    },
    
    toolChangeIdtf: function() {
        return this.tool('change-idtf');
    },
    
    toolChangeType: function() {
        return this.tool('change-type');
    },
    
    toolDelete: function() {
        return this.tool('delete');
    },

    toolClear: function() {
        return this.tool('clear');
    },
    
    toolIntegrate: function() {
        return this.tool('integrate');
    },
    
    toolOpen: function() {
        return this.tool('open');
    },

    toolSave: function() {
        return this.tool('save');
    },
    
    toolZoomIn: function() {
        return this.tool('zoomin');
    },
    
    toolZoomOut: function() {
        return this.tool('zoomout');
    },

    bindGraphNameEvents: function() {
        var self = this;
        var containerId = self.containerId;
        var graphNameInput = $('#graph-name-' + containerId + ' input');
        var graphNameButton = $('#graph-name-' + containerId + ' button');
        var nameInputHelper = $('#graph-name-' + containerId + ' .input-helper');

        graphNameButton.click(function() {
            self.showGraphActive();

            if (self.isEditGraphName() && self.checkGraphNameLength()) {
                self.toggleGraphName(true);
                self.updateGraphNameBackLight();
            } else {
                self.toggleGraphName(false);
                self.updateGraphNameBackLight();
            }
        });

        graphNameInput.keyup(function() {
            self.updateGraphNameBackLight()
        });

        nameInputHelper.click(function() {
            if (!self.isEditGraphName()) {
                self.showGraphActive();
            }
        });
    },

    showGraphActive: function() {
        this.scene.clearSelection();
        if (this.scene.render.sandbox.loadGraph) {
            this.scsComponent.setGraphActive();
        }
    },

    updateGraphNameBackLight: function() {
        var isNameRight = this.checkGraphNameLength();
        var containerId = this.containerId;
        var graphNameInput = $('#graph-name-' + containerId + ' input');

        graphNameInput.toggleClass('correct-name', isNameRight && this.isEditGraphName());
        graphNameInput.toggleClass('incorrect-name', !isNameRight && this.isEditGraphName());
    },

    toggleGraphName: function(toggler) {
        var containerId = this.containerId;
        var graphNameInput = $('#graph-name-' + containerId + ' input');
        var nameInputHelper = $('#graph-name-' + containerId + ' .input-helper');
        var graphNameButton = $('#graph-name-' + containerId + ' button');

        graphNameButton.find('.button-img-edit').prop('hidden', !toggler);
        graphNameButton.find('.button-img-save').prop('hidden', toggler);
        graphNameInput.prop('disabled', toggler);
        nameInputHelper.prop('hidden', !toggler);
    },

    isEditGraphName: function() {
        var containerId = this.containerId;
        var graphNameInput = $('#graph-name-' + containerId + ' input');

        return $(graphNameInput).prop('disabled') == false
    },

    checkGraphNameLength: function() {
        var containerId = this.containerId;
        var graphNameInput = $('#graph-name-' + containerId + ' input');

        return graphNameInput.val().length > 2
    },

    /**
     * Bind events to panel tools
     */
    bindToolEvents: function() {
        var self = this;
        var container = '#' + this.containerId;
        var cont = $(container);
        var select = this.toolSelect();

        select.button('toggle');

        select.click(function() {
            self.scene.setEditMode(SCggEditMode.SCggModeSelect);
        });

        this.toolEdge().click(function() {
            self.scene.setEditMode(SCggEditMode.SCggModeEdge);
        });

        this.toolEdge().dblclick(function() {
            self.scene.setModal(SCggModalMode.SCggModalType);
            self.onModalChanged();
            var tool = $(this);

            function stop_modal() {
                tool.popover('destroy');
                self.scene.setEditMode(SCggEditMode.SCggModeEdge);
                self.scene.setModal(SCggModalMode.SCggModalNone);
            }
            el = $(this);
            el.popover({
                content: self.edge_types_panel_content,
                container: container,
                title: 'Change type',
                html: true,
                delay: {show: 500, hide: 100}
            }).popover('show');

            cont.find('.popover-title').append('<button id="scgg-type-close" type="button" class="close">&times;</button>');
            $(container + ' #scgg-type-close').click(function() {
                stop_modal();
            });
            $(container + ' .popover .btn').click(function() {
                SCggTypeEdgeNow = self.typesMap[$(this).attr('id')];
                stop_modal();
            });   
        });

        this.toolUndo().click(function() {
            self.scene.commandManager.undo();
            self.scene.updateRender();
        });

        this.toolRedo().click(function() {
            self.scene.commandManager.redo();
            self.scene.updateRender();
        });

        this.toolChangeIdtf().click(function() {
            self.scene.setModal(SCggModalMode.SCggModalIdtf);
            $(this).popover({container: container});
            $(this).popover('show');
            
            var tool = $(this);
            
            function stop_modal() {
                self.scene.setModal(SCggModalMode.SCggModalNone);
                tool.popover('destroy');
                self.scene.updateObjectsVisual();
            }
            
            var input = $(container + ' #scgg-change-idtf-input');
            // setup initial value
            input.val(self.scene.selected_objects[0].text);
            
            // Fix for chrome: http://stackoverflow.com/questions/17384464/jquery-focus-not-working-in-chrome
            setTimeout(function(){
                input.focus();
            }, 1);

            input.keypress(function (e) {
                if (e.keyCode == KeyCode.Enter || e.keyCode == KeyCode.Escape) {
                    if (e.keyCode == KeyCode.Enter) {
                        var obj = self.scene.selected_objects[0];

                        if (obj.text != input.val()){
                            if(obj instanceof SCgg.ModelEdge){
                                if(!isNaN(parseFloat(input.val())) && isFinite(input.val()))
                                    self.scene.commandManager.execute(new SCggCommandChangeIdtf(obj, input.val()));
                                else
                                    self.scene.commandManager.execute(new SCggCommandChangeIdtf(obj, ""));
                            }
                            else
                                self.scene.commandManager.execute(new SCggCommandChangeIdtf(obj, input.val()));
                        }
                    }
                    stop_modal();
                    e.preventDefault();
                }
            });

            // process controls
            $(container + ' #scgg-change-idtf-apply').click(function() {
                var obj = self.scene.selected_objects[0];

                if (obj.text != input.val() && !self._idtf_item) {
                    if(obj instanceof SCgg.ModelEdge){
                        if(!isNaN(parseFloat(input.val())) && isFinite(input.val()))
                            self.scene.commandManager.execute(new SCggCommandChangeIdtf(obj, input.val()));
                        else
                            self.scene.commandManager.execute(new SCggCommandChangeIdtf(obj, ""));
                    }
                    else
                        self.scene.commandManager.execute(new SCggCommandChangeIdtf(obj, input.val()));
                }

                if (self._idtf_item) {
                    window.sctpClient.get_element_type(self._idtf_item.addr).done(function (t) {
                        self.scene.commandManager.execute(new SCggCommandGetNodeFromMemory(obj,
                            t,
                            input.val(),
                            self._idtf_item.addr,
                            self.scene));
                        stop_modal();
                    });
                } else
                    stop_modal();
            });
            $(container + ' #scgg-change-idtf-cancel').click(function() {
                stop_modal();
            });
            
        });
        
        this.toolChangeType().click(function() {
            var tool = $(this);

            self.scene.setModal(SCggModalMode.SCggModalType);

            function stop_modal() {
                self.scene.setModal(SCggModalMode.SCggModalNone);
                tool.popover('destroy');
                self.scene.event_selection_changed();
                self.scene.updateObjectsVisual();
            }
            
            var obj = self.scene.selected_objects[0];

            el = $(this);
            el.popover({
                    content: (obj instanceof SCgg.ModelEdge) ? self.edge_types_panel_content : self.node_types_panel_content,
                    container: container,
                    title: 'Change type',
                    html: true,
                    delay: {show: 500, hide: 100}
                  }).popover('show');
                  
            cont.find('.popover-title').append('<button id="scgg-type-close" type="button" class="close">&times;</button>');
                  
            $(container + ' #scgg-type-close').click(function() {
                stop_modal();
            });

            $(container + ' .popover .btn').click(function() {
                var newType = self.typesMap[$(this).attr('id')];
                var command = [];
                self.scene.selected_objects.forEach(function(obj){
                if (obj.sc_type != newType){
                    command.push(new SCggCommandChangeType(obj, newType));
                }});
                self.scene.commandManager.execute(new SCggWrapperCommand(command));
                self.scene.updateObjectsVisual();
                stop_modal();
            });
        });

        this.toolDelete().click(function() {
            if (self.scene.selected_objects.length > 0){
                self.scene.deleteObjects(self.scene.selected_objects.slice(0, self.scene.selected_objects.length));
                self.scene.clearSelection();
            }
        });
        
        this.toolClear().click(function() {
            self.scene.selectAll();
            self.toolDelete().click();
        });

        this.toolOpen().click(function() {
            var document = $(this)[0].ownerDocument;
            var open_dialog = document.getElementById("scgg-tool-open-dialog");
            self.scene.clearSelection();
            open_dialog.onchange = function(){
                return GwfgFileLoader.load({
                    file: open_dialog.files[0],
                    render : self.render});

            };
            SCggObjectBuilder.scene = self.scene;
            open_dialog.click();
        });

        this.toolSave().click(function() {
            var blob = new Blob([GwfgFileCreate.createFile(self.scene)], {
                type : "text/plain;charset=utf-8"
            });
            saveAs(blob, "new_file.gwf");
        });
        
        this.toolIntegrate().click(function() {
            self.scsComponent.clearStorage();
            self._disableTool(self.toolIntegrate());
            if (self.translateToSc)
                self.translateToSc(self.scene, function() {
                    self._enableTool(self.toolIntegrate());
                });
        });
        
        this.toolZoomIn().click(function() {
            self.render.changeScale(1.1);
        });
        
        this.toolZoomOut().click(function() {
            self.render.changeScale(0.9);
        });

        // initial update
        self.onModalChanged();
        self.onSelectionChanged();
    },
    
    /**
     * Function that process selection changes in scene
     // * It updated UI to current selection
     */
    onSelectionChanged: function() {

        if (this.canEdit) {
            this.hideTool(this.toolChangeIdtf());
            //scg this.hideTool(this.toolSetContent());
            this.hideTool(this.toolChangeType());
            this.hideTool(this.toolDelete());
            if (this.scene.selected_objects.length > 1) {
                if (this.scene.isSelectedObjectAllArcsOrAllNodes() && this.scene.selected_objects[0] instanceof SCgg.ModelEdge) {
                    this.showTool(this.toolChangeType());
                }
            } else if (this.scene.selected_objects.length == 1) {
                if (this.scene.selected_objects[0] instanceof SCgg.ModelNode) {
                    this.showTool(this.toolChangeIdtf());
                    //scg this.showTool(this.toolChangeType());
                } else if (this.scene.selected_objects[0] instanceof SCgg.ModelEdge) {
                    this.showTool(this.toolChangeIdtf());
                    this.showTool(this.toolChangeType());
                }
            }
            if (this.scene.selected_objects.length > 0) this.showTool(this.toolDelete());
        }
    },

    /**
     * Function, that process modal state changes of scene
     */
    onModalChanged: function() {
        var self = this;
        function update_tool(tool) {
            if (self.scene.modal != SCggModalMode.SCggModalNone)
                self._disableTool(tool);
            else
                self._enableTool(tool);
        }
        update_tool(this.toolSelect());
        update_tool(this.toolEdge());
        update_tool(this.toolUndo());
        update_tool(this.toolRedo());
        update_tool(this.toolChangeIdtf());
        update_tool(this.toolChangeType());
        update_tool(this.toolDelete());
        update_tool(this.toolClear());
        update_tool(this.toolZoomIn());
        update_tool(this.toolZoomOut());
        update_tool(this.toolIntegrate());
        update_tool(this.toolOpen());
    },

    collectIdtfs : function(keyword){
        var self = this;
        var selected_obj = self.scene.selected_objects[0];
        var relative_objs = undefined;

        if(selected_obj instanceof SCgg.ModelNode){
            relative_objs = self.scene.nodes;
        }
        if(!relative_objs)
            return [];

        var match = function(text){
            var pattern = new RegExp(keyword, 'i');

            return text && pattern.test(text);
        };

        var contains = function(value, array){
            var len = array.length;
            while(len--){
                if(array[len].name === value.name)
                    return true
            }
            return false;
        };

        var matches = [];

        $.each(relative_objs, function(index, item){
            if(match(item['text'])) {
                var obj = {name: item['text'], type: 'local'};

                if(!contains(obj, matches)) {
                    matches.push(obj);
                }
            }
        });
        return matches;
    },

    /**
     * function(keyword, callback, args)
     * here is default implementation
     * */
    autocompletionVariants : function(keyword, callback, args){
        var self = this;
        callback(self.collectIdtfs(keyword));
    },

    // -------------------------------- Helpers ------------------
    /**
     * Change specified tool state to disabled
     */
    _disableTool: function(tool) {
        tool.attr('disabled', 'disabled');
    },

    /**
     * Change specified tool state to enabled
     */
    _enableTool: function(tool) {
         tool.removeAttr('disabled');
    },

    getGraphName: function() {
        var self = this;
        var containerId = self.containerId;
        var inputSelector = '#graph-name-' + containerId + ' input';

        return $(inputSelector).val();
    },

    updateGraphName: function() {
        var self = this;
        var sandbox = self.render.sandbox;
        var containerId = self.render.containerId;
        var inputSelector = '#graph-name-' + containerId + ' input';
        var nameAddr = sandbox.graphNodeAddr ? sandbox.graphNodeAddr : sandbox.addr;

        if (sandbox.loadGraph){
            window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_5F_A_A_A_F,
                [   nameAddr,
                    sc_type_arc_common | sc_type_const,
                    sc_type_link,
                    sc_type_arc_pos_const_perm,
                    window.scKeynodes.nrel_main_idtf
                ]
            ).done(function(results) {
                window.sctpClient.get_link_content(results[0][2],'string').done(function(content) {
                    $(inputSelector).val(content);
                });
            }).fail(function() {
                // console.log("not find nrel_main_idtf");
                $(inputSelector).val('');
            }).always(function() {
                self.setPlaceholder(inputSelector);
            })
        } else {
            self.setPlaceholder(inputSelector);
        }
    },

    setPlaceholder: function(graphNameSelector) {
        SCWeb.core.Server.resolveScAddr(['ui_graph_name'], function (keynodes) {
            SCWeb.core.Server.resolveIdentifiers(keynodes, function (idf) {
                $(graphNameSelector).attr('placeholder', idf[keynodes['ui_graph_name']]);
            });
        });
    }
};
