SCggKeynodesHandler = {
    systemIds: [
        'format_scs_json',
        'nrel_gt_idtf',
        'concept_graph',
        'nrel_weight',
        'nrel_temporal_decomposition',
        'nrel_temporal_inclusion',
        'rrel_current_version',
        'rrel_vertex',
        'rrel_oredge',
        'temporary_entity',
        'ui_menu_find_graph_info',
    ],

    scKeynodes: {},

    load: false,

    async initSystemIds(callback) {
        const keynodes = await SCWeb.core.Server.resolveScAddr(this.systemIds);
        Object.entries(keynodes).forEach(([key, addr]) => {
            console.log(`Resolved keynode: ${key} = ${addr}`);
            this.scKeynodes[key] = addr;
        })
        this.load = true;
        callback();
    },
};
