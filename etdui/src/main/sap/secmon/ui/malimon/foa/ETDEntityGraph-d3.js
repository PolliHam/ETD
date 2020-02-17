/* globals d3, color:true */
/* exported entitygraph */
$.sap.declare("sap.secmon.ui.malimon.foa.ETDEntityGraph-d3");
$.sap.require("sap.ui.thirdparty.d3");

/**
 * d3 implementation of EntityGraph: based on the force directed graph. It is configuration driven. Zooming is enabled. It is possible to select multiple alerts. NodePress event triggered with mouse
 * click. Tooltip is shown with mouse move
 * 
 * Usage:
 * 
 * oETDEntityGraph = entitygraph().settings(aaDisplaySettings); oRoot.call(oETDEntityGraph);
 * 
 * @see: ETDEntityGraph.js
 */

function entitygraph() {
    var width = window.innerWidth, height = window.innerHeight;
    var settings;
    var data, scale = 1.0;
    var tooltip, focus;

    // force layout settings
    var linkStrength = 1;
    var linkDistance = 100;
    var friction = 0.9;
    var charge = -300;
    var alpha = 0.1;
    var theta = 0.8;
    var gravity = 0.1;

    // var enableCollisionDetection = false;

    // default margin, can be overwritten
    var margin = {
        top : 25,
        bottom : 25,
        left : 20,
        right : 20
    };
        
    var dispatch = d3.dispatch("select", "nodePress");

    // inner function definition
    function my(root) {

        if ($.isEmptyObject(data) || $.isEmptyObject(data.nodes)) {
            return;
        }

        var _force = d3.layout.force();
        _force.size([ width, height ]);
        _force.nodes(data.nodes);
        _force.links(data.links);
        _force.linkStrength(linkStrength);
        _force.linkDistance(linkDistance * scale);
        _force.friction(friction);
        _force.charge(charge);
        _force.alpha(alpha);
        _force.theta(theta);
        _force.gravity(gravity);
        _force.start();

        var svg = d3.select(root[0][0].parentNode);

        // --> Helper functions
        // create extra 8 point around a node for the hull
        var createHullPath =
                function(d) {
                    var aPoints = [];
                    if (d.length === 1 || d.length === 2) { // This adjusts convex hulls
                        // for groups with fewer than 3 nodes by addingvirtual nodes.
                        aPoints = [ [ d[0].x + 0.001, d[0].y - 0.001 ], [ d[0].x - 0.001, d[0].y + 0.001 ], [ d[0].x - 0.001, d[0].y + 0.001 ] ];
                    }
                    d.forEach(function(element) {
                        var iSize = settings[element.type].size;
                        aPoints =
                                aPoints.concat([ // "0.7071" is the sine and
                                // cosine of 45 degree for corner points.
                                [ (element.x), (element.y + (2 + iSize)) ], [ (element.x + 0.7071 * (2 + iSize)), (element.y + 0.7071 * (2 + iSize)) ], [ (element.x + (2 + iSize)), (element.y) ],
                                        [ (element.x + 0.7071 * (2 + iSize)), (element.y - 0.7071 * (2 + iSize)) ], [ (element.x), (element.y - (2 + iSize)) ],
                                        [ (element.x - 0.7071 * (2 + iSize)), (element.y - 0.7071 * (2 + iSize)) ], [ (element.x - (2 + iSize)), (element.y) ],
                                        [ (element.x - 0.7071 * (2 + iSize)), (element.y + 0.7071 * (2 + iSize)) ] ]);
                    });
                    return "M" + d3.geom.hull(aPoints).join("L") + "Z";
                };

        // draw the hull
        var drawHull = function(aSelected) {
            var hull = svg.selectAll("path.hull");

            if (hull.empty()) {
                hull = svg.append("path").attr("class", "hull");
            }
            hull.datum(aSelected.data()).attr("d", function(d) {
                return createHullPath(d);
            });
        };

        // check if this point in included in the polygon
        var isPointInPolygon = function(point, vs) {
            // ray-casting algorithm based on
            // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
            var xi, xj, yi, yj, intersect, x = point[0], y = point[1], inside = false;
            for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
                xi = vs[i][0], yi = vs[i][1], xj = vs[j][0], yj = vs[j][1], intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                if (intersect) {
                    inside = !inside;
                }
            }
            return inside;
        };

        // --> Enter

        // render links first
        var link = root.selectAll('.link').data(_force.links()).enter().append("line").classed("link", true).style({
            "stroke" : function(d) {
                return d.role === 1 ? "#FFDD39" : d.role === 2 ? "#007CC0" : d.role === 3 ? "#00A414" : "#999";
            },
            "stroke-width" : "1px"
        }).on("mouseover", function(d, i) {
            if (!d.role) {
                return;
            }

            var s = svg.select("rect.selection");
            if (!s.empty()) {
                s.remove;
            }

            if (d3.event.defaultPrevented) {
                return; // ignore drag
            }

            d3.event.stopPropagation();

            tooltip.style("opacity", 1);
            var sRole;
            switch (d.role) {
            case 1:
                sRole = "Acting";
                break;
            case 2:
                sRole = "Targeted";
                break;
            case 3:
                sRole = "Acting & Targeted";
                break;
            }

            // we disoplay only the type and its id=name
            var sContent = "<table><tr>";
            sContent += "<td style='text-align: right;'>" + "Role" + ":</td>";
            sContent += "<td>" + sRole + "</td>";
            sContent += "</tr></table>";

            tooltip.html(sContent).style("left", function(d) {
                // x coordinate
                var divWidth = d3.select(this).property("offsetWidth");
                return (d3.event.pageX - 0.5 * divWidth) + "px";
            }).style("top", function(d) {
                // y coordinate
                var divHeight = d3.select(this).property("offsetHeight");
                // always put on top of the mouse
                return (d3.event.pageY - divHeight - 20) + "px";
            });
        }).on("mouseout", function() {
            tooltip.html("");
            tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");
        });

        // render nodes with id
        var node = root.selectAll('.node').data(_force.nodes(), function(d) {
            return d.id;
        }).enter().append("g").classed("node", true);

        node.append('text').append("tspan").attr('text-anchor', 'start').attr('dominant-baseline', 'start').attr('font-family', "SAP-icons").attr("fill", function(d) {
            return d.type === "Generic" ? "#007CC0" : settings[d.type].color;
        }).text(function(d) {
            return d.type === "Generic" ? "\ue011" : settings[d.type].icon;
        });

        // show label for focused entitiy and investigation
        // TODO: better to use a dedicated flag
        node.filter(function(d) {
            return d.type.indexOf(focus) >= 0 || d.type === "Investigation";
        }).selectAll('text').append("tspan").classed("label", true).attr('text-anchor', 'middle').attr('dominant-baseline', 'central').text(function(d) {
            return d.name;
        });

        // drag nodes
        var dragNode = _force.drag().on("dragstart", function() {
            d3.event.sourceEvent.stopPropagation();
        });

        node.call(dragNode);

        function redraw() {
            var w = _force.size()[0];
            var h = _force.size()[1];

            link.attr("x1", function(d) {
                return d.source.x;
            }).attr("y1", function(d) {
                return d.source.y;
            }).attr("x2", function(d) {
                return d.target.x;
            }).attr("y2", function(d) {
                return d.target.y;
            });

            node.attr("transform", function(d) {
                // Consider 'centered' property
                if (d.centered) {
                    d.x = w / 2;
                    d.y = h / 2;
                }

                // limit x/y coordinates to min/max of force layout
                var radius = d.radius || 7;
                d.x = Math.max(radius, Math.min(w - radius, d.x)) || 0;
                d.y = Math.max(radius, Math.min(h - radius, d.y)) || 0;
                return "translate(" + d.x + "," + d.y + ")";
            });
        }

        _force.on("tick", redraw);
        _force.on("end", function() {
            var aSelected = node.filter(".selected").filter(function(d) {
                return d.type === "Alert";
            });
            // draw a hull for multiple selection
            if (!aSelected.empty()) {
                drawHull(aSelected);
            }
        });

        // --> Update
        root.selectAll('.node').attr('font-size', function(d) {
            return (d.type === "Generic" ? 20 : settings[d.type].size) * scale + "px";
        }).filter(function(d) {
            return d.type.indexOf(focus) >= 0 || d.type === "Investigation";
        }).selectAll('text tspan.label').attr('font-size', function(d) {
            return (d.type === "Generic" ? 20 : 0.5 * settings[d.type].size) * scale + "px";
        }).attr("y", function(d) {
            return 0.8 * settings[d.type].size * scale;
        });

        // --> Exit
        root.selectAll('.link').data(_force.links()).exit().remove();
        root.selectAll('.node').data(_force.nodes()).exit().remove();

        // assign mouse events on node
        node.on("click", function(n) {
            if (d3.event.defaultPrevented) {
                return; // click suppressed, e.g. on drag
            }

            // don't let it bubble up further
            d3.event.stopPropagation();

            var currentNode = d3.select(d3.event.currentTarget);

            // toggle selection of node
            // Windows: ctrlKey; Mac: metaKey
            if (d3.event.ctrlKey || d3.event.metaKey) {
                if (currentNode.datum().type === "Alert") {
                    currentNode.classed("selected", !currentNode.classed("selected"));
                    node.filter("*:not(.selected)").style("opacity", function() {
                        return 0.1;
                    });
                    node.filter(".selected").style("opacity", function() {
                        return 1;
                    });

                    drawHull(node.filter(".selected"));
                }
            } else {
                node.style("opacity", function(n1) {
                    return (n === n1) ? 1 : 0.1;
                });

                // fire the nodepress event
                dispatch.nodePress(n);
            }
        }).on("mousemove", function(d, i) {
            var s = svg.select("rect.selection");
            if (!s.empty()) {
                s.remove;
            }

            if (d3.event.defaultPrevented) {
                return; // ignore drag
            }

            d3.event.stopPropagation();

            tooltip.style("opacity", 1);

            // we disoplay only the type and its id=name
            var sContent = "<table><tr>";
            sContent += "<td style='text-align: right;'>" + d.type + ":</td>";
            sContent += "<td>" + d.name + "</td>";
            sContent += "</tr></table>";

            tooltip.html(sContent).style("left", function(d) {
                // x coordinate
                var divWidth = d3.select(this).property("offsetWidth");
                return (d3.event.pageX - 0.5 * divWidth) + "px";
            }).style("top", function(d) {
                // y coordinate
                var divHeight = d3.select(this).property("offsetHeight");
                // always put on top of the mouse
                return (d3.event.pageY - divHeight - 20) + "px";
            });
        }).on("mouseout", function(d, i) {
            // move the tooltip to the top-left corner and empty its content
            // trying to avoid the situation that this hidden tooltip blocks the
            // underlying area, which won't get the mouse events
            tooltip.html("");
            tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");
        });

        // assign event for SVG object
        // enable zooming, disable panning
        svg.call(d3.behavior.zoom().on("zoom", function() {
            scale = d3.event.scale;
            _force.stop();

            root.selectAll('.node').select('text tspan').attr('font-size', function(d) {
                return (d.type === "Generic" ? 20 : settings[d.type].size) * scale + "px";
            });
            root.selectAll('.node').filter(function(d) {
                return d.type.indexOf(focus) >= 0 || d.type === "Investigation";
            }).selectAll('text tspan.label').attr('font-size', function(d) {
                return (d.type === "Generic" ? 20 : 0.5 * settings[d.type].size) * scale + "px";
            }).attr("y", function(d) {
                return 0.8 * settings[d.type].size * scale;
            });
            _force.linkDistance(linkDistance * scale * 0.8);

            _force.start();
        })).on("mousedown.zoom", null); // disable panning

        svg.on("mousedown", function() {

            if (d3.event.ctrlKey || d3.event.metaKey) {
                return;
            }

            var s = svg.select("rect.selection");

            if (!s.empty()) {
                s.remove();
                d3.selectAll('.node.selected').classed("selected", false);
                node.filter("*:not(.selected)").style("opacity", function() {
                    return 1;
                });
                // after removing selection resume the simulation
                _force.resume();
            } else if (svg.selectAll("path.hull").empty()) {
                var p = d3.mouse(this);

                // stop simulation so that we can select
                _force.stop();
                svg.append("rect").attr({
                    x0 : p[0],
                    y0 : p[1],
                    rx : 6,
                    ry : 6,
                    class : "selection",
                    x : p[0],
                    y : p[1],
                    width : 0,
                    height : 0
                });
            }
        }).on("mousemove", function() {
            if (d3.event.ctrlKey || d3.event.metaKey) {
                return;
            }

            if (d3.event.defaultPrevented) {
                return; // ignore drag
            }

            var s = svg.select("rect.selection");

            if (!s.empty()) {
                var p = d3.mouse(this),

                d = {
                    x0 : +s.attr("x0"),
                    y0 : +s.attr("y0"),
                    x : +s.attr("x"),
                    y : +s.attr("y"),
                    width : +s.attr("width"),
                    height : +s.attr("height")
                };

                if (p[0] < d.x0) {
                    d.width = d.x0 - p[0];
                    d.x = p[0];
                } else {
                    d.width = p[0] - d.x0;
                }

                if (p[1] < d.y0) {
                    d.height = d.y0 - p[1];
                    d.y = p[1];
                } else {
                    d.height = p[1] - d.y0;
                }

                s.attr(d);

                // deselect all temporary selected state objects
                d3.selectAll('.node.selected').classed("selected", false);

                d3.selectAll('.node').filter(function(nodeData) {
                    return nodeData.x - 12 >= d.x && nodeData.x + 12 <= d.x + d.width && nodeData.y - 12 >= d.y && nodeData.y + 12 <= d.y + d.height;
                }).filter(function(d) {
                    return d.type === "Alert";
                }).classed("selected", true);
            }
        }).on("mouseup", function() {
            if (d3.event.ctrlKey || d3.event.metaKey) {
                return;
            }

            var s = svg.select("rect.selection");

            if (!s.empty()) { // end of selection | outside of selection
                // if the selected nodes are not empty
                var aSelected = node.filter(".selected").filter(function(d) {
                    return d.type === "Alert";
                });

                if (aSelected.empty()) {
                    s.remove();
                    d3.selectAll('.node.selected').classed("selected", false);
                    node.filter("*:not(.selected)").style("opacity", function() {
                        return 1;
                    });
                } else {
                    node.style("opacity", function() {
                        return 0.1;
                    });
                    node.filter(".selected").style("opacity", function() {
                        return 1;
                    });

                    // draw a hull for multiple selection
                    drawHull(aSelected);

                    // get rid of the rect for selection
                    s.remove();
                }
            } else { // click on the hull after selection for the popup
                var p = d3.mouse(this);

                var hullPoints = [];
                var pathNode = svg.selectAll("path.hull").node();
                if (pathNode) {
                    var hullLength = pathNode.getTotalLength();
                    for (var i = 0; i < 100; i++) {
                        hullPoints[i] = pathNode.getPointAtLength(i * hullLength / 20);
                    }
                    if (isPointInPolygon(p, hullPoints.map(function(d) {
                        return [ d.x, d.y ];
                    }))) {
                        // fire the select event
                        dispatch.select(pathNode, node.filter(".selected").data());
                    } else {
                        s.remove();
                        svg.selectAll("path.hull").remove();

                        _force.resume();

                        d3.selectAll('.node.selected').classed("selected", false);
                        node.filter("*:not(.selected)").style("opacity", function() {
                            return 1;
                        });
                    }
                } else {
                    _force.resume();
                }
            }
        });
    }

    // d3's standard way of dispatching events
    my = d3.rebind(my, dispatch, "on");

    my.removeSelection = function() {
        // remove the rectangle if exists
        d3.select("rect.selection").remove();

        // turn on the opacity for unselected
        d3.selectAll('.node.selected').classed("selected", false);
        d3.selectAll('.node').style("opacity", function() {
            return 1;
        });

        // remove the hull
        d3.selectAll("path.hull").remove();
    };

    my.findNeighbors = function(oNode) {
        var aNeighbors = [];
        var aaNeighbors = {};
        d3.selectAll(".link").each(function(oLink) {
            if (oLink && oLink.source === oNode) {
                aaNeighbors[oLink.target.id] = oLink.target;
            }
            if (oLink && oLink.target === oNode) {
                aaNeighbors[oLink.source.id] = oLink.source;
            }
        });
        for ( var key in aaNeighbors) {
            aNeighbors.push(aaNeighbors[key]);
        }
        return aNeighbors;
    };

    my.triggerNodePress = function(sNodeId, bFireEvent) {
        var node = d3.selectAll(".node");
        node.filter(function(d) {
            return d.id === sNodeId;
        }).each(function(n, i) {
            node.style("opacity", function(n1) {
                return (n === n1) ? 1 : 0.1;
            });
            // fire the nodepress event
            // somehow .filter returns 2 items and the event was triggered 2
            // times => dummy fix
            if (i === 0 && bFireEvent) {
                dispatch.nodePress(n);
            }
        });
    };

    // rewrite properties
    my.settings = function(value) {
        if (!arguments.length) {
            return settings;
        } else {
            settings = value;
            return my;
        }
    };

    my.focus = function(value) {
        if (!arguments.length) {
            return focus;
        } else {
            focus = value;
            return my;
        }
    };

    my.width = function(value) {
        if (!arguments.length) {
            return width;
        } else {
            width = value;
            return my;
        }
    };

    my.height = function(value) {
        if (!arguments.length) {
            return height;
        } else {
            height = value;
            return my;
        }
    };

    my.margin = function(value) {
        if (!arguments.length) {
            return margin;
        } else {
            margin = value;
            return my;
        }
    };

    my.color = function(value) {
        if (!arguments.length) {
            return color;
        } else {
            color = value;
            return my;
        }
    };

    my.data = function(value) {
        if (!arguments.length) {
            return data;
        } else {
            data = value;
            return my;
        }
    };

    my.tooltip = function(value) {
        if (!arguments.length) {
            return tooltip;
        } else {
            tooltip = value;
            return my;
        }
    };

    return my;
}