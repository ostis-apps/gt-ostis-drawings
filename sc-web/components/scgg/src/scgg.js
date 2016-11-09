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
        
        this.containerId = "graph-" + params.containerId;

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
        var container = '#' + this.containerId;
        $(container).prepend('<div id="tools-' + this.containerId + '"></div>');
        var tools_container = '#tools-' + this.containerId;
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
                //scg self.hideTool(self.toolBus());
                //scg self.hideTool(self.toolContour());
                self.hideTool(self.toolOpen());
                self.hideTool(self.toolSave());
                self.hideTool(self.toolIntegrate());
                self.hideTool(self.toolUndo());
                self.hideTool(self.toolRedo());
            }
            if (self.resolveControls)
                self.resolveControls(tools_container);
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

    //scg toolSwitch: function() {
    //scg    return this.tool('switch');
    //scg },
    
    toolSelect: function() {
        return this.tool('select');
    },
    
    toolEdge: function() {
        return this.tool('edge');
    },

    //scg toolBus: function() {
    //scg     return this.tool('bus');
    //scg },
    //scg
    //scg toolContour: function() {
    //scg     return this.tool('contour');
    //scg },
    //scg
    //scg toolLink: function() {
    //scg     return this.tool('link');
    //scg },

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

    //scg toolSetContent: function() {
    //scg     return this.tool('set-content');
    //scg },
    
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
    
    /**
     * Bind events to panel tools
     */
    bindToolEvents: function() {
        
        var self = this;
        var container = '#' + this.containerId;
        var cont = $(container);
            
        var select = this.toolSelect();
        select.button('toggle');
        
        // handle clicks on mode change
        //scg this.toolSwitch().click(function() {
        //scg     self.canEdit = !self.canEdit;
        //scg     var tools = [self.toolEdge(),
        //scg                 self.toolContour(),
        //scg                 self.toolBus(),
        //scg                 self.toolUndo(),
        //scg                 self.toolRedo(),
        //scg                 self.toolDelete(),
        //scg                 self.toolClear(),
        //scg                 self.toolOpen(),
        //scg                 self.toolSave(),
        //scg                 self.toolIntegrate()];
        //scg     for (var button = 0 ; button < tools.length ; button++){
        //scg         self.toggleTool(tools[button]);
        //scg     }
        //scg     self.hideTool(self.toolChangeIdtf());
        //scg     self.hideTool(self.toolSetContent());
        //scg     self.hideTool(self.toolChangeType());
        //scg     self.hideTool(self.toolDelete());
        //scg });
        select.click(function() {
            self.scene.setEditMode(SCggEditMode.SCggModeSelect);
        });
        //scg select.dblclick(function() {
        //scg     self.scene.setModal(SCggModalMode.SCggModalType);
        //scg     self.onModalChanged();
        //scg     var tool = $(this);
        //scg     function stop_modal() {
        //scg         tool.popover('destroy');
        //scg         self.scene.setEditMode(SCggEditMode.SCggModeSelect);
        //scg         self.scene.setModal(SCggModalMode.SCggModalNone);
        //scg     }
        //scg     el = $(this);
        //scg     el.popover({
        //scg         content: self.node_types_panel_content,
        //scg         container: container,
        //scg         title: 'Change type',
        //scg         html: true,
        //scg         delay: {show: 500, hide: 100}
        //scg     }).popover('show');
        //scg     cont.find('.popover-title').append('<button id="scgg-type-close" type="button" class="close">&times;</button>');
        //scg     $(container + ' #scgg-type-close').click(function() {
        //scg         stop_modal();
        //scg     });
        //scg     $(container + ' .popover .btn').click(function() {
        //scg         SCggTypeNodeNow = self.typesMap[$(this).attr('id')];
        //scg         stop_modal();
        //scg     });
        //scg });
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
        //scg this.toolBus().click(function() {
        //scg     self.scene.setEditMode(SCggEditMode.SCggModeBus);
        //scg });
        //scg this.toolContour().click(function() {
        //scg    self.scene.setEditMode(SCggEditMode.SCggModeContour);
        //scg });
        //scg this.toolLink().click(function() {
        //scg     self.scene.setEditMode(SCggEditMode.SCggModeLink);
        //scg });
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

            if (self.autocompletionVariants) {
                var types = {
                    local : function(text){
                        return "[" + text + "]";
                    },
                    remote : function(text){
                        return "<" + text + ">";
                    }

                };

                input.typeahead({
                        minLength: 1,
                        highlight: true
                    },
                    {
                        name: 'idtf',
                        source: function(str, callback) {
                            self._idtf_item = null;
                            self.autocompletionVariants(str, callback, { editor: self });
                        },
                        displayKey: 'name',
                        templates: {
                            suggestion : function(item){
                                var decorator = types[item.type];
                                if(decorator)
                                    return decorator(item.name);

                                return item.name;
                            }
                        }
                    }
                ).bind('typeahead:selected', function(evt, item, dataset) {
                    if (item && item.addr) {
                        self._idtf_item = item;
                    }
                    evt.stopPropagation();
                    $('.typeahead').val('');
                });
            }
            
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
            self.scene.setModal(SCggModalMode.SCggModalType);

            var tool = $(this);
            
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


        //scg this.toolSetContent().click(function() {
        //scg     var tool = $(this);
        //scg     function stop_modal() {
        //scg         self.scene.setModal(SCggModalMode.SCggModalNone);
        //scg         tool.popover('destroy');
        //scg         self.scene.updateObjectsVisual();
        //scg     }
        //scg
        //scg     self.scene.setModal(SCggModalMode.SCggModalIdtf);
        //scg     $(this).popover({container: container});
        //scg     $(this).popover('show');
        //scg
        //scg     var input = $(container + ' #scgg-set-content-input');
        //scg     var input_content = $(container + " input#content[type='file']");
        //scg     var input_content_type = $(container + " #scgg-set-content-type");
        //scg     input.val(self.scene.selected_objects[0].content);
        //scg     input_content_type.val(self.scene.selected_objects[0].contentType);
        //scg     setTimeout(function(){
        //scg         input.focus();
        //scg     }, 1);
        //scg     input.keypress(function (e) {
        //scg         if (e.keyCode == KeyCode.Enter || e.keyCode == KeyCode.Escape) {
        //scg             if (e.keyCode == KeyCode.Enter) {
        //scg                 var obj = self.scene.selected_objects[0];
        //scg                 if (obj.content != input.val() || obj.contentType != input_content_type.val()) {
        //scg                     self.scene.commandManager.execute(new SCggCommandChangeContent(obj,
        //scg                         input.val(),
        //scg                         input_content_type.val()));
        //scg                 }
        //scg             }
        //scg             stop_modal();
        //scg             e.preventDefault();
        //scg         }
        //scg     });
        //scg     // process controls
        //scg     $(container + ' #scgg-set-content-apply').click(function() {
        //scg         var obj = self.scene.selected_objects[0];
        //scg         var file = input_content[0].files[0];
        //scg         if (file != undefined){
        //scg             var fileReader = new FileReader();
        //scg             fileReader.onload = function() {
        //scg                 if (obj.content != this.result || obj.contentType != 'string') {
        //scg                     self.scene.commandManager.execute(new SCggCommandChangeContent(obj,
        //scg                         this.result,
        //scg                         'string'));
        //scg                 }
        //scg                 stop_modal();
        //scg             };
        //scg             fileReader.readAsArrayBuffer(file);
        //scg         } else {
        //scg             if (obj.content != input.val() || obj.contentType != input_content_type.val()) {
        //scg                 self.scene.commandManager.execute(new SCggCommandChangeContent(obj,
        //scg                     input.val(),
        //scg                     input_content_type.val()));
        //scg             }
        //scg             stop_modal();
        //scg         }
        //scg     });
        //scg     $(container + ' #scgg-set-content-cancel').click(function() {
        //scg         stop_modal();
        //scg     });
        //scg });

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
                return GwfFileLoader.load({
                    file: open_dialog.files[0],
                    render : self.render});

            }
            SCggObjectBuilder.scene = self.scene;
            var result = open_dialog.click();
        });

        this.toolSave().click(function() {
            var blob = new Blob([GwfFileCreate.createFile(self.scene)], {
                type : "text/plain;charset=utf-8"
            });
            saveAs(blob, "new_file.gwf");
        });
        
        this.toolIntegrate().click(function() {
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
                if (this.scene.isSelectedObjectAllArcsOrAllNodes() && !this.scene.isSelectedObjectAllHaveScAddr()) {
                    this.showTool(this.toolChangeType());
                }
            } else if (this.scene.selected_objects.length == 1 && !this.scene.selected_objects[0].sc_addr) {
                if (this.scene.selected_objects[0] instanceof SCgg.ModelNode) {
                    this.showTool(this.toolChangeIdtf());
                    //scg this.showTool(this.toolChangeType());
                } else if (this.scene.selected_objects[0] instanceof SCgg.ModelEdge) {
                    this.showTool(this.toolChangeIdtf());
                    this.showTool(this.toolChangeType());
                }//scg  else if (this.scene.selected_objects[0] instanceof SCgg.ModelContour) {
                 //scg    this.showTool(this.toolChangeIdtf());
                 //scg }  else if (this.scene.selected_objects[0] instanceof SCgg.ModelLink) {
                 //scg    this.showTool(this.toolSetContent());
                 //scg }
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
        //scg update_tool(this.toolSwitch());
        update_tool(this.toolSelect());
        update_tool(this.toolEdge());
        //scg update_tool(this.toolBus());
        //scg update_tool(this.toolContour());
        //scg update_tool(this.toolLink());
        update_tool(this.toolUndo());
        update_tool(this.toolRedo());
        update_tool(this.toolChangeIdtf());
        update_tool(this.toolChangeType());
        //scg update_tool(this.toolSetContent());
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
            if(text && pattern.test(text))
                return true;
            return false;
        }

        var contains = function(value, array){
            var len = array.length;
            while(len--){
                if(array[len].name === value.name)
                    return true
            }
            return false;
        }
        var matches = [];
        $.each(relative_objs, function(index, item){
            if(match(item['text']))
            {
                var obj = {
                    name: item['text'],
                    type: 'local'
                }
                if(!contains(obj, matches))
                    matches.push(obj);
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
    }
};
