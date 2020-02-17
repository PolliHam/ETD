/* globals d3 */
$.sap.declare("sap.secmon.ui.m.anomaly.ui.Sunburst-d3");

sap.secmon.ui.m.anomaly.ui["Sunburst-d3"] = { sunburst : function(fnShowContextMenue, spider, area) {
    var color = d3.scale.category20c();
    var radius;
    var iProportion;
    var _spider = spider;
    var _area = area;
    var _view;
    // tooltip
    var tooltip = d3.select("body").append("div").style("position", "absolute").style("z-index", "10").style("padding", "10px").style("box-shadow", "3px 3px 5px #888888").style("background", "white")
            .style("visibility", "hidden").style("font-weight", "bold").attr("font-size", "10px").attr("fill", "black");

    var _fnShowContextMenue = fnShowContextMenue;

    function me(selectedEntity, entityDetails, w, h, svg, spiderdiagram) {

        radius = Math.min(w, h) / 2;
        var x = d3.scale.linear().range([ 0, 2 * Math.PI ]);
        var y = d3.scale.linear().range([ 0, radius ]);
        var textSize, path, text;

        // set data
        var root = entityDetails.sunburst;
        var iNoOfLeaf = 0, iSumPerFeature;
        $.each(root.children, function(idx, oFeature) {
            iSumPerFeature = 0;
            iNoOfLeaf = iNoOfLeaf + oFeature.entity[0].numberOfChildren;
            oFeature.sum = oFeature.entity[0].numberOfChildren;
        });

        iProportion = iNoOfLeaf / entityDetails.sunburst.children.length;


        $.each(root.children, function(idx, oFeature) {
            var iProportionLeaf = iProportion / oFeature.sum;
            oFeature.leafSize = iProportionLeaf;
        });
        // sort each level
        root.children.sort(function(a, b) {
            return a.entity[0].value > b.entity[0].value;
        });
        // functions
        var partition = d3.layout.partition().value(function(d) {
            var climb = true, node = d, iSize=0;
            while(climb){
                node = node.parent;
                if(node.leafSize){
                    climb = false;
                    iSize = node.leafSize;
                }
            }
            return iSize;
        });

        var arc = d3.svg.arc().startAngle(function(d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x)));
        }).endAngle(function(d) {
            return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
        }).innerRadius(function(d) {
            return Math.max(0, y(d.y));
        }).outerRadius(function(d) {
            return Math.max(0, y(d.y + d.dy));
        });

        var arcTween = function arcTween(d) {
            if (d.depth === 0) {
                _view = 'default';
            } else if (d.children === undefined) {
                _view = 'leaf';
            } else {
                _view = 'tween';
            }
            var xd = d3.interpolate(x.domain(), [ d.x, d.x + d.dx ]), yd = d3.interpolate(y.domain(), [ d.y, 1 ]), yr = d3.interpolate(y.range(), [ d.y ? 20 : 0, radius ]);
            return function(d, i) {
                return i ? function(t) {
                    return arc(d);
                } : function(t) {
                    x.domain(xd(t));
                    y.domain(yd(t)).range(yr(t));
                    return arc(d);
                };
            };
        };

        var click = function click(d) {
            var oDataSelected = $.extend(false, {}, d);
            oDataSelected.target = this;

            if (d.depth === 0 && _view === 'default' ) {
                // || d.children === undefined && _view === 'leaf') {
                _fnShowContextMenue(oDataSelected, _spider);
            } else {
                text.transition().attr("opacity", function(e, i) {
                    if (e.depth === 0) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                path.transition().duration(750).attrTween("d", arcTween(d)).each(
                        "end",
                        function(e, i) {
                            if (e.depth !== 0 && e.x >= d.x && e.x < (d.x + d.dx)) {
                                var arcText = d3.select(this.parentNode).select("text");
                                arcText.transition().duration(600).attr("transform", function() {
                                    return "translate(" + arc.centroid(e) + ")";
                                }).attr("x", function(d) {
                                    return y(d.y);
                                }).attr(
                                        "opacity",
                                        function(h, i) {
                                            if ((((Math.min(2 * Math.PI, x(d3.select(this).data()[0].x + d3.select(this).data()[0].dx))) -
                                                    (Math.min(2 * Math.PI, x(d3.select(this).data()[0].x)))) / (2 * Math.PI) < 0.075)) {
                                                return 0;
                                            } else {
                                                return 1;
                                            }
                                        });
                            }
                        });

            }
        };

        var drawArc = function drawArc(d, i) {
            if (i === 0) {
                _view = 'default';
            }
            d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")").attr("d", arc).attr("id", "path" + i).attr("class", "sunburst").style("fill", function(d) {
                var sColor;
                if (d.depth === 0) { // root
                    sColor = '#ffffff';
                }else{
                    sColor = color(d.entity[0].value);
                }
                return sColor;
            }).on('mouseover', function(d) {
                var sName;
                for (i = 0; i < d.entity.length; i++) {
                    if (sName) {
                        sName = sName + "</br>" + d.entity[i].name + ': ' + d.entity[i].value;
                    } else {
                        sName = d.entity[i].name + ': ' + d.entity[i].value;
                    }
                    if (d.count) {
                        sName = sName + "</br>" + 'Amount: ' + d.count;
                    }
                }
                return tooltip.style("visibility", "visible").html(sName);
            }).on('mousemove', function() {
                return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
            }).on('mouseout', function() {
                return tooltip.style("visibility", "hidden");
            }).on("click", click);
        };

        var drawText = function drawText(d, i) {
            var text = d3.select(this);
            if (d.depth === 0) { // root node
                // set size for text using path outerradius
                textSize = Math.ceil(Math.max(0, y(d.y + d.dy))) / 100;
                var rootName;
                for (var j = 0; j < d.entity.length; j++) {
                    if (rootName) {
                        rootName = rootName + " | " + d.entity[j].value;
                    } else {
                        rootName = d.entity[j].value;
                    }
                }
                text.attr("text-anchor", "middle").attr("font-size", (textSize * 1.25) + 'em').attr("id", "text" + i).attr("class", "sunburst").text(rootName);
            } else {
                text.attr("transform", function(d) {
                    return "translate(" + arc.centroid(d) + ")";
                }).attr("dy", ".35em").attr("text-anchor", "middle").attr("font-size", textSize + 'em').attr("id", "text" + i).attr("class", "sunburst").text(function(d) {
                    return d.entity[0].value;
                });
            }

        };

        function wrap(aText) {
            var lineHeight = 0.25;

            aText.each(function() {
                var text = d3.select(this);
                if (text.data()[0].depth !== 0) {
                    var words = text.text().split(/\s+/);
                    var lines = [];
                    var pos = 0;
                    var y = text.attr("y");
                    var dy = parseFloat(text.attr("dy"));
                    var tspan = text.text(null)
                            .append("tspan")
                            .attr("x", text.attr("x"))
                            .attr("y", y)
                            .attr("dy", dy + "em");

                    words.forEach(function(word){
                        tspan.text(lines.join(" "));
                        lines = [ word ];
                        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++pos * lineHeight + dy + "em").text(word);
                    });
                    // var pathBox = d3.select(this.parentNode).select("path").node().getBBox();
                    // var textBox = tspan.node().getBBox();

                    if ((((Math.min(2 * Math.PI, x(text.data()[0].x + text.data()[0].dx))) - (Math.min(2 * Math.PI, x(text.data()[0].x)))) / (2 * Math.PI) < 0.075)) {
                        text.transition().attr("opacity", 0);
                    }
                }
            });
        }        

        // Draw sunburst
        var group = _area.selectAll("path.sunburst").data(partition.nodes(root)).enter().append('svg:g');
        path = group.append("svg:path").each(drawArc);
        text = group.append("svg:text").each(drawText).call(wrap);

        // bring sunburst to middle
        if(spiderdiagram){
            group.transition().duration(600).ease('ease').attr("transform", "translate(" + w / 4 + "," + h / 3 + ")");
        }else{
            group.transition().duration(600).ease('ease').attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
        }

    }
    me.hideDetails = function() {
        _area.selectAll("path.sunburst").remove();
        _area.selectAll("text.sunburst").remove();
        return me;
    };

    return me;
}
};
