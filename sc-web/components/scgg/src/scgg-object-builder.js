SCggObjectBuilder = {
    scgg_objects: {},
    gwfg_objects: {},
    commandList: [],
    scene: null,

    buildObjects: function (gwfg_objects) {
        this.gwfg_objects = gwfg_objects;
        for (var gwfg_object_id  in gwfg_objects) {
            var gwfg_object = gwfg_objects[gwfg_object_id];
            if (gwfg_object.attributes.id in this.scgg_objects == false) {
                var scgg_object = gwfg_object.buildObject({
                    scene: this.scene,
                    builder: this
                });
                this.scgg_objects[gwfg_object.attributes.id] = scgg_object;
                this.commandList.push(new SCggCommandAppendObject(scgg_object, this.scene));
            }
        }
        this.scene.commandManager.execute(new SCggWrapperCommand(this.commandList), true);
        this.emptyObjects();
    },

    getOrCreate: function (gwfg_object_id) {
        var scgg_object;
        if (gwfg_object_id in this.scgg_objects == false) {
            var gwfg_object = this.gwfg_objects[gwfg_object_id];
            this.scgg_objects[gwfg_object_id] = gwfg_object.buildObject({
                scene: this.scene,
                builder: this
            });
            this.commandList.push(new SCggCommandAppendObject(this.scgg_objects[gwfg_object_id], this.scene));
        }
        return this.scgg_objects[gwfg_object_id];
    },

    emptyObjects: function () {
        this.gwfg_objects = {};
        this.scgg_objects = {};
        this.commandList = [];
    }
}