/**
 * sc translator.
 */

Drawings.ScTranslator = {


    getKeyNode: function (node_name) {
        if (!this.hasOwnProperty(node_name) || this[node_name] == null) {
            var dfd = new jQuery.Deferred();
            var self = this;
            self[node_name] = null;
            window.sctpClient.find_element_by_system_identifier(node_name)
                .done(function (r) {
// if(r.resCode != SctpResultCode.SCTP_RESULT_OK){
                    if (r == null) {
                        alert("can't resolve " + node_name);// TODO: remove
// alert
                    }
                    self[node_name] = r;
                    dfd.resolve(self[node_name]);
                }).fail(function () {
                    self[node_name] = null;
                    dfd.resolve(self[node_name]);
                });
            return dfd.promise();
        }
    },
    getKeyNodes: function () {
        var dfd = new jQuery.Deferred();
        var my_array = [];
        var self = this;
        my_array.push(this.getKeyNode("concept_quantity"));
        my_array.push(this.getKeyNode("concept_segment"));
        my_array.push(this.getKeyNode("nrel_side"));
        my_array.push(this.getKeyNode("concept_triangle"));
        my_array.push(this.getKeyNode("concept_circle"));
        my_array.push(this.getKeyNode("concept_geometric_point"));// ?
        my_array.push(this.getKeyNode("concept_straight_line"));
        my_array.push(this.getKeyNode("nrel_boundary_point"));
        my_array.push(this.getKeyNode("nrel_inclusion"));
        my_array.push(this.getKeyNode("nrel_vertex"));
        my_array.push(this.getKeyNode("nrel_radius"));
        my_array.push(this.getKeyNode("nrel_system_identifier"));
        my_array.push(this.getKeyNode("nrel_length"));
        my_array.push(this.getKeyNode("nrel_center_of_circle"));
        my_array.push(this.getKeyNode("nrel_value"));
        my_array.push(this.getKeyNode("nrel_area"));
        my_array.push(this.getKeyNode("nrel_perimeter"));
        my_array.push(this.getKeyNode("concept_square"));
        my_array.push(this.getKeyNode("chart_arguments"));
        my_array.push(this.getKeyNode("sc_garbage")); // 15
        $.when.apply($, my_array).done(function () {
            dfd.resolve(my_array);
        }).fail(function () {
            dfd.reject(my_array);
        });
        return dfd.promise();
    },
    /*
     Add link with content into base_el.
     All parameters must be sc_addr
     */
    addNewLinkWithContent: function (content, base_el) {
        window.sctpClient.create_link().done(function (res) {
            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, res);
            window.sctpClient.set_link_content(res, content);
            self.addFiveConstructionIntoBase(r, res, self.nrel_system_identifier, base_el,
                sc_type_arc_common | sc_type_const);
        });
    },
    /*
     Add relation and quantity-value-answer construction.
     See segment length example
     relation must be sc_addr, value is an answer (for example shape.length)
     */
    addConstructionWithValueAndQuantity: function (relation, value) {
    },
    /*
     Add relation or attribute construction.
     All parameters must be sc_addr
     */
    addFiveConstruction: function (start_el, end_el, relOrAttr, arc_type) {
        window.sctpClient.create_arc(
            arc_type, start_el, end_el).done(function (res) {
                window.sctpClient.create_arc(
                    sc_type_arc_pos_const_perm, relOrAttr, res);
            });
    },
    /*
     Add relation or attribute construction and put all arcs into base_el.
     All parameters must be sc_addr.
     */
    addFiveConstructionIntoBase: function (start_el, end_el, relOrAttr, base_el, arc_type) {
        window.sctpClient.create_arc(
            arc_type, start_el, end_el).done(function (res) {
                window.sctpClient.create_arc(
                    sc_type_arc_pos_const_perm, relOrAttr, res).done(function (res1) {
                        window.sctpClient.create_arc(
                            sc_type_arc_pos_const_perm, base_el, res1);
                    });
                window.sctpClient.create_arc(
                    sc_type_arc_pos_const_perm, base_el, res);
                window.sctpClient.create_arc(
                    sc_type_arc_pos_const_perm, base_el, relOrAttr);
            });
    },
    putPoint: function (point) {
        var dfd = new jQuery.Deferred();
        if (point.hasOwnProperty("sc_addr") && point.sc_addr != null) {
            dfd.resolve(point.sc_addr);
            return dfd.promise();
        }
        var self = this;
        window.sctpClient.create_node(sc_type_node | sc_type_const).done(
            function (r) {
                point.sc_addr = r;
                if ("" != point.name) {
                    window.sctpClient.create_link().done(function (res) {
                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, res);
                        window.sctpClient.set_link_content(res, point.name);
                        self.addFiveConstructionIntoBase(r, res, self.nrel_system_identifier, self.chart_arguments,
                            sc_type_arc_common | sc_type_const);
                    });
                }
                var arc1 = window.sctpClient.create_arc(
                    sc_type_arc_pos_const_perm, self.chart_arguments, r);
                var arc2 = window.sctpClient.create_arc(
                    sc_type_arc_pos_const_perm, self.concept_geometric_point, r);
                arc2.done(function (res) {
                    window.sctpClient.create_arc(
                        sc_type_arc_pos_const_perm, self.chart_arguments, res);
                })
                var arc3 = window.sctpClient.create_arc(
                    sc_type_arc_pos_const_perm, self.chart_arguments, self.concept_geometric_point);
                $.when(arc1, arc2, arc3).done(function () {
                    dfd.resolve(r);
                });
            }).fail(function () {
                dfd.reject();
                alert("1) create node for point failed");
            });
        return dfd.promise();
    },
// /
    putShape: function (shape) {
        var dfd = new jQuery.Deferred();
        if (shape.hasOwnProperty("sc_addr") && shape.sc_addr != null) {
            dfd.resolve(shape.sc_addr);
            return dfd.promise();
        }
        var self = this;
        window.sctpClient.create_node(sc_type_node | sc_type_const).done(
            function (r) {
                var points = shape.points;
                shape.sc_addr = r;
                var shapeType = self.concept_geometric_point;
                if (shape.className == 'Segment') {
                    shapeType = self.concept_segment;
                    for (var i = 0; i < points.length; i++) {
                        self.addFiveConstructionIntoBase(r, points[i].sc_addr, self.nrel_boundary_point,
                            self.chart_arguments, sc_type_arc_common | sc_type_const);
                    }
                    if (shape.length) {
                        self.addConstructionWithValueAndQuantity(self.nrel_length, shape.length);
                        var arc1 = window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.nrel_length);
                        arc1.done(function (r1) {
                            var arc2 = window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.nrel_value);
                            arc2.done(function (r2) {
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.concept_quantity);
                                window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (quality_node) {
                                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, quality_node);
                                    window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (value_node) {
                                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, value_node);
                                        window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (answer_node) {
                                            self.addFiveConstruction(self.concept_quantity, quality_node, self.chart_arguments, sc_type_arc_pos_const_perm);
                                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, answer_node);
                                            self.addFiveConstructionIntoBase(r, quality_node, self.nrel_length,
                                                self.chart_arguments, sc_type_arc_common | sc_type_const);
                                            self.addFiveConstructionIntoBase(value_node, quality_node, self.nrel_value,
                                                self.chart_arguments, sc_type_arc_common | sc_type_const);
                                            self.addFiveConstruction(value_node, answer_node, self.chart_arguments, sc_type_arc_pos_const_perm);
                                            window.sctpClient.create_link().done(function (res) {
                                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, res);
                                                window.sctpClient.set_link_content(res, shape.length);
                                                self.addFiveConstructionIntoBase(answer_node, res, self.nrel_system_identifier, self.chart_arguments,
                                                    sc_type_arc_common | sc_type_const);
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }
                }
                if (shape.className == 'Line') {
                    shapeType = self.concept_straight_line;
                    for (var i = 0; i < points.length; i++) {
                        self.addFiveConstruction(r, points[i].sc_addr, self.chart_arguments, sc_type_arc_pos_const_perm);
                    }
                }
                if (shape.className == 'Circle') {
                    shapeType = self.concept_circle;
                    if (shape.center) {
                        self.addFiveConstructionIntoBase(r, points[0].sc_addr, self.nrel_center_of_circle,
                            self.chart_arguments, sc_type_arc_common | sc_type_const);
                        self.addFiveConstruction(r, points[1].sc_addr, self.chart_arguments, sc_type_arc_pos_const_perm);
                    }
                    if (shape.radius) {
                        self.addFiveConstructionIntoBase(r, shape.radius.sc_addr, self.nrel_radius,
                            self.chart_arguments, sc_type_arc_common | sc_type_const);
                        window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (createdNode) {
                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, createdNode);
                            self.addFiveConstructionIntoBase(r, createdNode, self.nrel_radius,
                                self.chart_arguments, sc_type_arc_common | sc_type_const);
                            var arc1 = window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.nrel_length);
                            arc1.done(function (r1) {
                                var arc2 = window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.nrel_value);
                                arc2.done(function (r2) {
                                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.concept_quantity);
                                    window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (quality_node) {
                                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, quality_node);
                                        window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (value_node) {
                                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, value_node);
                                            window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (answer_node) {
                                                self.addFiveConstruction(self.concept_quantity, quality_node, self.chart_arguments, sc_type_arc_pos_const_perm);
                                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, answer_node);
                                                self.addFiveConstructionIntoBase(createdNode, quality_node, self.nrel_length,
                                                    self.chart_arguments, sc_type_arc_common | sc_type_const);
                                                self.addFiveConstructionIntoBase(value_node, quality_node, self.nrel_value,
                                                    self.chart_arguments, sc_type_arc_common | sc_type_const);
                                                self.addFiveConstruction(value_node, answer_node, self.chart_arguments, sc_type_arc_pos_const_perm);
                                                window.sctpClient.create_link().done(function (res) {
                                                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, res);
                                                    window.sctpClient.set_link_content(res, shape.radius);
                                                    self.addFiveConstructionIntoBase(answer_node, res, self.nrel_system_identifier, self.chart_arguments,
                                                        sc_type_arc_common | sc_type_const);
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }
                    if (shape.length) {
                        var arc1 = window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.nrel_length);
                        arc1.done(function (r1) {
                            var arc2 = window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.nrel_value);
                            arc2.done(function (r2) {
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.concept_quantity);
                                window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (quality_node) {
                                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, quality_node);
                                    window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (value_node) {
                                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, value_node);
                                        window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (answer_node) {
                                            self.addFiveConstruction(self.concept_quantity, quality_node, self.chart_arguments, sc_type_arc_pos_const_perm);
                                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, answer_node);
                                            self.addFiveConstructionIntoBase(r, quality_node, self.nrel_length,
                                                self.chart_arguments, sc_type_arc_common | sc_type_const);
                                            self.addFiveConstructionIntoBase(value_node, quality_node, self.nrel_value,
                                                self.chart_arguments, sc_type_arc_common | sc_type_const);
                                            self.addFiveConstruction(value_node, answer_node, self.chart_arguments, sc_type_arc_pos_const_perm);
                                            window.sctpClient.create_link().done(function (res) {
                                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, res);
                                                window.sctpClient.set_link_content(res, shape.length);
                                                self.addFiveConstructionIntoBase(answer_node, res, self.nrel_system_identifier, self.chart_arguments,
                                                    sc_type_arc_common | sc_type_const);
                                            });
                                        });
                                    });
                                });
                            });
                        });

                    }
                }
                if (shape.className == 'Triangle') {
                    shapeType = self.concept_triangle;
                    for (var i = 0; i < points.length; i++) {
                        self.addFiveConstructionIntoBase(r, points[i].sc_addr, self.nrel_vertex,
                            self.chart_arguments, sc_type_arc_common | sc_type_const);
                    }
                    if (!shape.hasOwnProperty('shapes')) {
                        shape.shapes = [];
                        shape.shapes[0] = shape.segment1;
                        shape.shapes[1] = shape.segment2;
                        shape.shapes[2] = shape.segment3;
                    }
                    for (var i = 0; i < shape.shapes.length; i++) {
                        self.addFiveConstructionIntoBase(r, shape.shapes[i].sc_addr, self.nrel_side,
                            self.chart_arguments, sc_type_arc_common | sc_type_const);
                    }
                    if (shape.perimeter) {
                        var arc1 = window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.nrel_perimeter);
                        arc1.done(function (r1) {
                            var arc2 = window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.nrel_value);
                            arc2.done(function (r2) {
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.concept_quantity);
                                window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (quality_node) {
                                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, quality_node);
                                    window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (value_node) {
                                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, value_node);
                                        window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (answer_node) {
                                            self.addFiveConstruction(self.concept_quantity, quality_node, self.chart_arguments, sc_type_arc_pos_const_perm);
                                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, answer_node);
                                            self.addFiveConstructionIntoBase(r, quality_node, self.nrel_perimeter,
                                                self.chart_arguments, sc_type_arc_common | sc_type_const);
                                            self.addFiveConstructionIntoBase(value_node, quality_node, self.nrel_value,
                                                self.chart_arguments, sc_type_arc_common | sc_type_const);
                                            self.addFiveConstruction(value_node, answer_node, self.chart_arguments, sc_type_arc_pos_const_perm);
                                            window.sctpClient.create_link().done(function (res) {
                                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, res);
                                                window.sctpClient.set_link_content(res, shape.perimeter);
                                                self.addFiveConstructionIntoBase(answer_node, res, self.nrel_system_identifier, self.chart_arguments,
                                                    sc_type_arc_common | sc_type_const);
                                            });
                                        });
                                    });
                                });
                            });
                        });

                    }
                    if (shape.square) {
                        var arc1 = window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.nrel_area);
                        arc1.done(function (r1) {
                            var arc2 = window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.nrel_value);
                            arc2.done(function (r2) {
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, self.concept_quantity);
                                window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (quality_node) {
                                    window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, quality_node);
                                    window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (value_node) {
                                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, value_node);
                                        window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (answer_node) {
                                            self.addFiveConstruction(self.concept_quantity, quality_node, self.chart_arguments, sc_type_arc_pos_const_perm);
                                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, answer_node);
                                            self.addFiveConstructionIntoBase(r, quality_node, self.nrel_area,
                                                self.chart_arguments, sc_type_arc_common | sc_type_const);
                                            self.addFiveConstructionIntoBase(value_node, quality_node, self.nrel_value,
                                                self.chart_arguments, sc_type_arc_common | sc_type_const);
                                            self.addFiveConstruction(value_node, answer_node, self.chart_arguments, sc_type_arc_pos_const_perm);
                                            window.sctpClient.create_link().done(function (res) {
                                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, res);
                                                window.sctpClient.set_link_content(res, shape.square);
                                                self.addFiveConstructionIntoBase(answer_node, res, self.nrel_system_identifier, self.chart_arguments,
                                                    sc_type_arc_common | sc_type_const);
                                            });
                                        });
                                    });
                                });
                            });
                        });

                    }

                }

                if ("" != shape.name) {
                    window.sctpClient.create_link().done(function (res) {
                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm, self.chart_arguments, res);
                        window.sctpClient.set_link_content(res, shape.name);
                        self.addFiveConstructionIntoBase(r, res, self.nrel_system_identifier, self.chart_arguments,
                            sc_type_arc_common | sc_type_const);
                    });
                }
                var arc1 = window.sctpClient.create_arc(
                    sc_type_arc_pos_const_perm, self.chart_arguments, r);
                var arc2 = window.sctpClient
                    .create_arc(sc_type_arc_pos_const_perm, shapeType, r);
                arc2.done(function (result) {
                    window.sctpClient.create_arc(
                        sc_type_arc_pos_const_perm, self.chart_arguments, result);
                });
                var arc3 = window.sctpClient.create_arc(
                    sc_type_arc_pos_const_perm, self.chart_arguments, shapeType);
                $.when(arc1, arc2, arc3).done(function () {
                    dfd.resolve(r);
                });
            }).fail(function () {
                dfd.reject();
                alert("1) create node for shape failed");
            });
        return dfd.promise();
    },
// /
    pushPoints: function (points) {
        var dfd = new jQuery.Deferred();
        var my_array = [];
        var self = this;
        for (t in points) {
            my_array.push(this.putPoint(points[t]));
        }
        $.when.apply($, my_array).done(function () {
            dfd.resolve();
        }).fail(function () {
            dfd.reject();
        });
        return dfd.promise();
    },
    pushShapes: function (shapes) {
        var dfd = new jQuery.Deferred();
        var my_array1 = [];
        var self = this;
//put segments first
        for (t in shapes) {
            if (shapes[t].className != 'Point')
                my_array1.push(this.putShape(shapes[t]));
        }
        $.when.apply($, my_array1).done(function () {
            dfd.resolve();
        }).fail(function () {
            dfd.reject();
        });
        return dfd.promise();
    },


    getSystemAddrs: function () {
        var self = this;
        var dfd = new jQuery.Deferred();
        var sysArray = [];
        sysArray.push(self.concept_quantity);
        sysArray.push(self.concept_segment);
        sysArray.push(self.nrel_side);
        sysArray.push(self.concept_triangle);
        sysArray.push(self.concept_circle);
        sysArray.push(self.concept_geometric_point);
        sysArray.push(self.concept_straight_line);
        sysArray.push(self.nrel_boundary_point);
        sysArray.push(self.nrel_inclusion);
        sysArray.push(self.nrel_vertex);
        sysArray.push(self.nrel_radius);
        sysArray.push(self.nrel_system_identifier);
        sysArray.push(self.nrel_length);
        sysArray.push(self.nrel_center_of_circle);
        sysArray.push(self.nrel_value);
        sysArray.push(self.nrel_area);
        sysArray.push(self.nrel_perimeter);
        sysArray.push(self.concept_square);
        sysArray.push(self.chart_arguments);
        sysArray.push(self.sc_garbage);
        dfd.resolve(sysArray);
        return dfd.promise();
    },

    wipeOld: function () {
        var addrsOfNodesToWipe = [];
        var addrsOfArcsToWipe = [];
        var self = this;
        var dfd = new jQuery.Deferred();
        window.sctpClient.iterate_elements(SctpIteratorType.SCTP_ITERATOR_3F_A_A, [
            self.chart_arguments,
            sc_type_arc_pos_const_perm,
            sc_type_node | sc_type_const])
            .done(function (res) {
                self.getSystemAddrs().done(function (resSystemNodes) {
                    var flag = true;
                    for (var i = 0; i < res.length; i++) {
                        for (var j = 0; j < resSystemNodes.length; j++) {
                            if (res [i][2] == resSystemNodes[j]) {
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm,
                                    self.sc_garbage, res [i][1]);
                                flag = false;
                            }
                        }
                        if (flag) {
                            addrsOfNodesToWipe.push(res[i][2]);
                            addrsOfArcsToWipe.push(res[i][1]);
                        }
                        else {
                            flag = true;
                        }
                    }
                    for (i = 0; i < addrsOfNodesToWipe.length; i++) {
                        window.sctpClient.create_arc(sc_type_arc_pos_const_perm,
                            self.sc_garbage, addrsOfNodesToWipe[i]);
                    }
                    for (i = 0; i < addrsOfArcsToWipe; i++) {
                        window.sctpClient.erase_element(addrsOfArcsToWipe[i]).done(function (res) {
                            console.log("delete " + addrsOfArcsToWipe[i]);
                        })
                    }
                });
                //console.log(addrsToWipe);
                dfd.resolve();
            }).fail(function () {
//alert("fail in wipeOld");
                dfd.resolve();
            });

        return dfd.promise();
    },

    calcTrianglePerimeter: function (model) {
        $('#textArea').val('');
        var triangleName = "";
        for (var i = 0; i < model.shapes.length; i++) {
            var triangle = model.shapes[i];
            if (triangle.className == 'Triangle') {
                var perim = 0;
                if (triangle.segment1.length != undefined && triangle.segment2.length != undefined && triangle.segment3.length != undefined) {
                    perim += parseInt(triangle.segment1.length) + parseInt(triangle.segment2.length) + parseInt(triangle.segment3.length);
                    if (triangle.name) {
                        triangleName = triangle.name.charAt(7) + triangle.name.charAt(9) + triangle.name.charAt(11);
                    } else {
                        triangleName = '';
                    }
                    $('#textArea').val($('#textArea').val() + "Perimeter of triangle " + triangleName + " is : " + perim + "\n");
                }
            }
        }
    },

    calcTriangleSquare: function (model) {
        $('#textArea').val('');
        var triangleName = "";
        for (var i = 0; i < model.shapes.length; i++) {
            var triangle = model.shapes[i];
            if (triangle.className == 'Triangle') {
                var square = 0;
                if (triangle.segment1.length != undefined && triangle.segment2.length != undefined && triangle.segment3.length != undefined) {
                    var side1 = parseInt(triangle.segment1.length);
                    var side2 = parseInt(triangle.segment2.length);
                    var side3 = parseInt(triangle.segment3.length)
                    var p = (side1 + side2 + side3) / 2;
                    square = Math.sqrt(p * (p - side1) * (p - side2) * (p - side3));
                    if (triangle.name) {
                        triangleName = triangle.name.charAt(7) + triangle.name.charAt(9) + triangle.name.charAt(11);
                    } else {
                        triangleName = '';
                    }
                    $('#textArea').val($('#textArea').val() + "Area of triangle  " + triangleName + " is : " + square + "\n");
                }
            }
        }
    },

    viewBasedKeyNode: function () {
        var addr;
        SCWeb.core.Server.resolveScAddr(['chart_arguments'], function (keynodes) {
            addr = keynodes['chart_arguments'];
            SCWeb.core.Server.resolveScAddr(["ui_menu_view_full_semantic_neighborhood"],
                function (data) {
                    var cmd = data["ui_menu_view_full_semantic_neighborhood"];
                    SCWeb.core.Server.doCommand(cmd,
                        [addr], function (result) {
                            if (result.question != undefined) {
                                SCWeb.ui.WindowManager.appendHistoryItem(result.question);
                            }
                        });
                });
        });
    },

    putModel: function (model) {
        SCWeb.ui.Locker.show();
        //var cleanup = this.wipeOld;
        var pushPts = this.pushPoints;
        var pushSh = this.pushShapes;
        var self = this;
        var dfd = this.getKeyNodes();
        //dfd.done(function (resArray) {
        //    return cleanup.call(self);
        //});
        dfd.done(function () {
            return pushPts.call(self, model.points).done(
                function () {
// foreach points add point-defined nodes and arcs
                    for (var i = 0; i < model.points.length; i++) {
                        var el = model.points[i];
                        if (el.hasOwnProperty("sc_addr")) {
                            document.getElementById(
                                model.paintPanel._getJxgObjectById(el
                                    .getId()).rendNode.id)
                                .setAttribute('sc_addr', el.sc_addr);
                            document.getElementById(
                                model.paintPanel._getJxgObjectById(el
                                    .getId()).rendNode.id)
                                .setAttribute('class', 'sc-no-default-cmd ui-no-tooltip');

                        }
                    }
                });
        });
        dfd.done(function () {
            return pushSh.call(self, model.shapes).done(
                function () {
// foreach shapes add shape-defined nodes and arcs
                    for (var i = 0; i < model.shapes.length; i++) {
                        var el = model.shapes[i];
                        if (el.hasOwnProperty("sc_addr")) {
                            document.getElementById(
                                model.paintPanel._getJxgObjectById(el
                                    .getId()).rendNode.id)
                                .setAttribute('sc_addr', el.sc_addr);
                            document.getElementById(
                                model.paintPanel._getJxgObjectById(el
                                    .getId()).rendNode.id)
                                .setAttribute('class', 'sc-no-default-cmd ui-no-tooltip');
                        }
                    }
                    SCWeb.ui.Locker.hide();
                });
        });
    },

    translateToSc: function(model) {
        var mainName = prompt("Напишите основной идентификатор графа");
        var addrStruct = null;

        function fireCallback() {
            console.log("fireCallback");
            if (addrStruct != null){
                SCWeb.core.Main.doDefaultCommand([addrStruct]);
            } else {
                console.log("ERROR - SCWeb.core.Main.doDefaultCommand([addrStruct]);")
            }
        }

        var currentLanguage = SCWeb.core.Translation.getCurrentLanguage();
        var translateIdentifier = function(objName, objAddr) {
            var dfd = new jQuery.Deferred();
            if (currentLanguage) {
                window.sctpClient.create_link().done(function (link_addr) {
                    window.sctpClient.set_link_content(link_addr, objName).done(function () {
                        window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, objAddr, link_addr).done(function (arc_addr) {
                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, currentLanguage, link_addr).done(function () {
                                window.sctpClient.create_arc(sc_type_arc_pos_const_perm, window.scKeynodes.nrel_main_idtf, arc_addr)
                                    .done(dfd.resolve)
                                    .fail(dfd.reject);
                            }).fail(dfd.reject);
                        }).fail(dfd.reject);
                    }).fail(dfd.reject);
                }).fail(dfd.reject);
            }
            return dfd.promise();
        };

        var translateStruct = function() {
            console.log("translateStruct");
            var dfd = new jQuery.Deferred();
            var implFunc = function() {
                var dfd = new jQuery.Deferred();
                window.sctpClient.create_node(sc_type_node | sc_type_const | sc_type_node_struct).done(function (nodeNewGraph){
                    addrStruct = nodeNewGraph;
                    window.sctpClient.create_link().done(function (nodeNameGraph) {
                        window.sctpClient.create_arc(sc_type_arc_common | sc_type_const, nodeNewGraph, nodeNameGraph).done(function (arcSystemIdentifier){
                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, window.scKeynodes.nrel_system_identifier, arcSystemIdentifier).fail(dfd.reject);;
                        }).fail(dfd.reject);
                        var currentdate = new Date();
                        var nameGraph = "newgraph"  + "_"
                            + currentdate.getDate() + "."
                            + (currentdate.getMonth()+1)  + "."
                            + currentdate.getFullYear() + "_"
                            + currentdate.getHours() + "."
                            + currentdate.getMinutes() + "."
                            + currentdate.getSeconds();
                        window.sctpClient.set_link_content(nodeNameGraph, nameGraph).fail(dfd.reject);;
                    }).fail(dfd.reject);;
                    if (mainName !== ""){
                        translateIdentifier(mainName, nodeNewGraph)
                            .done(dfd.resolve)
                            .fail(dfd.reject);
                    } else {
                        dfd.resolve();
                    }
                });
                return dfd.promise();
            };
            var funcs = [];
            funcs.push(fQueue.Func(implFunc));
            fQueue.Queue.apply(this, funcs).done(dfd.resolve).fail(dfd.reject);
            return dfd.promise();
        };

        var translateNodes = function() {
            console.log("translateNodes");
            var nodes = model.points;
            var dfdNodes = new jQuery.Deferred();
            var implFunc = function(node) {
                var dfd = new jQuery.Deferred();
                //if (!node.scAddr) {
                    window.sctpClient.create_node(sc_type_node | sc_type_const).done(function (r) {
                        node.setScAddr(r);
                        if (addrStruct != null){
                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, addrStruct, r).fail(function() {
                                console.log('Error while create arc from struct ' + addrStruct + " - " + r);
                            });
                        }
                        if (node.name !== '') {
                            translateIdentifier(node.name, node.scAddr)
                                .done(dfd.resolve)
                                .fail(dfd.reject);
                        } else {
                            dfd.resolve();
                        }
                    });
                //} else {
                //    dfd.resolve();
                //}
                return dfd.promise();
            };
            var funcs = [];
            for (var i = 0; i < nodes.length; ++i) {
                funcs.push(fQueue.Func(implFunc, [ nodes[i] ]));
            }
            fQueue.Queue.apply(this, funcs).done(dfdNodes.resolve).fail(dfdNodes.reject);
            return dfdNodes.promise();
        };

        var translateEdges = function() {
            console.log("translateEdges");
            var dfd = new jQuery.Deferred();
            var edges = [];
            model.shapes.map(function(e) {
                //if (!e.scAddr)
                    edges.push(e);
            });
            var edgesNew = [];
            var translatedCount = 0;
            function doIteration() {
                var edge = edges.shift();
                function nextIteration() {
                    if (edges.length === 0) {
                        if (translatedCount === 0 || (edges.length === 0 && edgesNew.length === 0))
                            dfd.resolve();
                        else {
                            edges = edgesNew;
                            edgesNew = [];
                            translatedCount = 0;
                            window.setTimeout(doIteration, 0);
                        }
                    }
                    else
                        window.setTimeout(doIteration, 0);
                };
                //if (edge.sc_addr)
                //    throw "Edge already have sc-addr";
                var src = edge.points[0].scAddr;
                var trg = edge.points[1].scAddr;
                if (src && trg) {
                    window.sctpClient.create_arc(edge.scType, src, trg).done(function(r) {
                        edge.setScAddr(r);
                        if (addrStruct != null){
                            window.sctpClient.create_arc(sc_type_arc_pos_const_perm, addrStruct, r).fail(function() {
                                console.log('Error while create arc from struct ' + addrStruct + " - " + r);
                            });
                        }
                        translatedCount++;
                        nextIteration();
                    }).fail(function() {
                        console.log('Error while create arc');
                    });
                } else {
                    edgesNew.push(edge);
                    nextIteration();
                }
            }
            if (edges.length > 0)
                window.setTimeout(doIteration, 0);
            else
                dfd.resolve();
            return dfd.promise();
        };
        fQueue.Queue(
            fQueue.Func(translateStruct),
            fQueue.Func(translateNodes),
            fQueue.Func(translateEdges)
        ).done(fireCallback);
    }

};

