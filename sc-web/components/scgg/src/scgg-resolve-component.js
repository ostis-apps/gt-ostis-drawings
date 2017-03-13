SCggResolveComponent = function (params, editor) {
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

    createUI: function () {
        var self = this;
        this.resolveComponent = '#graph-resolve-' + this.container;
        $('#graph-' + this.container).append('<div class="SCggResolve" id="graph-resolve-' + this.container + '"></div>');
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

    addParam : function() {
        var self = this;
        this.paramSize++;
        $(self.getSolveParam()).append($('<div id="param-' + this.paramSize + '">').load('static/components/html/scgg-resolve-param.html', function () {
            self.setParamListener($(this));
            self.setDeleteParam($(this));
            self.chooseForSolveItem["param-" + self.paramSize] = $(this).find('.solve-param');
        }));
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

    setDeleteParam: function (jQueryDiv) {
        var self = this;
        var jQueryDeleteButton = jQueryDiv.find(".delete-param");

        jQueryDeleteButton.click(function () {
            console.log("delete " + jQueryDiv.attr('id'));
            delete self.chooseForSolveItem[jQueryDiv.attr('id')];
            jQueryDiv.remove();
            console.log(self.chooseForSolveItem);
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
                self.scene.setModal(SCgModalMode.SCgModalNone);
                tool.popover('destroy');
            }

            var tool = $(this);
            jQueryInput.attr("disabled", true);
            self.scene.setModal(SCgModalMode.SCggModalSolveMode);
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
        });
    },

    createHtmlUi: function () {
        var self = this;

        this.toolButtonSolve().click(function () {
            if(self.chooseForSolveItem){
                var arg = [];
                arg.push(self.sandbox.addr);
                arg.push(self.chooseForSolveItem.addr);
                var commandState = new SCWeb.core.CommandState(
                    SCggKeynodesHandler.scKeynodes.ui_menu_find_graph_info,
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
            }
        });

        this.toolAddParam().click(function () {
            self.addParam();
        });
    }

};