SCggObjectBuilder = {
    scgg_objects: {},
    gwf_objects: {},
    commandList: [],
    scene: null,

    buildObjects: function (gwf_objects) {
        this.gwf_objects = gwf_objects;
        for (var gwf_object_id  in gwf_objects) {
            var gwf_object = gwf_objects[gwf_object_id];
            if (gwf_object.attributes.id in this.scgg_objects == false) {
                var scgg_object = gwf_object.buildObject({
                    scene: this.scene,
                    builder: this
                });
                this.scgg_objects[gwf_object.attributes.id] = scgg_object;
                this.commandList.push(new SCggCommandAppendObject(scgg_object, this.scene));
            }
        }
        this.scene.commandManager.execute(new SCggWrapperCommand(this.commandList), true);
        this.emptyObjects();
    },

    getOrCreate: function (gwf_object_id) {
        var scgg_object;
        if (gwf_object_id in this.scgg_objects == false) {
            var gwf_object = this.gwf_objects[gwf_object_id];
            this.scgg_objects[gwf_object_id] = gwf_object.buildObject({
                scene: this.scene,
                builder: this
            });
            this.commandList.push(new SCggCommandAppendObject(this.scgg_objects[gwf_object_id], this.scene));
        }
        return this.scgg_objects[gwf_object_id];
    },

    emptyObjects: function () {
        this.gwf_objects = {};
        this.scgg_objects = {};
        this.commandList = [];
    }
}