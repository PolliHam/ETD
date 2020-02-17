/* globals d3 */
/* exported Timechart */
$.sap.require("sap.ui.thirdparty.d3");
$.sap.includeStyleSheet("/sap/secmon/ui/commons/controls/css/Tooltip.css");

function Timechart() {
    var instance = {}, oColors = {}, data = [], xAxis, yAxis, navXAxis, brush, xScale, yScale, navXScale, navYScale;
    // //////////////////////////////////////////////////////////////////////////
    // RENDERER //
    // //////////////////////////////////////////////////////////////////////////
    instance.render =
            function() {
                // /////////////////////////////////////
                // VARIABLES //
                // /////////////////////////////////////
                var oConfig = instance.oConfig;

                xScale = d3.scaleTime().range([ 0, oConfig.mainWidth ]);
                xAxis = d3.axisBottom().scale(xScale).tickPadding(2);

                navXScale = d3.scaleTime().range([ 0, oConfig.navWidth ]);
                navXAxis = d3.axisBottom().scale(navXScale);

                yScale = d3.scaleLinear().range([ oConfig.mainHeight, 0 ]);
                yAxis = d3.axisLeft().scale(yScale);

                navYScale = d3.scaleLinear().range([ oConfig.navHeight, 0 ]);

                // /////////////////////////////////////
                // MAIN CHART //
                // /////////////////////////////////////
                // CREATE SVG
                var svg = d3.select('#' + oConfig.parent);

                if (oConfig.bShowTooltip) {
                    var tooltip = d3.select("body").select("div.sapEtdTooltip");
                    if (tooltip.empty()) {
                        tooltip = d3.select("body").append("div").attr("class", "sapEtdTooltip").style("opacity", 0);
                    }
                }

                // CREATE CHART AREA
                var mainChart =
                        svg.append('g').attr('id', oConfig.parent + '--mainChart').attr('clip-path', 'url(#' + instance.oConfig.parent + '--clip)').attr("transform",
                                "translate(" + oConfig.margin.left + "," + oConfig.margin.top + ")");

                // APPEND X AXIS
                svg.append('svg:g').attr('id', instance.oConfig.parent + '--xAxis').attr("transform", "translate(" + oConfig.margin.left + "," + (oConfig.mainHeight + oConfig.margin.top + 5) + ")")
                        .call(xAxis).attr('z-index', 1).selectAll("text").style("font-size", oConfig.fontSize);

                // APPEND Y AXIS
                svg.append('svg:g').attr('id', instance.oConfig.parent + '--yAxis').attr('transform', 'translate(' + oConfig.margin.left + ',' + oConfig.margin.top + ')').call(yAxis).attr('z-index',
                        1).selectAll("text").style("font-size", oConfig.fontSize);

                // APPEND Grid
                mainChart.append("g").attr("class", instance.oConfig.parent + '--grid').call(_generateGrid(yScale).tickSize(-oConfig.mainWidth).tickFormat(""));

                d3.selectAll('.' + instance.oConfig.parent + '--grid line').style('stroke', function() {
                    return sap.ui.core.theming.Parameters.get("sapUiChartGridlineColor");
                }).attr("x2", oConfig.mainWidth);

                d3.selectAll('.' + instance.oConfig.parent + '--grid .domain').remove();

                // /////////////////////////////////////
                // MAIN CHART ZOOM //
                // /////////////////////////////////////
                // ZOOM
                var zoom =
                        d3.zoom().scaleExtent([ 1, 50 ]).translateExtent([ [ 0, 0 ], [ oConfig.mainWidth, oConfig.mainHeight ] ]).extent([ [ 0, 0 ], [ oConfig.mainWidth, oConfig.mainHeight ] ]).on(
                                'zoom', zoomed);

                mainChart.append("rect").attr('id', instance.oConfig.parent + '--zoom').attr("width", oConfig.mainWidth).attr("height", oConfig.mainHeight)
                // .attr("transform", "translate(" + oSettings.margin + "," + oSettings.margin + ")")
                .attr('opacity', 0).call(zoom);

                // Clippath
                mainChart.append("defs").append("clipPath").attr("id", instance.oConfig.parent + '--clip').append("rect").attr("width", oConfig.mainWidth).attr("height",
                        oConfig.mainHeight + (oConfig.dotSize / 2)).attr('pointer-events', 'none');

                // /////////////////////////////////////
                // NAVCHART //
                // /////////////////////////////////////

                // CREATE NAVCHART
                var navChart = svg.append('g').attr('id', instance.oConfig.parent + '--navChart').attr("transform", "translate(" + oConfig.navMargin.left + "," + oConfig.navMargin.top + ")");

                // APPEND AXIS
                navChart.append('g').attr('id', instance.oConfig.parent + '--navChart--Axis').call(navXAxis).attr("transform", "translate(0," + oConfig.navHeight + ")").selectAll("text").style(
                        "font-size", oConfig.fontSize);

                // CREATE BRUSH
                brush = d3.brushX().on('brush', brushed).on('end', brushFinished).extent([ [ 0, 0 ], [ oConfig.navWidth, oConfig.navHeight ] ]);

                // APPEND BRUSH
                navChart.append('g').attr('id', instance.oConfig.parent + '--navChart--brush').call(brush).selectAll('rect').attr('height', oConfig.navHeight);

                d3.select('#' + instance.oConfig.parent + '--navChart--brush').select(".selection").style("fill", function() {
                    return sap.ui.core.theming.Parameters.get("sapUiChartPaletteSequentialHue1Dark2");
                });

                d3.select('#' + instance.oConfig.parent + '--navChart--brush').selectAll(".handle").style("fill", function() {
                    return sap.ui.core.theming.Parameters.get("sapUiChartPaletteSequentialHue1");
                });

                // /////////////////////////////////////
                // LEGEND //
                // /////////////////////////////////////

                if (oConfig.bShowLegend) {

                    // SELECTION
                    d3.select('#' + oConfig.parent).append('svg').attr('id', instance.oConfig.parent + '--legend').append('g').attr('height', 20);
                }

                // /////////////////////////////////////
                // Brush & Zoom //
                // /////////////////////////////////////

                /*
                 * function called when user brushes updates the Chart content
                 */
                function brushed() {
                    if (d3.event.sourceEvent) {
                        var selection = d3.event.selection || navXScale.range();

                        xScale.domain(selection.map(navXScale.invert, navXScale));
                        d3.select('#' + instance.oConfig.parent + '--mainChart').selectAll('.section').data(data);
                        _updateDots();
                        _updateLines();
                        _updateAxis(xAxis);
                    } else {
                        _updateAxis(xAxis, 700);
                    }
                }

                /*
                 * function called when brushing stopped it throws an event with the two dates and the scope interval
                 */

                function brushFinished() {
                    if (d3.event.sourceEvent) {
                        var selection = d3.event.selection || navXScale.range(), dates = selection.map(navXScale.invert, navXScale), scope = _getScope(dates);
                        oConfig.oControl.fireScopeChange({
                            scope : scope,
                            startDate : dates[0],
                            endDate : dates[1]
                        });
                    }
                }

                /*
                 * function called when user zoom updates the Chart content and the brush
                 */

                function zoomed() {
                    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') {
                        return;
                    }
                    var t = d3.event.transform;
                    xScale.domain(t.rescaleX(navXScale).domain());

                    d3.select('#' + instance.oConfig.parent + '--mainChart').selectAll('.section').data(data);

                    _updateDots();
                    _updateLines();
                    _updateAxis(xAxis);

                    svg.select('#' + instance.oConfig.parent + '--navChart--brush').call(brush.move, xScale.range().map(t.invertX, t));
                }

                return instance;
            };
    // //////////////////////////////////////////////////////////////////////////
    // DATA SETTER //
    // //////////////////////////////////////////////////////////////////////////

    instance.data = function(d) {
        _setColors(d);
        data = d;

        // UPDATE SCALE
        _updateScales();

        // UPDATE GRAPH
        _updateLines();
        _updateDots();
        _updateNav();
        _updateLegend();
        _updateGrid();

        // UPDATE AXIS
        xAxis.scale(xScale);
        d3.select('#' + instance.oConfig.parent + '--xAxis').call(xAxis);

        yAxis.scale(yScale);
        d3.select('#' + instance.oConfig.parent + '--yAxis').call(yAxis);

        navXAxis.scale(navXScale);
        d3.select('#' + instance.oConfig.parent + '--navChart--Axis').call(navXAxis);
        return instance;
    };

    instance.setScopeData = function(aScopeData) {
        _updateLines(0, aScopeData);

        _updateDots(0, aScopeData);

        return instance;
    };

    instance.oConfig = {};

    // //////////////////////////////////////////////////////////////////////////
    // UPDATE AND RESIZE //
    // //////////////////////////////////////////////////////////////////////////

    instance.resize = function() {
        var oConfig = instance.oConfig;

        var brushedRange = d3.brushSelection(d3.select('#' + instance.oConfig.parent + '--navChart--brush').node()) || [ 0, 0 ];
        brushedRange = brushedRange.map(navXScale.invert, navXScale);

        // CHANGE SCALE SIZE
        xScale.range([ 0, oConfig.mainWidth ]);
        navXScale.range([ 0, oConfig.navWidth ]);
        yScale.range([ oConfig.mainHeight, 0 ]);
        navYScale.range([ oConfig.navHeight, 0 ]);

        // UPDATE GRID
        d3.selectAll('.' + instance.oConfig.parent + '--grid line').transition().duration(700).attr("x2", oConfig.mainWidth);
        d3.select('#' + oConfig.parent + '--clip').select("rect").transition().duration(700).attr("width", oConfig.mainWidth).attr("height", oConfig.mainHeight + (oConfig.dotSize / 2));

        // UPDATE GRAPH
        _updateDots(700);
        _updateNav(700);
        _updateLines(700);
        _updateGrid();

        // UPDATE AXIS
        xAxis.scale(xScale);
        d3.select('#' + instance.oConfig.parent + '--xAxis').transition().duration(700).call(xAxis);
        yAxis.scale(yScale);
        d3.select('#' + instance.oConfig.parent + '--yAxis').transition().duration(700).call(yAxis);
        navXAxis.scale(navXScale);
        d3.select('#' + instance.oConfig.parent + '--navChart--Axis').transition().duration(700).call(navXAxis);
        // UPDATE THE BRUSH
        brush.extent([ [ 0, 0 ], [ oConfig.navWidth, oConfig.navHeight ] ]);
        brush.move(d3.select('#' + instance.oConfig.parent + '--navChart--brush').transition().duration(0), [ navXScale(brushedRange[0]), navXScale(brushedRange[1]) ]);
        d3.select('#' + instance.oConfig.parent + '--navChart--brush').call(brush);

    };

    /*
     * function updates the Axis
     */

    function _updateAxis(xAxis, time) {
        d3.select('#' + instance.oConfig.parent + '--xAxis').transition().duration(time).call(xAxis).selectAll("text").style("font-size", instance.oConfig.fontSize);
    }

    /*
     * function create / update / removes the dots from the context @param context
     */

    function _updateLines(time, dat) {
        dat = dat || data;
        var lineGenerator = d3.line().x(function(d) {
            return xScale(new Date(d.timestamp));
        }).y(function(d) {
            return yScale(d.y);
        });
        var section = d3.select('#' + instance.oConfig.parent + '--mainChart').selectAll('.' + instance.oConfig.parent + '--mainChart--section').data(dat);

        var sectionEnter = section.enter().append('g').attr('class', instance.oConfig.parent + '--mainChart--section').attr('id', function(d, i) {
            return instance.oConfig.parent + '--mainChart--section-' + i;
        });

        sectionEnter.append('path').attr('d', function(d, i) {
            return lineGenerator(d.data);
        }).attr('fill', 'none').attr('stroke', function(d, i) {
            return oColors[d.name];
        }).attr('stroke-width', instance.oConfig.strokeWidth).on("mouseover", function() {
            _graphHoverIn(this.parentElement);
        }).on("mouseout", function() {
            _graphHoverOut(this.parentElement);
        });

        section.select('path').transition().duration(time).attr('d', function(d, i) {
            return lineGenerator(d.data);
        }).attr('fill', 'none').attr('stroke', function(d, i) {
            return oColors[d.name];
        });

        section.exit().remove();

    }

    /*
     * function updates, the Dots on the data @param section with data @param time for transition if wanted
     */

    function _updateDots(time, dat) {
        dat = dat || data;
        var dots =
                d3.select('#' + instance.oConfig.parent + '--mainChart').selectAll('.' + instance.oConfig.parent + '--mainChart--section').selectAll(
                        '.' + instance.oConfig.parent + '--mainChart--section--dots').data(function(d, i) {
                    return d.data;
                });

        dots.transition().duration(time).attr('cx', function(d) {
            return xScale(new Date(d.timestamp));
        }).attr('cy', function(d) {
            return yScale(d.y);
        }).attr('stroke', function(d) {
            return oColors[d3.select(this.parentElement).data()[0].name];
        });

        dots.enter().append('circle').attr('class', instance.oConfig.parent + '--mainChart--section--dots').attr('r', instance.oConfig.dotSize).attr('cx', function(d) {
            return xScale(new Date(d.timestamp));
        }).attr('cy', function(d) {
            return yScale(d.y);
        }).attr('stroke', function(d) {
            return oColors[d3.select(this.parentElement).data()[0].name];
        }).attr('stroke-width', instance.oConfig.strokeWidth).attr('fill', 'white');

        d3.selectAll('.' + instance.oConfig.parent + '--mainChart--section--dots').on("mouseover", function(d) {
            _graphHoverIn(this.parentElement);
            if (instance.oConfig.bShowTooltip) {
                var tooltip = d3.select("body").select("div.sapEtdTooltip");
                tooltip.transition().duration(100).style('opacity', 1);

                var html = "<table>";
                html += "<tr><td class='sapEtdDonutTooltipleftColumn'> Timestamp:</td>" + "<td>" + d.timestamp + "</td></tr>";
                d.details.forEach(function(obj) {
                    html += "<tr><td class='sapEtdDonutTooltipleftColumn'>" + obj.name + ":</td>" + "<td>" + obj.value + "</td></tr>";
                });
                html += "</table>";

                tooltip.html(html).style("left", (d3.event.pageX) + "px").style("top", (d3.event.pageY - 28) + "px");
            }
        }).on("mouseout", function(d) {
            _graphHoverOut(this.parentElement);

            if (instance.oConfig.bShowTooltip) {
                var tooltip = d3.select("body").select("div.sapEtdTooltip");
                tooltip.html("");
                tooltip.style("opacity", 0).style("left", "0px").style("top", "0px");
            }

        });

        dots.exit().remove();
    }

    /*
     * Updates Navigator @param time when transition wanted
     */

    function _updateNav(time) {
        // //////////////////////////////
        // GRAPH GENERATOR AND SELECTOR//
        // //////////////////////////////
        var navData = d3.area().x(function(d) {
            return navXScale(new Date(d.timestamp));
        }).y0(instance.oConfig.navHeight).y1(function(d) {
            return navYScale(d.y);
        });

        var navSection = d3.select('#' + instance.oConfig.parent + '--navChart').selectAll('.' + instance.oConfig.parent + '--navChart--section').data(data);

        // //////////////////////////////
        // ENTER //
        // //////////////////////////////
        var navSectionEnter = navSection.enter().append('g').attr('class', instance.oConfig.parent + '--navChart--section').attr('id', function(d, i) {
            return instance.oConfig.parent + '--navChart--section-' + i;
        });

        navSectionEnter.append('path').attr('class', instance.oConfig.parent + '--navChart--section--path').attr('d', function(d, i) {
            return navData(d.data);
        }).attr('fill', 'none').attr('fill', function(d, i) {
            return oColors[d.name];
        }).attr('stroke', function() {
            return sap.ui.core.theming.Parameters.get("sapUiChartSequenceNeutral");
        });

        // //////////////////////////////
        // UPDATE //
        // //////////////////////////////

        navSection.select('path').transition().duration(time).attr('fill', function(d, i) {
            return oColors[d.name];
        }).attr('d', function(d, i) {
            return navData(d.data);
        });

        // //////////////////////////////
        // EXIT //
        // //////////////////////////////
        navSection.exit().remove();

        // Move Brush to the Foreground
        d3.select('#' + instance.oConfig.parent + '--navChart--brush').moveToFront();
    }

    /**
     * Enter / Update / Exit the Legend
     */

    function _updateLegend() {
        // //////////////////////////////
        // SELECTOR //
        // //////////////////////////////

        var legendItems = d3.select('#' + instance.oConfig.parent + '--legend').selectAll('.' + instance.oConfig.parent + '--legend--items').data(data);

        // //////////////////////////////
        // ENTER //
        // //////////////////////////////

        var legendItemsEnter = legendItems.enter().append('g').on('mouseover', function(d, i) {
            var section = d3.selectAll('.' + instance.oConfig.parent + '--mainChart--section').filter(function(obj, i) {
                return obj.name === d.name;
            }).node();
            _graphHoverIn(section);
        }).on('mouseout', function(d, i) {
            var section = d3.selectAll('.' + instance.oConfig.parent + '--mainChart--section').filter(function(obj, i) {
                return obj.name === d.name;
            }).node();
            _graphHoverOut(section);
        }).attr('class', instance.oConfig.parent + '--legend--items');

        legendItemsEnter.append('rect').attr('x', 0).attr('width', 10).attr('height', 10).style('fill', function(d, i) {
            return oColors[data[i].name];
        });

        legendItemsEnter.append("text").attr("x", 12).attr("y", function(d, i) {
            return 0.75 + "em";
        }).text(function(d) {
            return d.name;
        }).style('font-size', 14);

        legendItemsEnter.attr("transform", "translate(0,0)").attr("transform", function(d, i) {
            return "translate(0," + (i * 20) + ")";
        });

        // //////////////////////////////
        // UPDATE //
        // //////////////////////////////
        legendItems.select('rect').style('fill', function(d, i) {
            return oColors[data[i].name];
        });

        legendItems.select("text").attr("y", function(d, i) {
            return 0.75 + "em";
        }).text(function(d) {
            return d.name;
        });

        d3.select('#' + instance.oConfig.parent + '--legend').attr('height', function() {
            return legendItems.size() * 20;
        });

        // //////////////////////////////
        // EXIT //
        // //////////////////////////////

        legendItems.exit().remove();

    }

    /**
     * updates the Scale domains
     */

    function _updateScales() {
        xScale.domain(d3.extent([].concat.apply([], data.map(function(d) {
            return d.data.map(function(pointData) {
                return new Date(pointData.timestamp);
            });
        }))));
        yScale.domain([ _getMinY(), _getMaxY() / 100 * 105 ]);

        navXScale.domain(d3.extent([].concat.apply([], data.map(function(d) {
            return d.data.map(function(pointData) {
                return new Date(pointData.timestamp);
            });
        }))));

        navYScale.domain([ _getMinY(), _getMaxY() / 100 * 110 ]);
    }

    function _updateGrid() {
        d3.selectAll('.' + instance.oConfig.parent + '--grid').call(_generateGrid(yScale).tickSize(-instance.oConfig.mainWidth).tickFormat(""));
        d3.selectAll('.' + instance.oConfig.parent + '--grid line').style('stroke', function() {
            return sap.ui.core.theming.Parameters.get("sapUiChartGridlineColor");
        }).attr("x2", instance.oConfig.mainWidth);

        d3.selectAll('.' + instance.oConfig.parent + '--grid .domain').remove();
    }

    // //////////////////////////////////////////////////////////////////////////
    // HOVER //
    // //////////////////////////////////////////////////////////////////////////

    /**
     * shows the tooltip on mouseout and hightlights the selected section
     * 
     * @param {Object}
     *            section selected section
     */

    function _graphHoverIn(section) {
        d3.select(section).select('path').transition().duration(100).attr('stroke-width', instance.oConfig.strokeWidth + 2);
        d3.select(section).selectAll('.' + instance.oConfig.parent + '--mainChart--section--dots').transition().duration(100).attr('r', instance.oConfig.dotSize + 1).attr('stroke-width',
                instance.oConfig.strokeWidth + 1);
        d3.select(section).moveToFront();

        var legend = d3.selectAll('.' + instance.oConfig.parent + '--legend--items').filter(function(obj, i) {
            return obj.name === d3.select(section).data()[0].name;
        });
        legend.select('rect').attr('stroke', 'gray');
        legend.select('text').attr('fill', function() {
            return sap.ui.core.theming.Parameters.get("apUiButtonHoverBackground");
        });
    }

    /**
     * hides the tooltip on mouseout and reset the selected section
     * 
     * @param {Object}
     *            section selected section
     */

    function _graphHoverOut(section) {
        d3.select(section).select('path').transition().duration(100).attr('stroke-width', instance.oConfig.strokeWidth);
        d3.select(section).selectAll('.' + instance.oConfig.parent + '--mainChart--section--dots').transition().duration(100).attr('r', instance.oConfig.dotSize).attr('stroke-width',
                instance.oConfig.strokeWidth);

        var legend = d3.selectAll('.' + instance.oConfig.parent + '--legend--items').filter(function(obj, i) {
            return obj.name === d3.select(section).data()[0].name;
        });
        legend.select('rect').attr('stroke', '');
        legend.select('text').attr('fill', function() {
            return sap.ui.core.theming.Parameters.get("sapUiMlt");
        });
    }

    /**
     * moves the svg element to the front
     * 
     * @return {Object} Element
     */

    d3.selection.prototype.moveToFront = function() {
        return this.each(function() {
            this.parentNode.appendChild(this);
        });
    };

    // //////////////////////////////////////////////////////////////////////////
    // HELPER FUNCTIONS //
    // //////////////////////////////////////////////////////////////////////////

    /**
     * return the min. value of the dataset
     * 
     * @return {Number} min value
     */
    function _getMinY() {
        return d3.min(data, function(d) {
            return d3.min(d.data, function(innerD) {
                return parseInt(innerD.y);
            });
        });
    }

    /**
     * returns the max. value of the dataset
     * 
     * @return {Number} max value
     */

    function _getMaxY() {
        return d3.max(data, function(d) {
            return d3.max(d.data, function(innerD) {
                return parseInt(innerD.y);
            });
        });
    }

    /**
     * generates the Chart grid
     * 
     * @param {Object}
     *            yScale
     * @return {Object} grid
     */

    function _generateGrid(yScale) {
        return d3.axisLeft(yScale).ticks(10);
    }

    /**
     * returns the interval of two dates
     * 
     * @param {Array}
     *            dates with start and end date
     * @return {String} Range
     */

    function _getScope(dates) {
        var difference = (dates[1].getTime() - dates[0].getTime()) / 1000;
        if (difference <= 127008000 && difference > 4233600) {
            return "MONTH";
        } else if (difference <= 4233600 && difference > 604800) {
            return "WEEK";
        } else if (difference <= 604800 && difference > 86400) {
            return "DAY";
        } else if (difference <= 86400 && difference > 3600) {
            return "HOUR";
        } else {
            return "MINUTE";
        }
    }

    /**
     * sets colors for lines with unset color
     * 
     * @param {Object}
     *            d dataset
     * @constructor
     */
    function _setColors(d) {
        oColors = {};
        var name;
        var color;
        for (var i = 0; i < d.length; i++) {
            name = d[i].name;
            color = d[i].color;
            if (!oColors[name]) {
                if (color === "" || color === "none") {
                    var j = 0;
                    var set = false;
                    while (set === false) {
                        var newColor = sap.ui.core.theming.Parameters.get("sapUiChart" + (++j));
                        if ($.inArray(newColor, Object.keys(oColors).map(function(dat) {
                            return oColors[dat];
                        })) === -1 && $.inArray(newColor, d.map(function(dat) {
                            return dat.color;
                        })) === -1) {
                            oColors[name] = newColor;
                            set = true;
                        }
                    }
                } else {
                    oColors[name] = color;
                }
            } else {
                if (oColors[name] !== color && (d[i].color === "" || color === "none")) {
                    oColors[name] = color;
                }
            }
        }
    }

    return instance;
}
