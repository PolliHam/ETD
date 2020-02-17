/* globals d3, range:true */
$.sap.declare("sap.secmon.ui.browse.Bubblegram-d3");

/**
 * d3 implementation of Bubblegram. It displays the attributes that are filled with data. If an attribute has single value it will be marked in gray. The first number is how many times it is filled,
 * while the number in bracket reduces the number to the distinct value.
 * 
 * If a bubble is clicked it fetches the distribution from backend and shows as a Donut chart. Bubblegram requires the underlying control of Donut-d3
 * 
 * Usage:
 * 
 * oBubblegram.width(iDiameter).height(iDiameter).on("select", function(bubble) { that._loadAttrValues(d3.select(bubble)); }).donut().on("select", function(origin, bInverted, d, i) {});
 * 
 * @see: Bubblegram.js
 */

$.sap.require("sap.secmon.ui.browse.Donut-d3");

sap.secmon.ui.browse["Bubblegram-d3"] = { bubblegram : function() {
    // default values which can be overwritten
    var radiusRange = [ 10, 100 ], selRatio = 2, padding = 10, width = window.innerWidth, height = window.innerHeight;

    var pack = d3.layout.pack().sort(function(a, b) {
        return b.value - a.value;
    }).size([ width, height ]).padding(padding);

    var selected;
    var _bubbles;    

    // d3's standard way of dispatching events
    // event if bubble is clicked/selected
    var dispatch = d3.dispatch("select");
    var myDonut = sap.secmon.ui.browse["Donut-d3"].donut().useStatusColor(false);

    var my = function (bubbles, handleSelect) {
        
        // TODO: should come from Knowledge base
        var aAttrCategories = [ "Attack Name", "Attack Type", "Correlation ID", "Correlation Sub ID", "Event (semantic)", "Event Code", "Event Source ID", "Event Source Type", "Event", "Generic",
                "Network", "Parameter Data Type", "Parameter Direction", "Parameter Name", "Parameter Type", "Parameter Value", "Parameter", "Privilege Is Grantable", "Privilege Name",
                "Privilege Type", "Privilege", "Resource Container Name", "Resource Container Type", "Resource Content Or Hash", "Resource Content Type", "Resource Count", "Resource Name",
                "Resource Request Size", "Resource Response Size", "Resource Size", "Resource Type", "Resource", "Service", "System Group", "System ID", "System Location", "System Role",
                "System Type", "Technical", "Time Duration", "Timestamp", "Timestamp Of End", "Timestamp Of Start", "Trigger Name", "Trigger Type", "User Group", "User Logon Method",
                "User Pseudonym", "User Type", "User", "Username" ];

        var aFioriColors = [ "#F0AB00", "#F27020", "#E52929", "#AB218E", "#007CC0", "#008A11", "#004990", "#009DE0", "#D4C9AD" ];

        var color = d3.scale.ordinal().domain(aAttrCategories).range(aFioriColors);
        // var color = d3.scale.category20b().domain(aAttrCategories);

        _bubbles = bubbles;

        var centralize = function(selNode) {

            // exchange all three values
            bubbles.filter(function(d) {
                return d.valueOri && d.value !== d.valueOri;
            }).datum(function(d) {
                d.value = d.valueOri;
                return d;
            })
            // reset the inverted text
            .select("foreignObject").attr("transform", null);

            bubbles.filter(function(d) {
                return d.key === selNode.key;
            }).datum(function(d) {
                d.valueOri = d.value;
                d.value = radiusRange[1] * selRatio;
                return d;
            })
            // draw a rect frame to mark it as selected
            .attr("style", "outline: thin solid red;");

            // now set the changed data
            var nodes = pack.nodes({
                children : bubbles.data()
            }).filter(function(d) {
                return !d.children;
            });

            // important to set the key
            bubbles.data(nodes, function(d) {
                return d.key;
            }).call(my);

            selected = selNode;

            myDonut.node(selNode).radius(selNode.r).innerRadius(selNode.r / 1.681)/* .selectHandler(handleNewFilter) */;
        };

        // --> Enter mode
        var g = bubbles.enter().append("g").classed("bubble", true).on("click", function(d, i) {
            if (d.distinctCount > 0) {
                // fire the select event
                d3.select(this.parentNode).attr("pointer-events", "none");
                dispatch.select(this);
                d3.select(this.parentNode).attr("pointer-events", null);
                
                centralize(d);
            }
        });

        g.append("circle").attr("r", function(d) {
            return d.r;
        }).style('opacity', 1).style("fill", function(d) {
            // first sentence before comma
            var sCategory = d.displayName.split(",")[0];
            return d.distinctCount > 1 ? color(sCategory) : (d.distinctCount === 1 ? '#ABABAB' : '#C0C0C0');
        }).on("mouseover", function(d, i) {
            // show the tooltip only if the bubble is not selected and there
            // exists only one value
            if (selected !== d && d.distinctCount === 1) {
                // fire the select event
                d.event = d3.event; // event is used for popup position
                d3.select(this.parentNode).attr("pointer-events", "none");
                dispatch.select(this);
                d3.select(this.parentNode).attr("pointer-events", null);
            }
        }).on("mouseout", function(d, i) {
            // Tooltip
            var tooltip = d3.select("body").select("div.sapEtdDonutTooltip");
            if (tooltip.empty()) {
                tooltip = d3.select("body").append("div").attr("class", "sapEtdDonutTooltip").style("opacity", 0);
            }
            // move the tooltip to the top-left corner and empty its content
            // trying to avoid the situation that this hidden tooltip blocks the
            // underlying area, which won't get the mouse events
            tooltip.html("");
            tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");
        });

        g.append("svg:title").text(function(d) {
            return d.displayName;
        });

        g.append("foreignObject").attr("width", function(d) {
            return 2 * d.r / 1.414;
        }).attr("height", function(d) {
            return 2 * d.r / 1.414;
        }).attr("x", function(d) {
            return -d.r / 1.414;
        }).attr("y", function(d) {
            return -d.r / 1.414;
        }).append("xhtml:div").attr("class", "sapEtdBubblegramText").style("font-size", function(d) {
            return (d.r / 5) + "px";
        }).append("xhtml:center").style({
            "display" : "table-cell",
            "vertical-align" : "middle",
        }).html(function(d) {
            return d.displayName + "<br/>" + d.count + "(" + d.distinctCount + ")";
        });

        // --> Update mode
        var fnSizeFactor = function(d) {
            return (!d.valueOri || d.value === d.valueOri) ? 0.707107 : 0.48;
        };
        bubbles.transition().duration(2000).attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        bubbles.select("circle").transition().duration(2000).attr("r", function(d) {
            return d.r;
        }).style('opacity', 1).style("fill", function(d) {
            // first sentence before comma
            var sCategory = d.displayName.split(",")[0];
            return d.distinctCount > 1 ? color(sCategory) : (d.distinctCount === 1 ? '#ABABAB' : '#C0C0C0');
        });

        bubbles.selectAll("foreignObject").attr("width", function(d) {
            return 2 * d.r * fnSizeFactor(d);
        }).attr("height", function(d) {
            return 2 * d.r * fnSizeFactor(d);
        }).attr("x", function(d) {
            return -d.r * fnSizeFactor(d);
        }).attr("y", function(d) {
            return -d.r * fnSizeFactor(d);
        }).selectAll("div").transition().duration(2000).style("font-size", function(d) {
            return ((!d.valueOri || d.value === d.valueOri) ? (d.r / 4) : (d.r / 8)) + "px";
        });

        bubbles.selectAll("foreignObject").selectAll("center").html(function(d) {
            return d.displayName + "<br/>" + d.count + "(" + d.distinctCount + ")";
        });

        // --> Exit mode
        // Parent's data exit -> select circle -> do exit animation
        bubbles.exit().select("circle").transition().duration(2000).attr("r", 0);

        // delay removal of parent for 250.
        bubbles.exit().transition().duration(2500).remove();
    };
    
    my = d3.rebind(my, dispatch, "on");

    my.select = function(key) {

        // exchange all three values
        _bubbles.filter(function(d) {
            return d.valueOri && d.value !== d.valueOri;
        }).datum(function(d) {
            d.value = d.valueOri;
            return d;
        })
        // reset the inverted text
        .select("foreignObject").attr("transform", null);

        _bubbles.filter(function(d) {
            return d.key === key;
        }).datum(function(d) {
            d.valueOri = d.value;
            d.value = radiusRange[1] * selRatio;
            return d;
        });

        // now set the changed data
        var nodes = pack.nodes({
            children : _bubbles.data()
        }).filter(function(d) {
            return !d.children;
        });

        // important to set the key
        _bubbles.data(nodes, function(d) {
            return d.key;
        }).call(my);

        // myDonut.node(null);

        // remove the selected donut
        _bubbles.selectAll("g path").remove();
        _bubbles.selectAll("g.sapEtdDonutButton").remove();

        return my;
    };

    my.updateDonut = function(bubble, data) {
        myDonut(bubble, data);

        return my;
    };

    my.showTooltip = function(bubble, data) {

        // Tooltip
        var tooltip = d3.select("body").select("div.sapEtdDonutTooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div").attr("class", "sapEtdDonutTooltip").style("opacity", 0);
        }

        var dimension = bubble.datum().displayName;
        var measure = "Count";

        // position the tooltip in the proper place of mouse click
        tooltip.style("opacity", 1);
        tooltip.html(
                "<table><tr><td class='sapEtdDonutTooltipleftColumn'>" + dimension + ":</td><td>" + data[0].id + "</td></tr><tr><td class='sapEtdDonutTooltipleftColumn'>" + measure + ":</td><td>" +
                    data[0].value + "</td></tr></table>").style("left", function(d) {
            // x coordinate
            var divWidth = d3.select(this).property("offsetWidth");
            return (bubble.datum().event.pageX - 0.5 * divWidth) + "px";
        }).style("top", function(d) {
            // y coordinate
            var divHeight = d3.select(this).property("offsetHeight");
            return (bubble.datum().event.layerY < divHeight ? bubble.datum().event.pageY + 0.5 * divHeight : bubble.datum().event.pageY - 1.5 * divHeight) + "px";
        });

        return my;
    };

    my.selected = function() {
        return selected;
    };
    
    my.donut = function() {
        return myDonut;
    };

    my.pack = function(value) {
        if (!arguments.length) {
            return pack;
        }
        pack = value;
        return my;
    };

    my.width = function(value) {
        if (!arguments.length) {
            return width;
        }
        width = value;
        return my;
    };

    my.height = function(value) {
        if (!arguments.length) {
            return height;
        }
        height = value;
        return my;
    };

    my.range = function(value) {
        if (!arguments.length) {
            return range;
        }
        range = value;
        return my;
    };

    my.selRatio = function(value) {
        if (!arguments.length) {
            return selRatio;
        }
        selRatio = value;
        return my;
    };

    my.padding = function(value) {
        if (!arguments.length) {
            return padding;
        }
        padding = value;
        return my;
    };

    return my;
}
}; 