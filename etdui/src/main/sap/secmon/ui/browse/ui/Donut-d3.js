/* globals d3, pie:true */
jQuery.sap.declare("sap.secmon.ui.browse.Donut-d3");

sap.secmon.ui.browse["Donut-d3"] =
        {
            donut : function() {
                // static properties
                var useStatusColor = true;
                var radius = 100;
                var innerRadius = 40;
                var node;
                var selectHandler;
                var showLegend = false;
                var controlId;
                var showLabel = false;
                var showLimit = 100;

                var colors =
                        d3.scale.ordinal().range(
                                [ '#748CB2', '#9CC677', '#EACF5E', '#F9AD79', '#D16A7C', '#8873A2', '#3A95B3', '#B6D949', '#FDD36C', '#F47958', '#A65084', '#0063B1', '#0DA841', '#FCB71D', '#F05620',
                                        '#B22D6E', '#3C368E', '#8FB2CF', '#95D4AB', '#EAE98F', '#F9BE92', '#EC9A99', '#BC98BD', '#1EB7B2', '#73C03C', '#F48323', '#EB271B', '#D9B5CA', '#AED1DA',
                                        '#DFECB2', '#FCDAB0', '#F5BCB4' ]);

                var _inversion = [ {
                    // "Invert"
                    invert : "Invert",// oTextBundle.getText("BU_Chart_Invert"),
                    // "Revert"
                    back : "Revert",// oTextBundle.getText("BU_Chart_Revert"),
                } ];

                // d3's standard way of dispatching events
                var dispatch = d3.dispatch("select", "showTooltip", "hideTooltip");

                var inner = function(bubble, data) {

                    // var color = d3.scale.category20b();
                    var dataInverted = false;

                    var pie = d3.layout.pie().sort(function(d) {
                        return d.value;
                    }).value(function(d) {
                        return d.value;
                    });

                    // Data preprocess, requested for tooltip
                    data.forEach(function(d) {
                        d.value = +d.value;
                        d.raw = d.value;
                    });

                    // Tooltip
                    var tooltip = d3.select("body").select("div.sapEtdDonutTooltip");
                    if (tooltip.empty()) {
                        tooltip = d3.select("body").append("div").attr("class", "sapEtdDonutTooltip").style("opacity", 0);
                    }

                    var _renderInvertButton, _renderLegend;

                    var deselectData = function(key, i) {
                        var arc = bubble.selectAll("path.arc[data-legend=\"" + key + "\"]");

                        // reset the fill color and remove the stroke
                        arc.style("fill-opacity", 1).attr("stroke-width", 0);

                        // move the tooltip to the top-left corner and empty its content
                        // trying to avoid the situation that this hidden tooltip blocks the
                        // underlying area, which won't get the mouse events
                        tooltip.html("");
                        tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");
                    };

                    var selectData =
                            function(key, i) {
                                // we have only one dimension
                                var dimension = node.displayName;
                                var measure = "Count";

                                var arc = bubble.selectAll("path.arc[data-legend=\"" + key + "\"]");

                                var arcFillColor = d3.hsl(arc.style("fill"));

                                arc.style("fill-opacity", 0.8).attr("stroke-width", 1).attr("stroke", function(d) {
                                    return d3.hsl(arcFillColor).darker(1);
                                });

                                // position the tooltip in the proper place of mouse click
                                tooltip.style("opacity", 1);
                                tooltip
                                    .html(
                                        "<table><tr><td class='sapEtdDonutTooltipleftColumn'>" + dimension + ":</td><td>" + arc.data()[0].data.id +
                                        "</td></tr><tr><td class='sapEtdDonutTooltipleftColumn'>" + measure + ":</td><td>" + arc.data()[0].data.raw + "</td></tr></table>"
                                    ).style("left", function(d) {
                                        // x coordinate
                                        var divWidth = d3.select(this).property("offsetWidth");
                                        // triggered by donut/legend
                                        return (d3.event.target.tagName === "path" ?                                         
                                            d3.event.pageX - 0.5 * divWidth :                                         
                                            arc[0][0].getBoundingClientRect().left) + "px";                                    
                                    }).style("top", function(d) {
                                        // y coordinate
                                        var divHeight = d3.select(this).property("offsetHeight");
                                        // triggered by donut/legend
                                        return (d3.event.target.tagName === "path" ?                                            
                                            (d3.event.layerY < divHeight ? d3.event.pageY + 0.5 * divHeight : d3.event.pageY - 1.5 * divHeight) :
                                            (d3.event.pageY > (arc[0][0].getBoundingClientRect().top + divHeight) ? arc[0][0].getBoundingClientRect().top : d3.event.pageY + divHeight/2)) + "px";
                                });
                            };

                    var getColor = function(name, i) {
                        var sColor = '';
                        if (useStatusColor === true) {
                            switch (name) {
                            case 'Success':
                                sColor = '#6dc066';
                                break;
                            case 'Failure':
                                sColor = '#ff0000';
                                break;
                            case 'Warning':
                                sColor = '#ffd700';
                                break;
                            }
                        } else {
                            sColor = colors(i);
                        }
                        return sColor;
                    };

                    var redraw = function(newData) {
                        // remove the selected donut
                        if (bubble.node()) {
                            d3.select(bubble.node().parentNode).selectAll("g path").remove();
                            d3.select(bubble.node().parentNode).selectAll("g.sapEtdDonutButton").remove();
                        }
        
                        // draw the donut
                        var outerRadius = radius;
                        var arc = d3.svg.arc().outerRadius(outerRadius).innerRadius(innerRadius);

                        var slices = bubble.selectAll("path.arc").data(pie(newData.sort(function(a, b) {
                            // sort with desceding order
                            if (a.value < b.value) {
                                return +1;
                            }
                            if (a.value > b.value) {
                                return -1;
                            }
                            return 0;
                        }).filter(function(nd, ni) {
                            // display only the top 100
                            return ni < showLimit;
                        })), function(d) {
                            return d.data.id;
                        });

                        // Enter mode
                        slices.enter().append("path").attr("class", "arc").each(function(d) {
                            d.outerRadius = outerRadius - 20;
                        });
        
                        // Update mode
                        slices.attr("data-legend", function(d, i) {
                            return d.data.id;
                        }).attr("fill", function(d, i) {
                            return getColor(d.name, i);
                        }).attr("stroke", "white").attr("stroke-width", 0).on("click", function(d, i) {
                            d3.event.stopPropagation();

                            var tooltip = d3.select("body").select("div.sapEtdDonutTooltip");
                            tooltip.html("");
                            tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");

                            // fire the nodepress event
                            d3.select(this.parentNode).attr("pointer-events", "none");
                            dispatch.select(this, dataInverted, d, i);
                            d3.select(this.parentNode).attr("pointer-events", null);
                        }).on("mousemove", function(d, i) {
                            selectData(d.data.id, i);
                        }).on("mouseout", function(d, i) {
                            deselectData(d.data.id, i);
                        });

                        slices.transition().attrTween("d", function(d) {
                            var currentArc = this.__current__;

                            currentArc = currentArc || {
                                startAngle : 0,
                                endAngle : 0
                            };
        
                            var interpolate = d3.interpolate(currentArc, d);
                            this.__current__ = interpolate(1);

                            return function(t) {
                                return arc(interpolate(t));
                            };
                        });
        
                        // Exit mode
                        slices.exit().remove();

                        // toggle button
                        _renderInvertButton();
        
                        // toggle button
                        if (showLegend) {
                            _renderLegend(dataInverted);
                        }
                    };
                    
                    _renderInvertButton = function() {
                        if (data.length <= 0) {
                            return;
                        }

                        // build-in inverse button
                        var d3Toggle = bubble.selectAll("g.sapEtdDonutButton").data(_inversion);

                        // Enter
                        var d3ToggleGroup = d3Toggle.enter().append("g").attr("class", "sapEtdDonutButton");
                        if (showLabel) {
                            d3ToggleGroup.append("text");
                        }
                        d3ToggleGroup.append("circle");

                        // Update
                        d3Toggle.on("click", function(d) {
                            d3.event.stopPropagation();
                            if (showLabel) {
                                d3.select(this).select("text").text(function(d) {
                                    return d3.select(this).text() === d.invert ? d.back : d.invert;
                                });
                            }
                            // inverse the data
                            for (var j = 0; j < data.length; ++j) {
                                var sVal = data[j].value;
                                data[j].value = sVal && +sVal > 0 ? 100 / sVal : null;
                            }

                            // show that data are inverted
                            dataInverted = !dataInverted;

                            // graph must be updated
                            redraw(data);
                        });

                        // var sBubbleId = bubble.attr("id");
                        if (showLabel) {

                            d3Toggle.select("text").attr("text-anchor", "middle").text(function(d, i) {
                                return dataInverted ? d.back : d.invert;
                            });
                            // d3Toggle.select("text").append("textPath").attr("xlink:href "
                            // + sBubbleId).text(function(d, i) {
                            // return dataInverted ? d.back : d.invert;
                            // });
                        }
                        // opacity depends on if data are inverted
                        d3Toggle.select("circle").attr("opacity", dataInverted ? 0.3 : 0.0).attr("r", innerRadius - 5);

                        d3Toggle.style("display", data.length > 1 ? null : "none");

                        // Exit
                        d3Toggle.exit().remove();
                    };

                    _renderLegend = function(bInverted) {
                        var legendPadding = 5;
                        var sId = "#" + controlId + "_Legend.sapEtdDonutLegend";
                        // g is needed so that the scrollbar is added if list is longer than
                        // area
                        var g = d3.select(sId).select("svg > g");
                        if (g.empty()) {
                            g = d3.select(sId).append("svg").append("g").classed("legend-items", true);
                        }
                        var svgDonut = d3.select("#" + controlId + "_Content").select("svg");

                        var aLegendData = svgDonut.select("g").selectAll("path").data();

                        // bullet points
                        // --> Selection
                        var oBullet = g.selectAll("g").data(aLegendData, function(d) {
                            return d.data.id;
                        });

                        oBullet.data().forEach(function(d, i) {
                            d.data.color = getColor(d.name, i);
                        });

                        // --> Exit mode
                        oBullet.exit().remove();

                        // --> Update mode
                        oBullet.select("rect").style("fill", function(d) {
                            return d.data.color;
                        });
                        oBullet.selectAll("text").text(function(d) {
                            return d.data.id + "(" + d.data.raw + ")";
                        });
                        oBullet.attr("transform", "translate(0,0)").attr("transform", function(d, i) {
                            return "translate(0," + (i * 12) + ")";
                        });
                        
                        // --> Enter mode
                        var oBulletGroup = oBullet.enter().append("g").on("mouseover", function(d, i) {
                            selectData(d.data.id);
                        }).on("mouseout", function(d, i) {
                            deselectData(d.data.id);
                        }).on("click", function(d, i) {
                            // fire the nodepress event
                            d3.select(this.parentNode).attr("pointer-events", "none");
                            dispatch.select(this, bInverted, d, i);
                            d3.select(this.parentNode).attr("pointer-events", null);
                        });
                        oBulletGroup.append("rect").attr("x", 0).attr("width", 10).attr("height", 10)
                        // style
                        .style("fill", function(d, i) {
                            return getColor(d.name, i);
                        });
                        oBulletGroup.append("text").attr("x", 12).attr("y", function(d, i) {
                            return 0.75 + "em";
                        }).text(function(d) {
                            return d.data.id + "(" + d.data.raw + ")";
                        });
                        oBulletGroup.attr("transform", "translate(0,0)").attr("transform", function(d, i) {
                            return "translate(0," + (i * 12) + ")";
                        });

                        // Reposition and resize the box
                        try {
                            var lbbox = g.node().getBBox();

                            // fixed width from parent is used here
                            var svg = d3.select(g.node().parentNode);
                            svg.attr("height", (lbbox.height + 2 * legendPadding));
                        } catch (e) {
                        }
                    };                    

                    // update
                    redraw(data);
                };
                
                inner = d3.rebind(inner, dispatch, "on");

                inner.selectHandler = function(value) {
                    if (!arguments.length) {
                        return selectHandler;
                    }
                    selectHandler = value;
                    return inner;
                };

                inner.controlId = function(value) {
                    if (!arguments.length) {
                        return controlId;
                    }
                    controlId = value;
                    return inner;
                };

                inner.showLegend = function(value) {
                    if (!arguments.length) {
                        return showLegend;
                    }
                    showLegend = value;
                    return inner;
                };

                inner.showLabel = function(value) {
                    if (!arguments.length) {
                        return showLabel;
                    }
                    showLabel = value;
                    return inner;
                };

                inner.node = function(value) {
                    if (!arguments.length) {
                        return node;
                    }
                    node = value;
                    return inner;
                };

                inner.pie = function(value) {
                    if (!arguments.length) {
                        return pie;
                    }
                    pie = value;
                    return inner;
                };

                inner.radius = function(value) {
                    if (!arguments.length) {
                        return radius;
                    }
                    radius = value;
                    return inner;
                };

                inner.innerRadius = function(value) {
                    if (!arguments.length) {
                        return innerRadius;
                    }
                    innerRadius = value;
                    return inner;
                };

                inner.useStatusColor = function(value) {
                    if (!arguments.length) {
                        return useStatusColor;
                    }
                    useStatusColor = value;
                    return inner;
                };

                inner.showLimit = function(value) {
                    if (!arguments.length) {
                        return showLimit;
                    }
                    showLimit = value;
                    return inner;
                };

                return inner;
            }
        };
