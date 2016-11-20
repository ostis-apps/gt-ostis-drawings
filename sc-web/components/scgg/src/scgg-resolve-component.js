SCggResolveComponent = function (params, editor) {
    this.sandbox = params.sandbox;
    this.container = params.sandbox.container;
    this.editor = editor;
    this.scene = editor.scene;
    this.resolveComponent = null;
    this.chooseForSolveItem = null;
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
            self.updateIdtf();
            self.createHtmlUi();
        });
    },

    updateIdtf: function (){
        var self = this;
        SCWeb.core.Server.resolveScAddr(['ui_graph_resolve_choose', 'ui_graph_resolve'], function (keynodes) {
            SCWeb.core.Server.resolveIdentifiers(keynodes, function (idf) {
                if (!self.chooseForSolveItem){
                    self.getInputSolveParam().val(idf[keynodes['ui_graph_resolve_choose']]);
                }
                self.toolButtonSolve().html(self.getToolButtonImg() + idf[keynodes['ui_graph_resolve']]);
            });
        });
    },

    getToolButtonImg: function () {
        return '<img id="solve-img" src="static/components/images/scgg/tool-solve-task.png"/>'
    },

    toolButtonSolve: function () {
        return $(this.resolveComponent).find('#tool-resolve');
    },

    getInputSolveParam: function () {
        return $(this.resolveComponent).find('#solve-param');
    },

    createHtmlUi: function () {
        var self = this;
        var container = this.resolveComponent;

        this.getInputSolveParam().click(function () {

            function stop_modal() {
                self.getInputSolveParam().attr("disabled", false);
                self.scene.setModal(SCgModalMode.SCgModalNone);
                tool.popover('destroy');
            }

            var tool = $(this);
            self.getInputSolveParam().attr("disabled", true);
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
                        self.chooseForSolveItem = item;
                        self.getInputSolveParam().val(item.name);
                        self.getInputSolveParam().attr("sc_addr", item.addr);
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
    }

};