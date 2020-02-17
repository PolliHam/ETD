/* globals d3 */
/* exported eventseries */
$.sap.declare("sap.secmon.ui.malimon.EventSeries-d3");
$.sap.require("sap.ui.thirdparty.d3");
/**
 * d3 implementation of EntitySeries:
 * 
 * Usage:
 * 
 * var oEventSeries = enentseries().data(aData).color(); oRoot.call(oEventSeries);
 * 
 * @see: EventSeries.js
 */
function eventseries() {
    var width = window.innerWidth, height = window.innerHeight;
    var extent;
    var color;
    var data;
    var tooltip;
    var selected; // last selected circle
    var radius = 6, radiusSelected = 9;
    var showUTC;

    var waiting;

    // callbacks
    var onCirclePress;
    var onZoomOut;

    // default margin, can be overwritten
    var margin = {
        top : 40,
        bottom : 40,
        left : 20,
        right : 20
    };

    function my(root) {
        // draw the two axes top and bottom
        if (!data || !data.length) {
            return;
        }

        var label = {
            width : 180,
            wrap : true
        };

        var offset, axisWidth = width - margin.left - margin.right - label.width;

        // associated array to hold the unique events
        var aaEvents = {};

        data.forEach(function(oData, idx) {
            // aaEvents[oData.TechnicalLogEntryType] = oData.EventName;
            aaEvents[oData.EventName] = oData.EventName;
        });

        offset = (height - margin.top - margin.bottom) / Object.keys(aaEvents).length;

        // scaling for the horizontal axes, both top and bottom
        // they are both timestamps
        // http://bl.ocks.org/jebeck/9671241
        // using UTC time -> d3.time.scale.utc()
        extent = extent || d3.extent(data, function(d) {
            return d.Timestamp;
        });

        var iPadding = (extent[1].getTime() - extent[0].getTime()) * 0.05;
        if (!iPadding) {
            iPadding = 500;
        }
        var paddedExtent = [];
        paddedExtent.push(extent[0].getTime() - iPadding);
        paddedExtent.push(extent[1].getTime() + iPadding);

        var x;
        if (showUTC) {
            x = d3.time.scale.utc().domain(paddedExtent).range([ 0, axisWidth ]);
        } else {
            x = d3.time.scale().domain(paddedExtent).range([ 0, axisWidth ]);
        }

        // scaling for the vertical axis
        // height must be reduced by the margins
        var y = d3.scale.ordinal().domain(d3.keys(aaEvents)).rangeBands([ 0, height - margin.top - margin.bottom ]);

        var xAxis = d3.svg.axis().scale(x).ticks(5);// .tickFormat(customTimeFormat);

        // define the zooming
        var zoom = d3.behavior.zoom().x(x).on("zoom", function() {
            // TODO: set the tolerance to be 10%, otherwise it triggers too many zooming events!
            // zooming should be disabled for clicking
            var zoomTolerance = (extent[1].getTime() - extent[0].getTime()) * 0.1;

            if (!waiting && ((x.domain()[0] < extent[0] && (extent[0] - x.domain()[0]) > zoomTolerance) || (x.domain()[1] > extent[1] && (x.domain()[1] - extent[1]) > zoomTolerance))) {
                waiting = setInterval(function() {
                    onZoomOut({
                        oldFrom : extent[0],
                        newFrom : x.domain()[0],
                        oldTo : extent[1],
                        newTo : x.domain()[1]
                    });
                    extent[0] = x.domain()[0];
                    extent[1] = x.domain()[1];
                    clearInterval(waiting);
                    waiting = undefined;
                }, 1000);
            }

            // zoom the axes
            root.select(".x.axisTop").call(xAxis.orient("top"));
            root.select(".x.axisBottom").call(xAxis.orient("bottom"));

            // zoom the data
            root.selectAll(".event-circle").attr("cx", function(d) {
                // TODO: this is a workaround, timestamp is set to be string after showing attributes!
                if (isNaN(x(d.Timestamp))) {
                    d.Timestamp = new Date(d.Timestamp);
                }
                return x(d.Timestamp);
            }).attr("cy", function(d) {
                // return y(d.TechnicalLogEntryType) + 0.5*offset;
                return y(d.EventName) + 0.5 * offset;
            });
        });

        root.call(zoom);
        // .on("mousedown.zoom", null); // disable panning;

        // --> Enter mode
        // render the axes
        var xAxisTop = root.select("g.x.axisTop");
        if (xAxisTop.empty()) {
            xAxisTop = root.append("g").attr("class", "x axisTop").call(xAxis.orient("top"));
        }
        xAxisTop.attr("transform", function() {
            return "translate(" + (margin.left + label.width) + "," + margin.top + ")";
        });

        var xAxisBottom = root.select("g.x.axisBottom");
        if (xAxisBottom.empty()) {
            xAxisBottom = root.append("g").attr("class", "x axisBottom").attr("transform", function() {
                return "translate(" + (margin.left + label.width) + "," + (height - margin.bottom) + ")";
            }).call(xAxis.orient("bottom"));
        }
        xAxisBottom.attr("transform", function() {
            return "translate(" + (margin.left + label.width) + "," + (height - margin.bottom) + ")";
        });

        // define the clipPath
        var clipPath = root.select("clipPath");
        if (clipPath.empty()) {
            clipPath = root.append("clipPath").attr("id", "chart-clip").append("rect").attr("x", 0).attr("y", 0);
            // .attr("width", width - margin.left - margin.right -
            // label.width).attr("height", height - margin.top - margin.right);
        }
        clipPath.attr("width", width - margin.left - margin.right - label.width).attr("height", height - margin.top - margin.right);

        // grid lines + events
        var chartArea = root.select("g.chartArea");
        if (chartArea.empty()) {
            chartArea = root.append("g").attr("class", "chartArea").attr("clip-path", "url(#chart-clip)");
        }
        chartArea.attr("transform", function() {
            return "translate(" + (margin.left + label.width) + ", " + margin.top + ")";
        });

        // render the lanes for the event points and the labels of events
        var aColors = [ "white", "#d9d9d9" ];
        var eventLanes = chartArea.selectAll(".grid-line").data(d3.keys(aaEvents));
        var eventLabels = root.selectAll("text.sapEtdEventSeriesLabel").data(d3.keys(aaEvents));
        // --> Exit mode
        eventLanes.exit().remove();
        eventLabels.exit().remove();
        // --> Update mode
        eventLanes.attr("y", function(d) {
            return y(d);
        }).attr("width", axisWidth).attr("height", offset);
        eventLabels.attr("transform", function(d) {
            return "translate(" + margin.left + "," + (margin.top + y(d) + 0.5 * offset) + ")";
        }).text(function(d) {
            return aaEvents[d];
        });
        // --> Enter mode
        eventLanes.enter().append("rect").classed("grid-line", true).attr("x", 0).attr("y", function(d) {
            return y(d);
        }).attr("width", axisWidth).attr("height", offset).style("fill", function(d, i) {
            return aColors[i % 2];
        });
        eventLabels.enter().append("text").classed("sapEtdEventSeriesLabel", true).attr("transform", function(d) {
            return "translate(" + margin.left + "," + (margin.top + y(d) + 0.5 * offset) + ")";
        }).text(function(d) {
            return aaEvents[d];
        });

        // render points for the events
        // --> Selection
        var eventCircle = chartArea.selectAll(".event-circle").data(data, function(d) {
            return d.Id;
        });

        // --> Exit mode
        eventCircle.exit().remove();

        // --> Update mode
        eventCircle.attr("cx", function(d) {
            if (d.InCaseFile) {
                d3.select(this).attr("r", radius).style("stroke", "#191818").style("stroke-width", "2px");
            } else {
                d3.select(this).style("stroke", null);
            }

            // TODO: this is a workaround, timestamp is set to be string after showing attributes!
            if (isNaN(x(d.Timestamp))) {
                d.Timestamp = new Date(d.Timestamp);
            }
            return x(d.Timestamp);
        }).attr("cy", function(d) {
            return y(d.EventName) + 0.5 * offset;
        });

        // --> Enter mode
        eventCircle.enter().append("circle").classed("event-circle", true).attr("cx", function(d) {
            // TODO: this is a workaround, timestamp is set to be string after showing attributes!
            if (isNaN(x(d.Timestamp))) {
                d.Timestamp = new Date(d.Timestamp);
            }
            return x(d.Timestamp);
        }).attr("r", radius).style("fill", function(d) {
            var sColor;
            if (d.Number) {
                sColor = color.Alert.color; // Alerts
            } else if (d.EventLogType) {
                sColor = color.SemanticEvent.color; // Events
            } else if (d.CheckName) {
                sColor = color.ConfigCheckEvent.color; // ConfigChecks
            } else {
                sColor = color.HealthCheckEvent.color; // HealthChecks
            }
            if (d.InCaseFile) {
                d3.select(this).style("stroke", "#191818").style("stroke-width", "2px");
            }

            if (d.Deleted) {
                sColor = "#d9d9d9"; // grey for deleted
            }

            return sColor;
        }).on("mousemove", function(d, i) {
            tooltip.style("opacity", 1);

            var clientWidth = this.parentNode.parentNode.parentNode.getBoundingClientRect().width;

            var sContent = "<table style='max-width:500px;'>";
            for ( var prop in d) {
                if (prop === "__metadata" || prop === "TechnicalLogEntryType" || prop === "EventName" || prop === "AlertId" || prop === "InCaseFile") {
                    continue;
                }
                var p = d[prop];

                if (prop === "Timestamp" || prop === "MinTimestamp" || prop === "MaxTimestamp") {
                    // p = new Date(Date.parse(p)).toUTCString();
                    // p = p.substring(0, p.length - 4) + " UTC";
                    p = sap.secmon.ui.commons.Formatter.dateFormatterEx(showUTC, p);
                }

                if (d[prop]) {
                    sContent += "<tr>";
                    sContent += "<td style='text-align: right;'>" + prop + ":";
                    sContent += "</td><td>" + p + "</td>";
                    sContent += "</tr>";
                }

            }
            sContent += "</table>";

            tooltip.html(sContent).style("left", function(d) {
                // x coordinate
                var divWidth = d3.select(this).property("offsetWidth");
                var px;
                if (clientWidth - d3.event.x < divWidth) {
                    px = clientWidth - divWidth;
                } else if (d3.event.x < divWidth) {
                    px = 0;
                } else {
                    px = d3.event.clientX - 0.5 * divWidth;
                }

                return px + "px";
            }).style("top", function(d) {
                // y coordinate
                var divHeight = d3.select(this).property("offsetHeight");
                // always put on top of the mouse
                return (d3.event.pageY - divHeight - margin.bottom) + "px";
            });
        }).on("mouseout", function(d, i) {
            // move the tooltip to the top-left corner and empty its content
            // trying to avoid the situation that this hidden tooltip blocks the
            // underlying area, which won't get the mouse events
            tooltip.html("");
            tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");
        }).on("click", function(d, i) {
            // if (d3.event.defaultPrevented)
            // return; // ignore drag
            // remove the mark of last selected circle

            d3.select(selected).style("stroke", function(d) {
                if (d.InCaseFile) {
                    d3.select(selected).style("stroke-width", "2px");
                    return "#191818";// ???                    
                } else {
                    return null;
                }
            });

            d3.select(selected).attr("r", radius);
            // mark the current selected circle
            d3.select(this).attr("r", radiusSelected);
            d3.select(this).style("stroke", "#930a0a");
            selected = this;

            tooltip.html("");
            tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");
            onCirclePress({
                "circle" : d,
                "target" : this
            });

        }).transition().duration(2000).attrTween("cy", function(d) {
            return d3.interpolateNumber(0, y(d.EventName) + 0.5 * offset);
        });

        // no animation of the new points
        // .transition().duration(2000).attrTween("cy", function(d) {
        // return d3.interpolateNumber(0, y(d.EventName) + 0.5 * offset);
        // });
    }

    my.onCirclePress = function(value) {
        if (!arguments.length) {
            return onCirclePress;
        } else {
            onCirclePress = value;
            return my;
        }
    };

    my.onZoomOut = function(value) {
        if (!arguments.length) {
            return onZoomOut;
        } else {
            onZoomOut = value;
            return my;
        }
    };

    my.extent = function(value) {
        if (!arguments.length) {
            return extent;
        } else {
            extent = value;
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

    my.showUTC = function(value) {
        if (!arguments.length) {
            return showUTC;
        } else {
            showUTC = value;
            return my;
        }
    };

    return my;
}