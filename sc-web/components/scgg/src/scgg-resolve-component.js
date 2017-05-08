SCggResolveComponent = function (params, editor) {
    this.paramSizeMax = 5;
    this.sandbox = params.sandbox;
    this.container = params.sandbox.container;
    this.editor = editor;
    this.scene = editor.scene;
    this.resolveComponent = null;
    this.paramSize = 0;
    this.chooseForSolveItem = {};
};

SCggResolveComponent.prototype = {

    constructor: SCggSCsComponent,

    updateUI : function () {
        var self = this;
        $(this.resolveComponent).empty();
        this.paramSize = 0;
        this.chooseForSolveItem = {};
        $(this.resolveComponent).load('static/components/html/scgg-resolve-component.html', function () {
            if (self.editor.resolveControls) {
                self.editor.resolveControls(self.resolveComponent);
            }
            self.setParamListener($(this));
            self.chooseForSolveItem["task"] = $(this).find('.solve-param');;
            self.updateIdtf();
            self.createHtmlUi();
        });
    },

    createUI: function () {
        this.resolveComponent = '#graph-resolve-' + this.container;
        $('#graph-' + this.container).append('<div class="SCggResolve" id="graph-resolve-' + this.container + '"></div>');
        this.updateUI();
    },

    addParam : function() {
        var self = this;
        if (Object.keys(this.chooseForSolveItem).length < this.paramSizeMax) {
            this.paramSize++;
            $(self.getSolveParam()).append($('<div id="param-' + this.paramSize + '">').load('static/components/html/scgg-resolve-param.html', function () {
                self.setParamListener($(this));
                self.setDeleteParam($(this));
                self.chooseForSolveItem["param-" + self.paramSize] = $(this).find('.solve-param');
            }));
        }
    },

    updateIdtf: function (){
        var self = this;
        var keynodes = {
            ui_graph_resolve_choose : SCggKeynodesHandler.scKeynodes.ui_graph_resolve_choose,
            ui_graph_resolve : SCggKeynodesHandler.scKeynodes.ui_graph_resolve,
            ui_graph_resolve_param : SCggKeynodesHandler.scKeynodes.ui_graph_resolve_param
        };
        SCWeb.core.Server.resolveIdentifiers(keynodes, function (idf) {
            self.idtfParamToolTip = idf[keynodes['ui_graph_resolve_choose']];
            for (key in self.chooseForSolveItem){
                var input = self.chooseForSolveItem[key];
                if (!input.attr("sc_addr")){
                    input.val(idf[keynodes['ui_graph_resolve_choose']]);
                }
            }
            self.toolButtonSolve().html(self.getToolButtonImg() + idf[keynodes['ui_graph_resolve']]);
        });
    },

    getToolButtonImg: function () {
        return '<img id="solve-img" src="static/components/images/scgg/tool-solve-task.png"/>'
    },

    toolButtonSolve: function () {
        return $(this.resolveComponent).find('#tool-resolve');
    },

    toolAddParam:function () {
        return $(this.resolveComponent).find('#add-param');
    },

    getSolveParam: function () {
        return $(this.resolveComponent).find('#param');
    },

    getInputSolveParam: function () {
        return $(this.resolveComponent).find('.solve-param');
    },

    getToolRemoveParam: function () {
        return $(this.resolveComponent).find('.delete-param');
    },

    getToolAddParam: function () {
        return $(this.resolveComponent).find('#add-param');
    },

    setDeleteParam: function (jQueryDiv) {
        var self = this;
        var jQueryDeleteButton = jQueryDiv.find(".delete-param");

        jQueryDeleteButton.click(function () {
            delete self.chooseForSolveItem[jQueryDiv.attr('id')];
            jQueryDiv.remove();
        })
    },

    setParamListener: function (jQueryDiv) {
        var self = this;
        var container = this.resolveComponent;
        var jQueryInput = jQueryDiv.find('.solve-param');
        jQueryInput.val(self.idtfParamToolTip);

        jQueryInput.click(function () {

            function stop_modal() {
                jQueryInput.attr("disabled", false);
                self.scene.setModal(SCggModalMode.SCggModalNone);
                tool.popover('destroy');
            }

            var tool = $(this);
            jQueryInput.attr("disabled", true);
            self.scene.setModal(SCggModalMode.SCggModalSolveMode);
            $(this).popover({container: container});
            $(this).popover('show');
            var input = $(container + ' #solve-change-idtf-input');

            // Fix for chrome: http://stackoverflow.com/questions/17384464/jquery-focus-not-working-in-chrome
            setTimeout(function () {
                input.focus();
            }, 1);

            input.keypress(function (e) {
                if (e.keyCode == KeyCode.Escape) {
                    stop_modal();
                    e.preventDefault();
                }
            });

            if (self.editor.autocompletionVariants) {

                var types = {
                    local: function (text) {
                        return "[" + text + "]";
                    },
                    remote: function (text) {
                        return "<" + text + ">";
                    }
                };

                input.typeahead({
                        minLength: 1,
                        highlight: true
                    },
                    {
                        name: 'idtf',
                        source: function (str, callback) {
                            self.editor.autocompletionVariants(str, callback);
                        },
                        displayKey: 'name',
                        templates: {
                            suggestion: function (item) {
                                var decorator = types[item.type];
                                if (decorator)
                                    return decorator(item.name);

                                return item.name;
                            }
                        }
                    }
                ).bind('typeahead:selected', function (evt, item, dataset) {
                    if (item && item.addr) {
                        jQueryInput.val(item.name);
                        jQueryInput.attr("sc_addr", item.addr);
                        stop_modal();
                    }
                    evt.stopPropagation();
                    $('.typeahead').val('');
                });
            }

            $(container + ' #solve-change-idtf-cancel').click(function () {
                stop_modal();
            });

            $(container + ' #solve-get-scaddr-cliker').click(function () {

                stop_modal();
                jQueryInput.addClass('solver-wait-addr');
                self.scene.setModal(SCggModalMode.SCggModalSolveMode);

                var selector = 'body [sc_addr]:not(.sc-window)';
                $(selector).bind('click.getScAddrForGTSolverEvent', function(e) {
                    $(selector).unbind( "click.getScAddrForGTSolverEvent" );
                    var text = $(this).attr('text') || $(this).attr('sc_addr');
                    jQueryInput.val(text);
                    jQueryInput.attr("sc_addr", $(this).attr('sc_addr'));
                    jQueryInput.removeClass('solver-wait-addr');
                    self.scene.setModal(SCggModalMode.SCggModalNone);
                    e.stopPropagation();
                });
            });
        });
    },

    createHtmlUi: function () {
        var self = this;

        this.toolButtonSolve().click(function () {
            if(self.validQuestion()){
                var promis = self.createParamObject();
                promis.then(function (arg) {
                    //SCWeb.core.Main.doDefaultCommand(arg); // see set for solver
                    var commandState = new SCWeb.core.CommandState(
                        SCggKeynodesHandler.scKeynodes.ui_menu_solving_simple_task,
                        arg,
                        SCggKeynodesHandler.scKeynodes.format_scs_json
                    );
                    SCWeb.core.Main.doCommandWithPromise(commandState).then(function (question) {
                        SCWeb.ui.WindowManager.appendHistoryItem(question, commandState);
                        setTimeout(function () {
                            self.editor.scene.clearSelection();
                            self.editor.scsComponent.clearStorage();
                            self.editor.scsComponent.setGraphActive();
                        }, 1000);
                    });
                });
            }
        });

        this.toolAddParam().click(function () {
            self.addParam();
        });
    },

    validQuestion : function () {
        for (key in this.chooseForSolveItem){
            var input = this.chooseForSolveItem[key];
            if (!input.attr("sc_addr")){
                alert(input.val());
                return false;
            }
        }
        return true;
    },

    createParamObject : function () {
        var self = this;
        return new Promise(function(resolve) {
            var argSet = [];
            window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (nodeAddr) {
                argSet.push(nodeAddr);
                var promises = [];
                promises.push(new Promise(function(resolve) {
                    var rrelNo = "rrel_1";
                    var paramAddr = self.sandbox.addr;
                    var attrAddr = SCggKeynodesHandler.scKeynodes[rrelNo];
                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, nodeAddr, paramAddr).done(function (arc) {
                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, attrAddr, arc).done(function () {
                            resolve();
                        }).fail(function () {
                            console.log("Fail in add attr rrel_NO for graph");
                        });
                    }).fail(function () {
                        console.log("Fail in add attr graph in set");
                    });
                }));
                var args = Object.keys(self.chooseForSolveItem);
                args.forEach(function (param, index) {
                    var offset = 2;
                    promises.push(new Promise(function(resolve) {
                        var rrelNo = "rrel_" + (index + offset);
                        var paramAddr = self.chooseForSolveItem[param].attr("sc_addr");
                        var attrAddr = SCggKeynodesHandler.scKeynodes[rrelNo];
                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, nodeAddr, paramAddr).done(function (arc) {
                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, attrAddr, arc).done(function () {
                                resolve();
                            }).fail(function () {
                                console.log("Fail in add attr rrel_NO for param");
                            });
                        }).fail(function () {
                            console.log("Fail in add attr param in set");
                        });
                    }));
                });
                Promise.all(promises).then(function () {
                    resolve(argSet);
                });
            }).fail(function () {
                console.log("Fail in create set param");
            });
        });
    }

};