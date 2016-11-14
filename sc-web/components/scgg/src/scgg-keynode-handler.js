SCggKeynodesHandler = {

    systemIds: [
        'format_scs_json',
        'nrel_gt_idtf',
        'nrel_weight',
        'nrel_temporal_decomposition',
        'rrel_current_version',
        'rrel_vertex',
        'rrel_oredge'
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
