module.exports = function() {
    return  {
        concat: {
            drawingscmp: {
                src: [
                	"sc-web/components/drawings/src/drawings-common.js",
        			"sc-web/components/drawings/src/drawings-utils.js",

        			"sc-web/components/drawings/src/model/drawings-shape.js",
        			"sc-web/components/drawings/src/model/drawings-point.js",
        			"sc-web/components/drawings/src/model/drawings-arc.js",
        			"sc-web/components/drawings/src/model/drawings-edge.js",
        			"sc-web/components/drawings/src/model/drawings-model.js",

        			"sc-web/components/drawings/src/translator/drawings-jsonTranslator.js",
        			"sc-web/components/drawings/src/translator/drawings-scTranslator.js",

        			"sc-web/components/drawings/src/editor/component/drawings-contextMenu.js",

        			"sc-web/components/drawings/src/editor/drawings-controller.js",
        			"sc-web/components/drawings/src/editor/drawings-paintPanel.js",

        			"sc-web/components/drawings/src/editor/renderer/drawings-vertexRenderer.js",
        			"sc-web/components/drawings/src/editor/renderer/drawings-edgeRenderer.js",
       				"sc-web/components/drawings/src/editor/renderer/drawings-arcRenderer.js",

       				"sc-web/components/drawings/src/editor/controller/drawings-vertexController.js",
        			"sc-web/components/drawings/src/editor/controller/drawings-arcController.js",
        			"sc-web/components/drawings/src/editor/controller/drawings-edgeController.js"],
                dest: '../sc-web/client/static/components/js/drawings/drawings.js'
            }
        }, 
        watch: {
            drawingscmp: {
                files: 'sc-web/components/drawings/src/**',
                tasks: ['concat:drawingscmp']
            }
        }
    }
};

