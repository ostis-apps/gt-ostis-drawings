module.exports = function() {
    return  {
        concat: {
            scggcmp: {
                src: [
                    'sc-web/components/scgg/src/gwfg-file-creater.js',
                    'sc-web/components/scgg/src/gwfg-file-loader.js',
                    'sc-web/components/scgg/src/gwfg-model-objects.js',
                    'sc-web/components/scgg/src/gwfg-object-info-reader.js',
                    'sc-web/components/scgg/src/scgg-keynode-handler.js',
                    'sc-web/components/scgg/src/scgg-object-builder.js',
                    'sc-web/components/scgg/src/scgg.js',
                    'sc-web/components/scgg/src/scgg-debug.js',
                    'sc-web/components/scgg/src/scgg-math.js',
                    'sc-web/components/scgg/src/scgg-model-objects.js',
                    'sc-web/components/scgg/src/scgg-alphabet.js',
                    'sc-web/components/scgg/src/scgg-render.js',
                    'sc-web/components/scgg/src/scgg-scene.js',
                    'sc-web/components/scgg/src/scgg-layout.js',
                    'sc-web/components/scgg/src/scgg-tree.js',
                    'sc-web/components/scgg/src/scgg-struct.js',
                    'sc-web/components/scgg/src/scgg-object-creator.js',
                    'sc-web/components/scgg/src/scgg-component.js',
                    'sc-web/components/scgg/src/scgg-scs-component.js',
                    'sc-web/components/scgg/src/listener/scgg-mode-bus.js',
                    'sc-web/components/scgg/src/listener/scgg-mode-contour.js',
                    'sc-web/components/scgg/src/listener/scgg-mode-edge.js',
                    'sc-web/components/scgg/src/listener/scgg-mode-link.js',
                    'sc-web/components/scgg/src/listener/scgg-mode-select.js',
                    'sc-web/components/scgg/src/command/append-object.js',
                    'sc-web/components/scgg/src/command/command-manager.js',
                    'sc-web/components/scgg/src/command/create-node.js',
                    'sc-web/components/scgg/src/command/create-edge.js',
                    'sc-web/components/scgg/src/command/create-bus.js',
                    'sc-web/components/scgg/src/command/create-contour.js',
                    'sc-web/components/scgg/src/command/create-link.js',
                    'sc-web/components/scgg/src/command/change-idtf.js',
                    'sc-web/components/scgg/src/command/change-content.js',
                    'sc-web/components/scgg/src/command/change-type.js',
                    'sc-web/components/scgg/src/command/delete-objects.js',
                    'sc-web/components/scgg/src/command/move-object.js',
                    'sc-web/components/scgg/src/command/move-line-point.js',
                    'sc-web/components/scgg/src/command/get-node-from-memory.js',
                    'sc-web/components/scgg/src/command/wrapper-command.js'],
                dest: '../sc-web/client/static/components/js/scgg/scgg.js'
            }
        },
        watch: {
            scggcmp: {
                files: 'sc-web/components/scgg/src/**',
                tasks: ['concat:scggcmp']
            }
        }
    }
};

