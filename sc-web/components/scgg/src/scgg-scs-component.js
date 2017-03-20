SCggSCsComponent = function (params, editor) {
    this.activeSCsComponent = null;
    this.storageSCsComponent = {};
    this.sandbox = params.sandbox;
    this.container = params.sandbox.container;
    this.editor = editor;
    this.scsContainer = null;
};

SCggSCsComponent.prototype = {

    constructor: SCggSCsComponent,

    createUI: function () {
        this.scsContainer = '#graph-scs-' + this.container;
        $('#graph-' + this.container).append('<div class="SCggSCs" id="graph-scs-' + this.container + '"></div>');
		
		$("#graph-scs-" + this.container)[0].addEventListener("wheel", function(event) {
        	event.preventDefault ? event.preventDefault() : (event.returnValue = false);
        }); 
    },

    clearStorage: function () {
        this.storageSCsComponent = {};
        this.activeSCsComponent = null;
        if (this.scsContainer){
            $(this.scsContainer).empty();
        }
    },

    hideComponent: function() {
        if (this.activeSCsComponent){
            $('#graph-scs-' + this.container + '_' + this.activeSCsComponent).addClass('hidden');
        }
        this.activeSCsComponent = null;
    },

    showComponent: function(id) {
        this.activeSCsComponent = id;
        $('#graph-scs-' + this.container + '_' + id).removeClass('hidden');
    },

    setNewActive: function (obj) {
        if(!this.storageSCsComponent[obj.id]){
            this.createSCsDiv(obj.id);
            this.storageSCsComponent[obj.id] = obj.sc_addr;
            if (obj instanceof SCgg.ModelNode){
                this.createSCsBlockForVertex(obj.sc_addr, obj.id);
            } else {
                this.createSCsBlockForEdge(obj.sc_addr, obj.id);
            }
        }
        this.hideComponent();
        this.showComponent(obj.id);
    },

    setGraphActive: function () {
        if(!this.storageSCsComponent["graph"]){
            this.createSCsDiv("graph");
            this.storageSCsComponent["graph"] = this.sandbox.addr;
            this.createSCsBlockForGraph();
        }
        this.hideComponent();
        this.showComponent("graph");
    },

    createSCsDiv: function (id) {
        $(this.scsContainer).append('<div id="graph-scs-' + this.container + '_' + id + '"></div>');
    },

    createSCsSandBox: function(answer_addr, id, commandState) {
        var sandboxSCs = new SCWeb.core.ComponentSandbox({
            container: 'graph-scs-' + this.container + '_' + id,
            window_id: 'graph-scs-' + this.container + '_' + id,
            command_state: commandState,
            addr: answer_addr,
            is_struct: false,
            format_addr: SCggKeynodesHandler.scKeynodes.format_scs_json,
            canEdit: true,
            keynodes: SCWeb.core.ComponentManager._keynodes
        });
        SCsComponent.factory(sandboxSCs);
        this.hideSCnEditorButton(id);
    },

    hideSCnEditorButton: function (id) {
        $('#graph-scs-' + this.container + '_' + id + "-new-article-btn").hide();
        $('#graph-scs-' + this.container + '_' + id + "-edit-article-btn").hide();
    },

    createSCsBlockForVertex: function (addr, id) {
        var self = this;
        // TODO change SCWeb.core.Main.default_cmd on addr aget semantic neighborhood for Vertex
        var commandState = new SCWeb.core.CommandState(SCWeb.core.Main.default_cmd, [addr], SCggKeynodesHandler.scKeynodes.format_scs_json);
        SCWeb.core.Main.getTranslatedAnswer(commandState)
            .then(function (answer_addr) {
                self.createSCsSandBox(answer_addr, id, commandState);
            });
    },

    createSCsBlockForEdge: function (addr, id) {
        var self = this;
        // TODO change SCWeb.core.Main.default_cmd on addr aget semantic neighborhood for Edge
        var commandState = new SCWeb.core.CommandState(SCWeb.core.Main.default_cmd, [addr], SCggKeynodesHandler.scKeynodes.format_scs_json);
        SCWeb.core.Main.getTranslatedAnswer(commandState)
            .then(function (answer_addr) {
                self.createSCsSandBox(answer_addr, id, commandState);
            });
    },

    createSCsBlockForGraph: function () {
        var self = this;
        // TODO change SCWeb.core.Main.default_cmd on addr aget semantic neighborhood for Graph
        var commandState = new SCWeb.core.CommandState(SCWeb.core.Main.default_cmd, [this.sandbox.addr], SCggKeynodesHandler.scKeynodes.format_scs_json);
        SCWeb.core.Main.getTranslatedAnswer(commandState)
            .then(function (answer_addr) {
                self.createSCsSandBox(answer_addr, "graph", commandState);
            });
    }

};
