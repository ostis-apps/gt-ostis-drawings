SCggWrapperCommand = function (commands) {
    this.commands = commands;
};

SCggWrapperCommand.prototype = {

    constructor: SCggWrapperCommand,

    undo: function() {
        this.commands.forEach(function(command) {
            command.undo();
        });
    },

    execute: function() {
        this.commands.forEach(function(command) {
            command.execute();
        });
    }

};
