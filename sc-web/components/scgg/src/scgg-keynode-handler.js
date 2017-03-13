SCggKeynodesHandler = {

    systemIds: [
        'format_scs_json',
        'nrel_gt_idtf',
        'concept_graph',
        'nrel_weight',
        'sc_garbage',
        'nrel_temporal_decomposition',
        'nrel_temporal_inclusion',
        'rrel_current_version',
        'rrel_vertex',
        'rrel_oredge',
        'temporary_entity',
        'ui_menu_find_graph_info',
        'ui_graph_resolve_choose',
        'ui_graph_resolve',
        'ui_graph_resolve_param'
    ],

    scKeynodes: {},

    load: false,

    initSystemIds : function (callback){
        var self = this;
        SCWeb.core.Server.resolveScAddr(this.systemIds, function (keynodes) {
            Object.getOwnPropertyNames(keynodes).forEach(function(key) {
                console.log('Resolved keynode: ' + key + ' = ' + keynodes[key]);
                self.scKeynodes[key] = keynodes[key];
            });
            self.load = true;
            callback();
        });
    }

};
