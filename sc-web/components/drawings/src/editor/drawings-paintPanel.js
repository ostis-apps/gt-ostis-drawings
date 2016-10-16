/**
 * Paint panel.
 */

Drawings.PaintPanel = function (containerId, model) {
    this.containerId = containerId;

    this.model = model;

    this.controller = null;

    this.board = null;

    this.rendererMap = {};
};

Drawings.PaintPanel.prototype = {

    init: function () {
        this._initMarkup(this.containerId);

        this.board = this._createBoard();

        this._configureModel();

        this.controller = new Drawings.Controller(this, this.model);

        this.rendererMap["Vertex"] = new Drawings.VertexRenderer(this.board);
        this.rendererMap["Edge"] = new Drawings.EdgeRenderer(this.board);
        this.rendererMap["Arc"] = new Drawings.ArcRenderer(this.board);
    },

    getBoard: function () {
        return this.board;
    },

    getJxgObjects: function (event) {
        return this.board.getAllObjectsUnderMouse(event);
    },

    getJxgPoint: function (event) {
        var jxgObjects = this.getJxgObjects(event);

        var jxgPoints = jxgObjects.filter(function (jxgObject) {
            return jxgObject instanceof JXG.Point;
        });

        return jxgPoints.length > 0 ? jxgPoints[0] : null;
    },

    getMouseCoordinates: function (event) {
        var coordinates = this.board.getUsrCoordsOfMouse(event);
        return [coordinates[0], coordinates[1]];
    },

    _initMarkup: function (containerId) {
        var container = $('#' + containerId);
        var paintPanel = this;

        // root element
        container.append('<div id="graphDrawingEditor" class="graphDrawingEditor"></div>');
        var editor = $('#graphDrawingEditor');

        editor.append('<div id="toolbar" class="toolbar"></div>');

        var toolbar = $('#toolbar');
        toolbar.append('<div id="vertexButton" class="button vertex" title="Вершина"></div>');
        toolbar.append('<div id="edgeButton" class="button edge" title="Ребро"></div>');
        toolbar.append('<div id="arcButton" class="button arc" title="Дуга"></div>');

        toolbar.append('<div id="clearButton" class="button clear" title="Очистить"></div>');
        toolbar.append('<div id="translateButton" class="button translate" title="Синхронизация"></div>');

        $("#vertexButton").bind("contextmenu", function(e) {
            e.preventDefault();
        });

        $('#vertexButton').mousedown(function(event) {
                switch (event.which) {
                    case 1:
                        paintPanel.controller.setDrawingMode(Drawings.DrawingMode.VERTEX);
                        break;
                    case 3:
                        paintPanel.controller.vertexController.handleContextDefinitionMenuEvent(event);
                        break;
                    default:
                        alert('You have a strange Mouse!');
                }
            }
        );

        $('#edgeButton').mousedown(function(event) {
                switch (event.which) {
                    case 1:
                        paintPanel.controller.setDrawingMode(Drawings.DrawingMode.EDGE);
                        break;
                    case 3:
                        paintPanel.controller.edgeController.handleContextDefinitionMenuEvent(event);
                        break;
                    default:
                        alert('You have a strange Mouse!');
                }
            }
        );
        $("#edgeButton").bind("contextmenu", function(e) {
            e.preventDefault();
        });

        $('#arcButton').mousedown(function(event) {
                switch (event.which) {
                    case 1:
                        paintPanel.controller.setDrawingMode(Drawings.DrawingMode.ARC);
                        break;
                    case 3:
                        paintPanel.controller.arcController.handleContextDefinitionMenuEvent(event);
                        break;
                    default:
                        alert('You have a strange Mouse!');
                }
            }
        );
        $("#arcButton").bind("contextmenu", function(e) {
            e.preventDefault();
        });

        $('#clearButton').click(function () {
            paintPanel.model.clear();
        });

        $('#translateButton').click(function () {
            paintPanel._translate();
        });

        // initialize board
        editor.append('<div id="board" class="board jxgbox"></div>');
    },

    _createBoard: function () {
        var properties = {
            boundingbox: [-80, 80, 80, -80],
            showCopyright: false,
            grid: false,
            unitX: 20,
            unitY: 20
        };

        var board = JXG.JSXGraph.initBoard('board', properties);

        var paintPanel = this;

        board.on('mousedown', function (event) {
            paintPanel.controller.handleEvent(event);
        });

        board.on('mouseup', function (event) {
            paintPanel.controller.handleEvent(event);
        });

        return board;
    },

    _configureModel: function () {
        var paintPanel = this;

        paintPanel._drawModel(paintPanel.model);

        paintPanel.model.onUpdate(function (objectsToRemove, objectsToAdd, objectsToUpdate) {
            paintPanel._erase(objectsToRemove);
            paintPanel._draw(objectsToAdd);
            paintPanel._update(objectsToUpdate);
        });
    },

    _drawModel: function (model) {
        var objectsToDraw = [];
        objectsToDraw = objectsToDraw.concat(model.getPoints());
        objectsToDraw = objectsToDraw.concat(model.getShapes());
        this._draw(objectsToDraw);
    },

    _draw: function (modelObjects) {
        for (var i = 0; i < modelObjects.length; i++) {
            var renderer = this.rendererMap[modelObjects[i].className];
            renderer.render(modelObjects[i]);
        }
    },

    _erase: function (modelObjects) {
        for (var i = 0; i < modelObjects.length; i++) {
            var renderer = this.rendererMap[modelObjects[i].className];
            renderer.erase(modelObjects[i]);
        }
    },

    _redraw: function (modelObjects) {
        this._erase(modelObjects);
        this._draw(modelObjects);
    },

    _update: function (modelObjects) {
        var points = Drawings.Utils.selectPoints(modelObjects);
        var shapes = Drawings.Utils.selectShapes(modelObjects);

        this._updatePoints(points);
        this._updateShapes(shapes);
    },

    _updatePoints: function (points) {
        for (var i = 0; i < points.length; i++) {
            var point = points[i];

            var connectedShapes = this._getConnectedShapes(point);

            this._erase(connectedShapes);
            this._redraw([point]);
            this._draw(connectedShapes);
        }
    },

    _getConnectedShapes: function (point) {
        var shapes = this.model.getShapes();
        var connectedShapes = [];

        for (var i = 0; i < shapes.length; i++) {
            var pointIndex = shapes[i].getPoints().indexOf(point);

            if (pointIndex >= 0) {
                connectedShapes.push(shapes[i]);
            }
        }

        return connectedShapes;
    },

    _updateShapes: function (shapes) {
        this._redraw(shapes);
    },

    _translate: function () {
        Drawings.ScTranslator.translateToSc(this.model);
        // Redraw all (only translated ?) shapes after translation
        //this._redraw(this.model.getModelObjects());
    },


    _getJxgObjectById: function (id) {
        console.log('This function is deprecated. Use instead: Drawings.Utils.getJxgObjectById(board, id).');

        return this.board.select(function (jxgObject) {
            return jxgObject.id == id;
        }).objectsList[0];
    }
};