/* globals d3, oTextBundle, tooltip:true */
/* exported attackPath */
$.sap.declare("sap.secmon.ui.malimon.AttackPath-d3");
$.sap.require("sap.ui.thirdparty.d3");

function attackPath() {
    var width, height;
    var showUTC;
    var data;

    // callbacks
    var onNodeLeftClick;
    var onNodeRightClick;

    // prevents tooltip during drag. defaultPrevented() not applicable?
    var dragging = false;

    var margin = {
        // Distance of element path to containing window
        top : 65,
        bottom : 100,
        left : 150,
        right : 150,
        // Distance of Element describing text to Element circle
        text : 16,
    // distance from surrounding rect to inner text
    // rectHeight : 4,
    // rectWidth : 4,
    };

    var size = {
        "node" : 14
    };

    var offset = {
        // distance a label has to an element
        "labelX" : 10,
        "labelY" : 10,
        // distance correlations have to each other when drawn
        "correlation" : 25,
        // distance correlations have to each other when they are being grouped
        "correlationGrouping" : 14,
    // "nodesY" : 200
    };

    // Opacity of the elements
    var opacity = {
        // "selectRect" : 0.4,
        "selectRectStroke" : 0.5,
        "nodeCircleFillActive" : 1,
        "nodeCircleFillInactive" : 0.6,
        "nodeCircleStroke" : 0.8,
        "corCircleFill" : 1,
        "line" : 0.3,
        "corCircleStroke" : 0.7,
        "text" : 1,
        "scaleDeco" : 0.3
    };

    // duration of transitions
    var duration = {
        "text" : 700,
        "textFade" : 700,
        "lineFade" : 700,
        "line" : 1000,
        "circle" : 700,
        "circleFade" : 550,
        "circleStroke" : 250,
        "circleGrouping" : 500,
        "nodeUpdate" : 350,
        "nodeEnter" : 700
    };

    // var deselectLock = {};

    function my(root) {
        if ($.isEmptyObject(data) || !(data.nodes && data.nodes.length)) {
            return;
        }

        var extent = d3.extent(data.nodes, function(d) {
            return d.timestamp;
        });

        var iPadding = (extent[1].getTime() - extent[0].getTime()) * 0.05;
        if (!iPadding) {
            iPadding = 500;
        }
        var paddedExtent = [];
        paddedExtent.push(extent[0].getTime() - iPadding);
        paddedExtent.push(extent[1].getTime() + iPadding);

        var axisStart = (margin.left * 0.4);
        var axisEnd = width - (margin.right * 0.4);
        var x;
        if (showUTC) {
            x = d3.time.scale.utc().domain(paddedExtent).range([ axisStart, axisEnd ]);
        } else {
            x = d3.time.scale().domain(paddedExtent).range([ axisStart, axisEnd ]);
        }
        var xAxis = d3.svg.axis().scale(x).ticks(5);

        // var xAxisWidth = width - (margin.left / 2) - (margin.right / 2);
        // var x = d3.time.scale.utc().domain(d3.extent(data.nodes, function(d) {
        // return d.timestamp;
        // })).range([ (margin.left / 2), ((margin.left / 2) + xAxisWidth) ]);
        // var xAxis = d3.svg.axis().scale(x).ticks(5);

        var pathsArea = root.select("g.PathsArea");
        // If the pathsarea doesn't yet exist, initiate it
        if (pathsArea.empty()) {
            // Group for everything
            pathsArea = root.append("g").classed("PathsArea", true).attr("x", 0).attr("y", 0);
            // Group for xAxis
            pathsArea.append("g").attr("id", "xAxis");
            // group for the "decoration", lines by the axis scale and the end of the svg
            pathsArea.append("path").attr("id", "DecorationPath");
            // rectangle used to visualize selection when draggin the background
            pathsArea.append("rect").attr("id", "selectRect");
            // Background used for click, doubleclick and drag
            var bgRect = pathsArea.append("rect").attr("id", "backgroundRect");

            // dragging beahvior for background, aka multiselect
            var backGroundDrag = d3.behavior.drag();
            backGroundDrag.on("dragstart", function() {
                dragging = true;
                // d3.event.sourceEvent.stopPropagation();

                var rect = pathsArea.select("#selectRect");
                var c = d3.mouse(pathsArea.node());
                rect.attr("x", c[0]).attr("y", c[1]).attr("rx", 6).attr("ry", 6);
                rect.attr("fill", "transparent").attr("stroke", "gray");
                rect.attr("stroke-dasharray", "4px").attr("stroke-opacity", opacity.selectRectStroke);

                // save starting coordinates in the selection rect
                rect.datum(c);
            }).on("drag", function() {
                var rect = pathsArea.select("#selectRect");
                var c = rect.datum();

                // if the mouse is smaller than the original x coordinate, the origin of the rect has to be moved instead
                if (d3.event.x < c[0]) {
                    rect.attr("x", d3.event.x);
                    rect.attr("width", c[0] - d3.event.x);
                } else {
                    rect.attr("width", d3.event.x - c[0]);
                }

                // if the mouse is smaller than the original y coordinate, the origin of the rect has to be moved instead
                if (d3.event.y < c[1]) {
                    rect.attr("y", d3.event.y);
                    rect.attr("height", c[1] - d3.event.y);
                } else {
                    rect.attr("height", d3.event.y - c[1]);
                }

            }).on("dragend", function() {
                var rect = pathsArea.select("#selectRect");
                var lowX, highX, lowY, highY;

                // if the origin of rect is different then it used to be, the mouse moved left
                if (rect.datum()[0] > rect.attr("x")) {
                    // the low x coordinate is the new origin one
                    lowX = rect.attr("x");
                    // the highx cordinate is the old origin
                    highX = rect.datum()[0];
                } else {// if mouse moved right
                    // the low x is the old (and still current) origin
                    lowX = rect.datum()[0];
                    // the high x on the right side of the rect, origin + width
                    highX = parseInt(rect.attr("x")) + parseInt(rect.attr("width"));
                }

                // behaves like x
                if (rect.datum()[1] > rect.attr("y")) {
                    lowY = rect.attr("y");
                    highY = rect.datum()[1];
                } else {
                    lowY = rect.datum()[1];
                    highY = parseInt(rect.attr("y")) + parseInt(rect.attr("height"));
                }

                // All gs for elements that could be selected
                var elements = pathsArea.selectAll("g.node:not(.Apactive),g.correlation.Apactive:not(.selected):not(.highlighting)").filter(function() {
                    // filter for elements that lie insead the draw rect
                    var circle = d3.select(this).select("circle");
                    var cX = parseInt(circle.attr("cx"));
                    var cY = parseInt(circle.attr("cy"));
                    return ((cX >= lowX && cX <= highX) && (cY >= lowY && cY <= highY));
                });

                // activate all elements that are left
                elements.filter("g.node:not(.Apactive)").each(function(d) {
                    d3.select(this).call(activateNodes);
                });
                elements.filter("g.correlation.Apactive:not(.selected)").call(selectCorrelations);

                pathsArea.selectAll("g.connection.connectsFromIsActive.connectsToIsActive:not(.Apactive)").call(activateConnections);

                rect.attr("x", 0).attr("y", 0).attr("zx", 0).attr("zy", 0).attr("fill", "none");
                rect.attr("stroke-opacity", 0).attr("stroke-dasharray", null).attr("stroke", "none");
                rect.attr("width", 0).attr("length", 0);

                dragging = false;
            });

            bgRect.attr("x", 0).attr("y", 0);
            bgRect.attr("fill", "WHITE").attr("opacity", 0);
            bgRect.on("click", function() {
                if (d3.event.defaultPrevented) {
                    return;
                }
                d3.event.stopPropagation();

                pathsArea.selectAll("g.correlation.Apactive.selected,g.correlation.Apactive.highlighting").call(deselectCorrelations);

                highlightCorrelations();
            });
            bgRect.on("dblclick", function() {
                if (d3.event.defaultPrevented) {
                    return;
                }

                d3.event.stopPropagation();

                pathsArea.selectAll("g.node.Apactive").call(deactivateNodes);
                pathsArea.selectAll("g.connection.Apactive").call(deactivateConnections);
            }).call(backGroundDrag);

            // Creates drawing order (connections over nodes over links)
            pathsArea.append("g").classed("links", true);
            pathsArea.append("g").classed("nodes", true);
            pathsArea.append("g").classed("connections", true);
        }

        // span background to the entire area
        pathsArea.select("#backgroundRect").attr("width", width).attr("height", height);

        var xAxisG = pathsArea.select("#xAxis");

        // position yAxis
        xAxisG.attr("transform", function() {
            return "translate(0," + (height - margin.bottom * 0.8) + ")";
        }).call(xAxis.orient("bottom")).select("path.domain").attr("fill", "none").attr("stroke", "BLACK").attr("stroke-width", "1px");

        xAxisG.selectAll("line").attr("y2", (height - margin.bottom * 0.8) * (-1)).attr("stroke", "GREY").attr("stroke-opacity", opacity.scaleDeco);

        // decorate area
        pathsArea.select("#DecorationPath").attr("d", function() {
            var sPath, yCord = height - (margin.bottom * 0.8);
            sPath = " M 0 " + yCord + " l " + width + " 0 ";
            // sPath += "M 0 " + margin.top + " l " + width + " 0 ";
            sPath += "M " + (width - 1) + " 0 L " + (width - 1) + " " + height + " ";
            return sPath;
        }).attr("stroke", "BLACK").attr("stroke-wdith", "1px").attr("stroke-opacity", opacity.scaleDeco);

        // prevents click during drag
        pathsArea.on("touchstart", function() {
            d3.event.preventDefault();
        });
        pathsArea.on("touchmove", function() {
            d3.event.preventDefault();
        });

        var linksG = pathsArea.select(".links");
        var nodesG = pathsArea.select(".nodes");
        var correlationsG = pathsArea.select(".connections");

        // Dragging behavior for nodes
        var nodeDrag = d3.behavior.drag();
        nodeDrag.on("dragstart", function(d) {
            if (d3.event.sourceEvent.button === 0) { // only for left mouse drags
                // dragging is used to stop mouseovers
                dragging = true;
                d3.event.sourceEvent.stopPropagation();
                onNodeLeftClick({
                    "id" : d.id,
                    "domElem" : this.firstElementChild
                });
            }
        }).on("drag", function(d) {
            if (dragging) {
                var circle = d3.select(this).select("circle");
                var circleR = parseInt(circle.attr("r"));
                // lines connection to our node
                var lines = pathsArea.selectAll("line.link.Apactive").filter(function(dl) {
                    return dl.node.id === d.id;
                });

                var iDragNewY = d3.event.y;
                if (d3.event.y > (height - margin.bottom * 0.8) - circleR - 1) {
                    iDragNewY = (height - margin.bottom * 0.8) - circleR - 1;
                } else if (d3.event.y < circleR) {
                    iDragNewY = circleR;
                }

                circle.attr("cy", iDragNewY);
                d.y = iDragNewY;
                lines.attr("y1", iDragNewY);

                if (d3.select(this).classed("Apactive")) {
                    d3.select(this).select("text").attr("y", iDragNewY - margin.text);
                }
            }
        }).on("dragend", function(d) {
            if (dragging) {
                dragging = false;
            }
        });

        // Dragging behavior for circle part of the connections
        var correlationDrag = d3.behavior.drag();
        correlationDrag.on("dragstart", function() {
            // dragging prevents the pop-over on hover
            if (d3.event.sourceEvent.button === 0) {
                dragging = true;
                d3.event.sourceEvent.stopPropagation();
            }
        }).on("drag", function(d) {
            if (dragging) {
                var correlationG = d3.select(this);
                var circle = correlationG.select("circle");
                var text = correlationG.select("text");
                var lines = pathsArea.selectAll("line." + d.id);

                if (d3.event.x < width && d3.event.x > 0) {
                    circle.attr("cx", d3.event.x);
                    d.x = d3.event.x;
                    if (correlationG.classed("selected") || correlationG.classed("highlighting")) {
                        text.attr("x", (offset.labelX + d3.event.x));
                    }
                }

                if (d3.event.y < height && d3.event.y > 0) {
                    circle.attr("cy", d3.event.y);
                    circle.datum().y = d3.event.y;
                    if (correlationG.classed("selected") || correlationG.classed("highlighting")) {
                        text.attr("y", (offset.labelY + d3.event.y));
                    }
                }
                drawLines(lines);
            }
        }).on("dragend", function(d) {
            if (dragging) {
                dragging = false;
            }
        });

        // Selection
        var nodeGroups = nodesG.selectAll("g.node").data(data.nodes, function(d) {
            return d.id;
        }).each(function(d) {
            // select ensures data propagation

            var g = d3.select(this);
            var circle = g.select("circle");

            d.x = x(d.timestamp);
            d.y = parseInt(circle.attr("cy"));

            g.select("text").attr("x", d.x).attr("y", d.y - margin.text).text(d.elementName);
            circle.attr("cx", d.x);
        });

        nodeGroups.selectAll("circle").attr("cx", function(d) {
            d.x = x(d.timestamp);
            return x(d.timestamp);
        });

        var linkLines = linksG.selectAll("line.link").data(data.links, function(d) {
            return d.node.id + d.correlation.connectsFrom + d.correlation.connectsTo + d.correlation.value + d.correlation.id;
        });
        var connectionGroups = correlationsG.selectAll("g.connection").data(data.connections, function(d) {
            return d.id;
        });

        /*
         * Enter
         */

        // Enter Connections
        connectionGroups.enter().append("g").classed("connection", true);

        // select groups for circles
        var correlationGroups = connectionGroups.selectAll("g").data(function(d) {
            return d.correlations;
        }, function(d) {
            return d.fromProperty + d.toProperty + d.value;
        });

        // Enter lines
        linkLines.enter().append("line").attr("class", function(d) {
            return d.correlation.id;
        }).classed("link", true);

        // Enter Nodes
        var enteringNG = nodeGroups.enter().append("g").classed("node", true);
        var enteringNCircles = enteringNG.append("circle").attr("r", size.node).attr("cx", function(d) {
            d.x = x(d.timestamp);
            return x(d.timestamp);
        }).attr("cy", function(d, i) {
            // evenly distribute the event-nodes in the svg.
            var cordY = (height - (margin.bottom * 0.8 + size.node)) / data.nodes.length * i + margin.top * 0.8;
            return cordY;
        });

        enteringNCircles.transition().each("start", function(d) {
            var circle = d3.select(this);
            circle.attr("fill", "yellow").attr("opacity", 1);
        }).delay(150).duration(duration.nodeEnter)//
        .style("Fill", sap.ui.core.theming.Parameters.get("sapUiChart2"))//
        .attr("opacity", opacity.nodeCircleFillInactive);

        enteringNG.append("text").attr("text-anchor", "middle").attr("cursor", "default").attr("visibility", "hidden");
        enteringNG.on("mouseover", function(d, i) {
            if (dragging) {
                return; // ignore while dragging
            }
            // The tooltip feature is like in Event-Series
            // only show tooltip after 500ms delay
            var event = d3.event;
            this.hoverTimeout = setTimeout(showTooltip.bind(this), 500, d, i, event);

            function showTooltip(d, i, event) {
                tooltip.style("opacity", 1);

                // we display only the type and its id=name
                var sContent = "<table><tr>";
                sContent += "<td style='text-align: right;'>" + oTextBundle.getText("MM_LBL_elementId") + ": " + "</td>";
                sContent += "<td>" + d.id + "</td>";
                sContent += "</tr><tr>";
                sContent += "<td style='text-align: right;'>" + oTextBundle.getText("MM_LBL_timestamp") + ": " + "</td>";
                sContent += "<td>" + d.timestamp.displayTime + "</td>";
                sContent += "</tr>";
                sContent += "</table>";

                tooltip.html(sContent).style("left", function() {
                    // x coordinate
                    var divWidth = d3.select(this).property("offsetWidth");
                    var x = 0;

                    if (width - event.x < divWidth) {
                        x = width - divWidth;
                    } else if (divWidth <= event.x) {
                        x = event.x - (divWidth / 2);
                    }

                    return x + "px";
                }).style("top", function() {
                    // y coordinate
                    var divHeight = d3.select(this).property("offsetHeight");
                    // always put on top of the mouse
                    return (event.pageY - divHeight - 35) + "px";
                });
            }

        }).on("mouseout", function() {
            clearTimeout(this.hoverTimeout);
            tooltip.html("");
            tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");

        }).on("click", function(d) {
            if (d3.event.defaultPrevented) {
                return;
            }
            d3.event.stopPropagation();

            var g = d3.select(this);

            if (!g.classed("Apactive")) {
                g.call(activateNodes);
                pathsArea.selectAll("g.connection.connectsFromIsActive.connectsToIsActive:not(.Apactive)").call(activateConnections);

            } else if (g.classed("Apactive")) {
                g.call(deactivateNodes);
                pathsArea.selectAll("g.connection.Apactive:not(.connectsFromIsActive), g.connection.Apactive:not(.connectsToIsActive)").call(deactivateConnections);
            }
            onNodeLeftClick({
                "id" : d.id,
                "domElem" : this.firstElementChild
            });

            // Draws a "path", activating every element in a chain of primary connections
        }).on("dblclick", function(d) {
            if (d3.event.defaultPrevented) {
                return;
            }
            d3.event.stopPropagation();

            var aaIdsOfPath = {};
            var currEle = d;

            aaIdsOfPath[d.id] = true;

            // while there is still a next primary element
            while (currEle.primaryConnection) {
                currEle = currEle.primaryConnection.connectsTo;
                aaIdsOfPath[currEle.id] = true;
            }

            // filter for all elements that are in the primary connections of our path
            pathsArea.selectAll("g.node").filter(function(d) {
                return aaIdsOfPath[d.id];
            }).call(activateNodes);
            d3.selectAll("g.connection.connectsFromIsActive.connectsToIsActive").call(activateConnections);

        }).on("contextmenu", function(d) {
            d3.event.preventDefault();
            onNodeRightClick({
                "id" : d.id,
                "domElem" : this.firstElementChild
            });
        }).call(nodeDrag);

        // Enter correlation (circles)
        var enteringCG = correlationGroups.enter().append("g").classed("correlation", true);
        // .attr("class", function(d) {
        // return d.id;
        // });
        enteringCG.append("text").attr("visibility", "hidden");
        enteringCG.append("circle").style("fill", "BLACK").attr("opacity", 0).attr("r", 0);

        enteringCG.on("mouseover", function(d, i) {
            if (dragging) {
                return; // ignore while dragging
            }

            tooltip.style("opacity", 1);

            var sContent = "<table><tr>";
            sContent += "<td style='text-align: right;'>" + oTextBundle.getText("MM_LBL_fromProp") + ":" + "</td>";
            sContent += "<td>" + d.fromProperty + "</td>";
            sContent += "</tr><tr>";
            sContent += "<td style='text-align: right;'>" + oTextBundle.getText("MM_LBL_toProp") + ":" + "</td>";
            sContent += "<td>" + d.toProperty + "</td>";
            sContent += "</tr>";
            sContent += "</tr><tr>";
            sContent += "<td style='text-align: right;'>" + oTextBundle.getText("MM_LBL_withValue") + ":" + "</td>";
            sContent += "<td>" + d.value + "</td>";
            sContent += "</tr>";
            sContent += "</table>";

            tooltip.html(sContent).style("left", function() {
                // x coordinate(
                var divWidth = d3.select(this).property("offsetWidth");
                var x = 0;

                if (width - d3.event.x < divWidth) {
                    x = width - divWidth;
                } else if (divWidth <= d3.event.x) {
                    x = d3.event.x - (divWidth / 2);
                }

                return x + "px";
            }).style("top", function() {
                // y coordinate
                var divHeight = d3.select(this).property("offsetHeight");
                // always put on top of the mouse
                return (d3.event.pageY - divHeight - 20) + "px";
            });

        }).on("mouseout", function() {
            tooltip.html("");
            tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");

        }).on("click", function(d) {
            if (d3.event.defaultPrevented) {
                return;
            }

            d3.event.stopPropagation();

            if (d3.select(this).classed("selected") || d3.select(this).classed("highlighting")) {
                d3.select(this).call(deselectCorrelations);

            } else {
                var correlationG = d3.select(this);
                var circle = correlationG.select("circle");
                var text = correlationG.select("text");

                // show label
                if (!correlationG.classed("selected")) {
                    text.text(d.value)//
                    .attr("x", (offset.labelX + parseInt(circle.attr("cx"))))//
                    .attr("y", (offset.labelY + parseInt(circle.attr("cy"))))//
                    .attr("visibility", "visible").transition().duration(duration.text)//
                    .each("start", function() {
                        d3.select(this).attr("opacity", 0);
                    }).attr("opacity", 1);
                }

                // leave last selected marked as selected
                var lastSelection = pathsArea.select("g.correlation.highlighting");
                if (!lastSelection.empty()) {
                    lastSelection.call(selectCorrelations);
                }

                correlationG.classed("highlighted", false).classed("selected", false);

                // Mark as current source of highlights
                correlationG.classed("highlighting", true);
                circle.attr("stroke", "orange").attr("stroke-opacity", opacity.corCircleStroke);
                circle.transition().duration(duration.circleStroke).attr("stroke-width", 5)
                // go from 5 back to 3 for "bling" effect
                .transition().duration(duration.circleStroke).attr("stroke-width", 3);
                // Highlight based on current highlighting and remove old highlights

                highlightCorrelations();
            }
        }).on("dblclick", function(d) {
            if (d3.event.defaultPrevented) {
                return;
            }

            d3.event.stopPropagation();

            var highlightingCircle = d3.select(this).select("circle");
            var correlationGs = pathsArea.selectAll("g.correlation.Apactive:not(.highlighting)").filter(function(dc) {
                return dc.value === d.value;
            });
            var circles = correlationGs.selectAll("circle");

            if (!correlationGs.empty()) {
                // remove selected text before transition
                correlationGs.filter(".selected").classed("selected", false)//
                .selectAll("text").attr("x", 0).attr("y", 0).attr("opacity", 0).text("");

                // how many circles are placed next to each other
                var rowLength = Math.round(Math.sqrt(circles.length));
                var cX = parseInt(highlightingCircle.attr("cx"));
                var cY = parseInt(highlightingCircle.attr("cy"));

                var counter = 1;
                circles.each(function(d) {
                    // if a row is full, start in the next one on top
                    if (counter >= rowLength) {
                        counter = 0;
                        cY -= offset.correlationGrouping;
                    }

                    var circle = d3.select(this);
                    var xCord = cX - (offset.correlationGrouping * counter);
                    var yCord = cY;
                    var lines = pathsArea.selectAll("line.link." + d.id);

                    circle.transition("circleGrouping").each("end", function(d) {
                        var circle = d3.select(this).classed("highlighted", true);
                        circle.attr("stroke-width", 3).attr("stroke", "RED").attr("stroke-opacity", opacity.corCircleStroke);
                    }).delay(duration.circleStroke).duration(duration.circleGrouping).attr("cx", xCord).attr("cy", yCord);

                    lines.transition().delay(duration.circleStroke).duration(duration.circleGrouping).attr("x2", xCord).attr("y2", yCord);

                    d.x = xCord;
                    d.y = yCord;
                    counter++;
                });
            }

        }).call(correlationDrag);

        /*
         * Exit
         */

        nodeGroups.exit().remove();

        linkLines.exit().remove();

        correlationGroups.exit().remove();

        connectionGroups.exit().remove();

        /*
         * display new connections of activated nodes
         */

        nodeGroups.filter(".Apactive").call(activateNodes);
        d3.selectAll("g.connection.connectsFromIsActive.connectsToIsActive").call(activateConnections);

        highlightCorrelations();

        /*
         * Helper functions
         */

        function deselectCorrelations(correlationGs) {
            if (!correlationGs.empty()) {
                correlationGs.classed("selected", false).classed("highlighting", false);

                var circles = correlationGs.selectAll("circle");
                var texts = correlationGs.selectAll("text");

                circles.transition().delay(duration.circleGrouping + duration.circleStroke)//
                .duration(duration.circleStroke).attr("stroke-opacity", 0).attr("stroke-width", 0);

                texts.transition().each("end", function() {
                    d3.select(this).attr("x", 0).attr("y", 0).text("").attr("opacity", 0).attr("visibility", "hidden");
                }).duration(duration.textFade).attr("opacity", 0);
            }
            // in case highlighting has been deselected
            highlightCorrelations();
        }

        function deactivateConnections(connections) {
            connections.classed("Apactive", false);
            var lineSelector = [];

            // note all lines that are path of our connection
            var correlationGs = connections.selectAll("g.correlation").each(function(d) {
                lineSelector.push("line.link.Apactive." + d.id);
            });

            var circles = correlationGs.selectAll("circle");
            var texts = correlationGs.filter(".selected,.highlighting").selectAll("text");

            correlationGs.classed("Apactive", false).classed("selected", false)//
            .classed("highlighting", false).attr("pointer-events", "none");

            circles.transition().each("end", function() {
                d3.select(this).attr("stroke", "none");
            }).duration(duration.circleStroke).attr("stroke-opacity", 0).attr("stroke-width", 0)//
            .transition().each("end", function() {
                d3.select(this).attr("cx", 0).attr("cy", 0).attr("r", 0).attr("opacity", 0);
            }).delay(duration.lineFade - duration.circleStroke).duration(duration.circleFade).attr("opacity", 0);

            texts.transition().duration(duration.textFade).each("end", function() {
                d3.select(this).attr("x", 0).attr("y", 0).attr("visibility", "hidden").text("");
            }).attr("opacity", 0);

            highlightCorrelations();
            // array toString for "selector,selector,selector" format
            if (lineSelector.length) {
                pathsArea.selectAll(lineSelector.toString()).call(deactivateLines);
            }
        }

        function deactivateNodes(nodes) {
            nodes.classed("Apactive", false);

            var circles = nodes.selectAll("circle");
            circles.transition().duration(duration.circleFade).each("end", function() {
                d3.select(this).attr("stroke", "None").attr("stroke-width", 0)//
                .attr("stroke-opacity", 0).attr("opacity", opacity.nodeCircleFillInactive);
            }).attr("opacity", opacity.nodeCircleFillInactive).attr("stroke-opacity", 0);

            var texts = nodes.selectAll("text");
            texts.transition().duration(duration.textFade).each("end", function() {
                d3.select(this).text("").attr("x", 0).attr("y", 0).attr("visibility", "hidden");
            }).attr("opacity", 0);

            // Mark connections, so they can be deselected if nescessary
            var connections = pathsArea.selectAll("g.connection");
            nodes.each(function(d) {
                connections.filter(function(dcon) {
                    return dcon.connectsFrom.id === d.id;
                }).classed("connectsFromIsActive", false);
            });

            nodes.each(function(d) {
                connections.filter(function(dcon) {
                    return dcon.connectsTo.id === d.id;
                }).classed("connectsToIsActive", false);
            });

        }

        function highlightCorrelations(delay) {
            if (!delay) {
                delay = 0;
            }
            // remove all old highlights
            var oldCorrelationGs = pathsArea.selectAll("g.correlation.highlighted");

            oldCorrelationGs.classed("highlighted", false);
            var circles = oldCorrelationGs.filter(".Apactive").selectAll("circle");

            circles.transition().each("end", function() {
                d3.select(this).attr("stroke-opacity", 0).attr("stroke", "none").attr("stroke-width", 0);
            }).delay(delay).duration(duration.circleStroke).attr("stroke-width", 0).attr("stroke-opacity", 0);

            // if there is a new highlighting correlation, highlight those correlations of the same value
            var highlighting = pathsArea.select("g.correlation.highlighting");
            if (!highlighting.empty()) {
                var hValue = highlighting.datum().value;
                var correlationGs = pathsArea.selectAll("g.correlation:not(.selected):not(.highlighting)").filter(function(d) {
                    return d.value === hValue;
                }).classed("highlighted", true);

                circles = correlationGs.filter(".Apactive").selectAll("circle");
                circles.attr("stroke", "RED").transition().duration(duration.circleStroke) //
                .attr("stroke-width", 5).attr("stroke-opacity", opacity.corCircleStroke)
                // Go from 5 back to 3 for "blink" effect
                .transition().duration(duration.circleStroke).attr("stroke-width", 3);
            }
        }

        // activate node
        function activateNodes(nodes) {
            nodes.classed("Apactive", true);
            var circles = nodes.selectAll("circle");
            circles.attr("stroke-opacity", opacity.nodeCircleStroke);
            circles.attr("stroke", "BLACK");
            circles.transition().duration(duration.circle)//
            .attr("opacity", opacity.nodeCircleFillActive).attr("stroke-width", 2);

            var texts = nodes.selectAll("text");
            texts.attr("x", function(d) {
                return d.x;
            }).attr("y", function(d) {
                return d.y - margin.text;
            }).text(function(d) {
                return d.elementName;
            }).attr("visibility", "visible").transition().duration(duration.text).each("start", function(d) {
                d3.select(this).attr("opacity", 0.1);
            }).attr("opacity", opacity.text);

            // mark nescessary connections in case they have to be activated
            var connections = pathsArea.selectAll("g.connection");
            nodes.each(function(d) {
                connections.filter(function(dcon) {
                    return dcon.connectsTo.id === d.id;
                }).classed("connectsToIsActive", true);
            });
            nodes.each(function(d) {
                connections.filter(function(dcon) {
                    return dcon.connectsFrom.id === d.id;
                }).classed("connectsFromIsActive", true);
            });
        }

        // Respositions a selection of lines
        function drawLines(lines) {
            lines.attr("x1", function(d) {
                return d.node.x;
            }).attr("y1", function(d) {
                return d.node.y;
            }).attr("x2", function(d) {
                return d.correlation.x;
            }).attr("y2", function(d) {
                return d.correlation.y;
            });
        }

        function activateLines(lines) {
            lines.attr("stroke", "purple").classed("Apactive", true);
            lines.attr("stroke-opacity", opacity.line).attr("stroke-width", 1);

            lines.attr("x1", function(d) {
                return d.node.x;
            }).attr("y1", function(d) {
                return d.node.y;
            }).transition().duration(duration.line).each("start", function() {
                // starting point
                var text = d3.select(this);
                text.attr("x1", function(d) {
                    return d.node.x;
                }).attr("y1", function(d) {
                    return d.node.y;
                }).attr("x2", function(d) {
                    return d.node.x;
                }).attr("y2", function(d) {
                    return d.node.y;
                });
            }).attr("x2", function(d) {
                return d.correlation.x;
            }).attr("y2", function(d) {
                return d.correlation.y;
            });
        }

        function deactivateLines(lines) {
            lines.classed("Apactive", false);
            lines.transition().duration(duration.lineFade).each("end", function() {
                var line = d3.select(this);
                line.attr("x1", 0).attr("y1", 0);
                line.attr("x2", 0).attr("y2", 0);
                line.attr("stroke-opacity", 0).attr("stroke-width", 0).attr("stroke", "none");
            }).attr("x1", function() {
                return d3.select(this).attr("x2");
            }).attr("y1", function() {
                return d3.select(this).attr("y2");
            });
        }

        function selectCorrelations(correlationGs) {
            correlationGs.classed("highlighting", false).classed("selected", true);

            var circles = correlationGs.selectAll("circle");

            circles.attr("stroke-width", 3).attr("stroke", "purple");
            circles.transition().duration(duration.circleStroke).attr("stroke-opacity", opacity.corCircleStroke);

            correlationGs.each(function(d) {
                var circle = d3.select(this).select("circle");
                var text = d3.select(this).select("text").text(d.value);
                text.attr("x", (offset.labelX + parseInt(circle.attr("cx"))));
                text.attr("y", (offset.labelY + parseInt(circle.attr("cy"))));
                text.attr("visibility", "visible");
                text.transition().duration(duration.text).each("start", function() {
                    d3.select(this).attr("opacity", 0);
                }).attr("opacity", 1);
            });
        }

        function activateConnections(connections) {
            connections.classed("Apactive", true);
            var lineSelector = [];
            d3.select("g.PathsArea").node().getBBox();
            var bounds = {
                left : d3.select("g.PathsArea").node().getBBox().x,
                right : d3.select("g.PathsArea").node().getBBox().width
            };

            connections.each(function(d) {
                var origin = d.connectsFrom;
                var target = d.connectsTo;
                var overflow;

                var xDistance = target.x - origin.x;
                var yDistance = target.y - origin.y;

                var iScaleGapLength = offset.correlation / Math.sqrt(xDistance * xDistance + yDistance * yDistance);

                var iterationCount = 0;
                d3.select(this).selectAll("g").classed("Apactive", true)//
                .attr("pointer-events", null).each(function(dCor, i) {
                    lineSelector.push("line.link." + dCor.id);

                    var correlationG = d3.select(this);
                    var circle = correlationG.select("circle");

                    var cX, cY;

                    // root of connection
                    if (d.primary) {
                        cX = origin.x + xDistance / 2;
                        cY = origin.y + yDistance / 2;
                    } else {
                        cX = origin.x;
                        cY = target.y;
                    }

                    // scales "amount of gaps" and direction of the vector
                    // distributing connections evenly around root
                    // makes sure not to go offscreen
                    var iScaleFactor;
                    if (!overflow) {
                        iScaleFactor = 0.5 + Math.round((i + 1) / 2) - 1;
                        iScaleFactor *= ((i + 1) % 2) ? -1 : 1;

                        var cXtest = cX + yDistance * iScaleGapLength * iScaleFactor;
                        if (cXtest < bounds.left) {
                            overflow = "left";
                        } else if (cXtest > bounds.right) {
                            overflow = "right";
                        }
                    }
                    if (overflow) {
                        iterationCount += 1;
                        iScaleFactor = 0.5 + Math.round((iterationCount + 1) / 2) - 1;
                        if (overflow === "left") {
                            iScaleFactor *= 1;
                        } else if (overflow === "right") {
                            iScaleFactor *= -1;
                        }
                    }

                    cX += yDistance * iScaleGapLength * iScaleFactor;
                    cY += -xDistance * iScaleGapLength * iScaleFactor;

                    circle.attr("cx", cX).attr("cy", cY).attr("r", 5);
                    circle.transition().duration(duration.circle).attr("opacity", opacity.corCircleFill).attr("r", 5);

                    if (correlationG.classed("highlighted")) {
                        circle.attr("stroke", "RED").attr("stroke-width", 3).attr("stroke-opacity", opacity.corCircleStroke);
                    }

                    if (correlationG.classed("selected") || correlationG.classed("highlighting")) {
                        var text = correlationG.select("text");
                        text.text(dCor.value);
                        text.attr("x", (cX + offset.labelX));
                        text.attr("y", (cY + offset.labelY));
                        text.attr("opacity", 1);
                        text.attr("visibility", "visible");
                    }

                    dCor.x = cX;
                    dCor.y = cY;
                    iterationCount += 1;
                });
            });

            // array toString for "selector,selector,selector" format
            if (lineSelector.length) {
                pathsArea.selectAll(lineSelector.toString()).call(activateLines);
            }
        }

    }

    my.onNodeLeftClick = function(value) {
        if (!arguments.length) {
            return onNodeLeftClick;
        } else {
            onNodeLeftClick = value;
            return my;
        }
    };

    my.onNodeRightClick = function(value) {
        if (!arguments.length) {
            return onNodeRightClick;
        } else {
            onNodeRightClick = value;
            return my;
        }
    };

    my.height = function(value) {
        if (!arguments.length) {
            return height;
        }
        height = value;
        return my;
    };

    my.tooltip = function(value) {
        if (!arguments.length) {
            return tooltip;
        }
        tooltip = value;
        return my;
    };

    my.width = function(value) {
        if (!arguments.length) {
            return width;
        }
        width = value;
        return my;
    };

    my.tooltip = function(value) {
        if (!arguments.length) {
            return tooltip;
        }
        tooltip = value;
        return my;
    };

    my.showUTC = function(value) {
        if (!arguments.length) {
            return showUTC;
        } else {
            showUTC = value;
            return my;
        }
    };

    my.data = function(value) {
        if (!arguments.length) {
            return data;
        }
        data = value;
        return my;
    };

    return my;
}