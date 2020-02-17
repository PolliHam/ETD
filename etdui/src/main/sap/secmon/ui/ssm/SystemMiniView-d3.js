/* globals d3, pack:true,  */
/* exported systemMiniView */
$.sap.require("sap.secmon.ui.ssm.SystemMiniView-d3");

/**
 * d3 implementation of SystemMiniView
 * 
 * @see: SystemMiniView.js
 */

function systemMiniView() {

    var scale = 1, size = 50, padding = 10, width = window.innerWidth, height = window.innerHeight, animation = true;

    // color pallete for bars in the mini view
    var barpallete = [ '#AED1DA'/* Light Blue */, '#005B8D'/* Dark Blue */, '#E52929' /* Red */, '#008A11' /* Green */];

    var C_SAP_GRAY = "#999999";

    // Levels set up for zooming
    var level = [ 50, 160 ];

    var horipack = function(i) {
        var unit = (size + padding) * scale;
        var n = Math.floor(0.5 * width / unit);
        var x = ((i % n) * 2 + 1) * unit;
        var y = (Math.floor(i / n) * 2 + 1) * unit;

        return "translate(" + x + "," + y + ")" + "scale(" + scale + ")";
    };

    var _systems;    
    var dispatch = d3.dispatch("click", "mouseover", "mouseout");

    // define the inner function to be exposed
    function inner(systems) {

        _systems = systems;

        // --> Enter mode
        var g = _systems.enter().append("g").on("click", function(d) {
            if (d3.event.defaultPrevented) {
                return;
            }
            // dispatch
            dispatch.click(d);
        });

        // Axis for vertical
        g.append('line').attr('x1', -size).attr('y1', size).attr('x2', -size).attr('y2', 0).style('stroke', '#666666').style('stroke-width', 2);

        // Axis for horizontal
        g.append('line').attr('x1', -size).attr('y1', size).attr('x2', size).attr('y2', size).style('stroke', '#666666').style('stroke-width', 2);

        // text for Id
        g.append("text").attr("fill", "#666666").attr("dy", "-30").attr('text-anchor', 'middle').style("font-size", function(d) {
            return 22 * 8 / (d.name.length > 8 ? d.name.length : 8) + "px";
        }).style("font-family", "Arial black").text(function(d) {
            return d.name;
        });
        // text for Type
        g.append("text").attr("fill", "#666666").attr("dy", "-13").attr('text-anchor', 'middle').style("font-size", function(d) {
            return 10;
        }).style("font-family", "Arial").text(function(d) {
            return d.type;
        });

        // --> Update mode
        (animation ? _systems.transition().delay(100).duration(1000) : _systems).attr("transform", function(d, i) {
            return horipack(i);
        });

        // --> Exit mode
        _systems.exit().remove();

        // ----------- Bars
        var colors = d3.scale.ordinal().range(barpallete);

        var fnStatus = function(d) {
            return [ {
                id : "0",
                value : (100 - d.Criticality) * 0.01 + ""
            }, {
                id : "1",
                value : d.Criticality * 0.01 + ""
            }, {
                id : "2",
                value : d.Health * 0.01 + ""
            }, {
                id : "3",
                value : (100 - d.Health) * 0.01 + ""
            } ];
        };
        // draw bar chart
        g.selectAll(".bar").data(function(d) {
            return fnStatus(d);
        }).call(function(d) {
            d.enter().append("rect").attr("class", "bar").attr("x", function(d) {
                return d.id === "0" || d.id === "1" ? -2 * size / 3 : size / 10;
            }).attr("width", size / 2).attr("y", function(d) {
                return d.id === "0" || d.id === "3" ? 0 : (1 - d.value) * size;
            }).style("fill", function(d, i) {
                return d.value < 0 || d.value > 1 ? C_SAP_GRAY : colors(i);
            }).attr("height", function(d) {
                return Math.abs(d.value) * size;
            });
        }).call(function(d) {
            d.exit().remove();
        }).on("mouseover", function(d, i) {
            if (d.id === "2" || d.id === "3") {
                var currentEvent = d3.event;
                dispatch.mouseover(d3.select(this.parentNode).datum(), function(sHtml) {
                    // Tooltip
                    var tooltip = d3.select("body").select("div.sapEtdSsmTooltip");
                    if (tooltip.empty()) {
                        tooltip = d3.select("body").append("div").attr("class", "sapEtdSsmTooltip").style("opacity", 0);
                    }

                    tooltip.style("opacity", 1);
                    tooltip.html(sHtml).style("left", function(d) {
                        // x coordinate
                        return currentEvent.pageX + "px";
                    }).style("top", function(d) {
                        // y coordinate
                        var divHeight = d3.select(this).property("offsetHeight");
                        return (window.innerHeight - currentEvent.y < divHeight ? window.innerHeight - divHeight :
                        //
                        currentEvent.y < divHeight ? 0 : currentEvent.y) + "px";
                    });

                    return tooltip;
                });
            }
        }).on("mouseout", function(d, i) {
            if (d.id === "2" || d.id === "3") {
                // Tooltip
                var tooltip = d3.select("body").select("div.sapEtdSsmTooltip");
                tooltip.html("");
                tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");

                dispatch.mouseout(d3.select(this.parentNode).datum());
            }
        }).append("svg:title").text(function(d) {
            return (d.id === "2" || d.id === "3" ? "State" : "Impact") + " of Compromise";
        });
        

        g.selectAll(".bartext").data(function(d) {
            return fnStatus(d);
        }).call(function(d) {
            d.enter().append("text").filter(function(d) {
                return d.id === "1" || d.id === "2";
            }).attr("class", "bartext").attr("text-anchor", 'middle').attr("fill", "white").style("font-size", function(d) {
                return 10;
            }).attr("x", function(d) {
                return d.id === "0" || d.id === "1" ? -2 * size / 5 : size / 3;
            }).attr("y", function(d) {
                return (1 - d.value) * size + (d.value >= 0.5 ? +10 : -2);
            }).text(function(d) {
                return d.value < 0 ? "N/A" : Math.round(d.value * 100) + "%";
            });
        }).call(function(d) {
            d.exit().remove();
        });

        // // show No data/loading text
        // var svg = d3.select(this.node().parentNode.parentNode);
        // if (this.data().length <= 0) {
        // svg.append("text").attr('text-anchor', 'middle').style("font-size",
        // function(d) {
        // return 22 + "px";
        // }).style("font-family", "Arial black").text(function(d) {
        // return "No Data Available";
        // });
        // } else {
        // // svg.remove("text");
        // }

    }
    
    inner = d3.rebind(inner, dispatch, "on");

    // pack horizontally
    inner.hpack = function(i, scale) {
        horipack(i, scale);
        return inner;
    };

    inner.update = function(systems) {
        _systems = systems;
    };

    inner.repack = function() {
        _systems.attr("transform", function(d, i) {
            return horipack(i);
        });

        return inner;
    };

    inner.redraw = function() {
        if (!(_systems.node())) {
            return;}

        var w = _systems.node().getBoundingClientRect().width;

        _systems.selectAll("text").style("display", w < level[0] ? "none" : null);

        // TODO: remove the hard coded number
        if (w > level[1]) {
            _systems.selectAll("line").attr("stroke-opacity", "0.2");
            _systems.selectAll(".bar").attr("fill-opacity", "0.2");
            _systems.selectAll(".bartext").attr("display", "none");

            var currWidth = _systems.node().getBBox().width;
            _systems.selectAll("foreignObject").remove();
            _systems.append("foreignObject").attr("width", function(d) {
                return currWidth;
                // return this.parentNode.getBoundingClientRect().width;
            }).attr("height", function(d) {
                return 0.5 * currWidth;
            }).attr("x", function(d) {
                return -0.5 * currWidth;
            }).attr("y", function(d) {
                return 0;
            }).append("xhtml:div").attr("class", "sapEtdSsmText").style("font-size", function(d) {
                return Math.round(currWidth / 20) + "px";
            }).html(function(d) {
                var a, htmlAttr = "<table class='sapEtdSsmTable'>";
                for (a in d) {
                    if (a && d[a] && typeof (d[a]) !== "object" && !((a.charAt(0) === a.charAt(0).toLowerCase()) || (a.indexOf("Source") >= 0))) {
                        if (d[a].indexOf && d[a].indexOf("/Date") === 0) {
                            var dDate = new Date(parseInt(d[a].substr(6)));
                            d[a] = sap.secmon.ui.ssm.utils.formatDateTime(dDate);
                        }
                        htmlAttr += "<tr><td style='text-align: right;width:50%'>" + a + ":</td><td style='width:50%'>" + d[a] + "</td></tr>";
                    }
                }
                htmlAttr += "</table>";
                return htmlAttr;
            }).style();
        } else {
            _systems.selectAll("line").attr("stroke-opacity", null);
            _systems.selectAll(".bar").attr("fill-opacity", null);
            _systems.selectAll(".bartext").attr("display", null);
            _systems.selectAll("foreignObject").remove();
        }

        return inner;
    };

    inner.dispatch = function(value) {
        if (!arguments.length) {
            return dispatch;}
        dispatch = value;
        return inner;
    };

    inner.animation = function(value) {
        if (!arguments.length) {
            return animation;}
        animation = value;
        return inner;
    };

    inner.level = function(value) {
        if (!arguments.length) {
            return level;}
        level = value;
        return inner;
    };

    inner.width = function(value) {
        if (!arguments.length) {
            return width;}
        width = value;
        return inner;
    };

    inner.height = function(value) {
        if (!arguments.length) {
            return height;}
        height = value;
        return inner;
    };

    inner.pack = function(value) {
        if (!arguments.length) {
            return pack;}
        pack = value;
        return inner;
    };

    inner.size = function(value) {
        if (!arguments.length) {
            return size;}
        size = value;
        return inner;
    };

    inner.scale = function(value) {
        if (!arguments.length) {
            return scale;}
        scale = value;
        return inner;
    };

    inner.padding = function(value) {
        if (!arguments.length) {
            return padding;}
        padding = value;
        return inner;
    };

    return inner;
}