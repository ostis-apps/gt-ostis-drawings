module.exports = function() {

    var kb = 'kb/graph_drawings/';
    var components = 'sc-web/components/scgg/';
    var clientJsDirPath = '../sc-web/client/static/components/js/';
    var clientCssDirPath = '../sc-web/client/static/components/css/';
    var clientHtmlDirPath = '../sc-web/client/static/components/html/';
    var clientImgDirPath = '../sc-web/client/static/components/images/';

    return  {
        concat: {
            scggcmp: {
                src: [
                    components + 'src/gwfg-file-creater.js',
                    components + 'src/gwfg-file-loader.js',
                    components + 'src/gwfg-model-objects.js',
                    components + 'src/gwfg-object-info-reader.js',
                    components + 'src/scgg-keynode-handler.js',
                    components + 'src/scgg-object-builder.js',
                    components + 'src/scgg.js',
                    components + 'src/scgg-debug.js',
                    components + 'src/scgg-math.js',
                    components + 'src/scgg-model-objects.js',
                    components + 'src/scgg-alphabet.js',
                    components + 'src/scgg-render.js',
                    components + 'src/scgg-scene.js',
                    components + 'src/scgg-layout.js',
                    components + 'src/scgg-tree.js',
                    components + 'src/scgg-struct.js',
                    components + 'src/scgg-object-creator.js',
                    components + 'src/scgg-component.js',
                    components + 'src/scgg-scs-component.js',
                    components + 'src/scgg-resolve-component.js',
                    components + 'src/listener/scgg-mode-bus.js',
                    components + 'src/listener/scgg-mode-contour.js',
                    components + 'src/listener/scgg-mode-edge.js',
                    components + 'src/listener/scgg-mode-link.js',
                    components + 'src/listener/scgg-mode-select.js',
                    components + 'src/command/append-object.js',
                    components + 'src/command/command-manager.js',
                    components + 'src/command/create-node.js',
                    components + 'src/command/create-edge.js',
                    components + 'src/command/create-bus.js',
                    components + 'src/command/create-contour.js',
                    components + 'src/command/create-link.js',
                    components + 'src/command/change-idtf.js',
                    components + 'src/command/change-content.js',
                    components + 'src/command/change-type.js',
                    components + 'src/command/delete-objects.js',
                    components + 'src/command/move-object.js',
                    components + 'src/command/move-line-point.js',
                    components + 'src/command/get-node-from-memory.js',
                    components + 'src/command/wrapper-command.js'],
                dest: clientJsDirPath + 'scgg/scgg.js'
            }
        },
        copy: {
            setIMG: {
                cwd: components + 'static/components/images/scgg',
                src: ['**'],
                dest: clientImgDirPath + 'scgg/',
                expand: true
            },
            setCSS: {
                cwd: components + 'static/components/css/',
                src: ['scgg.css'],
                dest: clientCssDirPath,
                expand: true,
                flatten: true
            },
            setHTML: {
                cwd: components + 'static/components/html/',
                src: ['*.html'],
                dest: clientHtmlDirPath,
                expand: true,
                flatten: true
            },
            kb: {
                cwd: kb,
                src: ['**'],
                dest: '../kb/graph_drawings/',
                expand: true
            }
        },
        watch: {
            scggcmp: {
                files: components + 'src/**',
                tasks: ['concat:scggcmp']
            },
            scggIMG: {
                files: [components + 'static/components/images/**'],
                tasks: ['copy:scggIMG']
            },
            scggCSS: {
                files: [components + 'static/components/css/**'],
                tasks: ['copy:scggCSS']
            },
            scggHTML: {
                files: [components + 'static/components/html/**',],
                tasks: ['copy:scggHTML']
            },
            copyKB: {
                files: [kb + '**',],
                tasks: ['copy:kb']
            }
        },
        exec: {
          updateCssAndJs: 'sh add-css-and-js.sh'
        }
    }
};

