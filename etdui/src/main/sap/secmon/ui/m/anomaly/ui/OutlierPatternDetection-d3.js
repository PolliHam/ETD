/* globals d3, width:true, height:true */
/* exported outlierPatternDetection */
$.sap.require("sap.secmon.ui.m.anomaly.ui.Sunburst-d3");

function outlierPatternDetection(fn, spider, fnShowContextMenue) {
    var _mySunburst;
    var _callBackFn = fn;
    var _fnShowContextMenue = fnShowContextMenue;
    var _spider = spider;
    var _area;
    var w, h;
    var _selectedEntity;
    function me(area, entities, axesDomain) {

        _area = area;
        var margin = {
            top : 0,
            bottom : 0,
            right : 0,
            left : 0
        };
        w = width - margin.left - margin.right;
        h = height - margin.top - margin.bottom;
        var corner = {
            X1 : w * 0.2 + margin.left,
            Y1 : margin.top,
            X2 : w * 0.8 + margin.left,
            Y2 : margin.top,
            X3 : w * 0.8 + margin.left,
            Y3 : h * 1.0 + margin.top,
            X4 : w * 0.2 + margin.left,
            Y4 : h * 1.0 + margin.top
        };
        var root = {
            X : w * 0.5 + margin.left,
            Y : h * 0.8 + margin.top,
        };
        var coord = {
            XArea : root.X,
            YArea : margin.top,
            XCentroidY : w * 0.8 + margin.left,
            YCentroidY : h * 1.0 + margin.top,
            XCentroidX : w * 0.2 + margin.left,
            YCentroidX : h * 1.0 + margin.top
        };

        // f(x) = m * x + c
        var m = (corner.Y4 - root.Y) / (root.X - corner.X4);
        var aAxis = [ "AXIS_LBL_AREA", "AXIS_LBL_CENTROIDX", "AXIS_LBL_CENTROIDY" ];
        // Arrow
        area.append("svg:marker").attr("id", "arrow-head").attr("viewBox", "0 -5 10 10").attr("refX", 0).attr("refY", 0).attr("markerWidth", 10).attr("markerHeight", 10).attr("orient", "auto")
                .append("svg:path").attr("d", "M0,-5L10,0L0,5").attr("class", "arrow");
        // Axis
        var axis = area.selectAll(".axisOutlierPattern").data(aAxis).enter().append("g").attr("class", "axisOutlierPattern");
        axis.append("svg:line").attr("id", function(d, i) {
            return "axis" + aAxis[i];
        }).attr("x1", root.X).attr("y1", root.Y).attr("x2", function(d, i) {
            var xEnd;
            switch (d) {
            case "AXIS_LBL_AREA":
                xEnd = coord.XArea;
                break;
            case "AXIS_LBL_CENTROIDX":
                xEnd = coord.XCentroidX;
                break;
            case "AXIS_LBL_CENTROIDY":
                xEnd = coord.XCentroidY;
                break;
            }
            return xEnd;
        }).attr("y2", function(d, i) {
            var yEnd;
            switch (d) {
            case "AXIS_LBL_AREA":
                yEnd = coord.YArea + 20;
                break;
            case "AXIS_LBL_CENTROIDX":
                yEnd = coord.YCentroidX;
                break;
            case "AXIS_LBL_CENTROIDY":
                yEnd = coord.YCentroidY;
                break;
            }
            return yEnd;
        }).style("stroke", "grey").style("stroke-width", "0.7px").style("marker-end", "url(#arrow-head)");
        // Add label to each axis
        axis.append("text").attr("class", "legend").text(function(d) {
            return this.getModel("i18n").getResourceBundle().getText(d);
        }).style("font-size", "14px").attr("text-anchor", "middle").attr("dy", "1.5em").attr("transform", function(d, i) {
            var labelEndPos = 0;
            if (d === "AXIS_LBL_AREA") {
                labelEndPos = -25;
            }
            return "translate(0, " + labelEndPos + ")";
        }).attr("x", function(d, i) {
            var labelPosX = d3.select(this.parentNode).select("line").attr("x2");
            return labelPosX;
        }).attr("y", function(d, i) {
            var labelPosY = d3.select(this.parentNode).select("line").attr("y2");
            return labelPosY;
        });
        // Ground
        var ground = area.selectAll(".groundOutlierPattern").data([ 1 ]).enter().append("g").attr("class", "groundOutlierPattern");
        for (var i = 0; i < 5; i++) {
            var iPartition = (i + 1) / 5;
            ground.append("line").attr("x1", root.X + (corner.X2 - root.X) * iPartition).attr("y1", root.Y + (coord.YCentroidX - root.Y) * iPartition).attr("x2",
                    coord.XCentroidX + (root.X - coord.XCentroidX) * iPartition).attr("y2", coord.YCentroidX + (coord.YCentroidX - root.Y) * iPartition).attr("class", "line").style("stroke", "grey")
                    .style("stroke-width", "0.3px");
            ground.append("line").attr("x1", root.X - (root.X - corner.X4) * iPartition).attr("y1", root.Y + (coord.YCentroidX - root.Y) * iPartition).attr("x2",
                    coord.XCentroidY - (root.X - corner.X4) * iPartition).attr("y2", coord.YCentroidY + (coord.YCentroidX - root.Y) * iPartition).attr("class", "line").style("stroke", "grey").style(
                    "stroke-width", "0.3px");
        }
        // some calculations and function
        var Area = d3.scale.linear().domain([ axesDomain.areaMin, axesDomain.areaMax ]).range([ coord.YArea, root.Y ]);
        // calculate max centroid via Satz des Pythagoras
        var CentroidMax = Math.sqrt(Math.pow(h - root.Y, 2) + Math.pow((root.X - corner.X4), 2));
        var CentroidX = d3.scale.linear().domain([ axesDomain.centroidXMin, axesDomain.centroidXMax ]).range([ 0, CentroidMax ]);
        var CentroidY = d3.scale.linear().domain([ axesDomain.centroidYMin, axesDomain.centroidYMax ]).range([ 0, CentroidMax ]);

        _mySunburst = sap.secmon.ui.m.anomaly.ui["Sunburst-d3"].sunburst(_fnShowContextMenue, _spider, _area);

        // plot entities
        // set initial position to root
        var circles = area.append("g").selectAll("circle").data(entities).enter().append("circle").attr("id", function(d, i) {
            return d.entity.entity[0];
        }).attr("r", 5.5).style('fill', function(d) {
            if (d.entity.isOutlier) {
                return '#e31c1c';
            } else {
                return "steelblue";
            }
        }).style("stroke", "black").style("stroke-width", "0.2px").attr("cx", function(d, i) {
            return root.X;
        }).attr("cy", function(d, i) {
            return root.Y;
        });

        // move position to endposition
        circles.transition().duration(600).ease('ease').attr("transform", function(d) {
            var deltaX = CentroidX(d.centroid[0]) * (-1);
            var deltaY = (m * deltaX) * (-1);
            return "translate(" + deltaX + "," + deltaY + ")";
        }).transition().duration(600).ease('ease').attr("transform", function(d) {
            var deltaX1 = (CentroidY(d.centroid[1]) === parseFloat(0)) ? root.X : CentroidY(d.centroid[1]);
            deltaX1 = (deltaX1 === parseFloat(0)) ? root.X : deltaX1;
            deltaX1 = deltaX1 + CentroidX(d.centroid[0]) * (-1);
            var deltaY1 = m * CentroidY(d.centroid[1]) + m * CentroidX(d.centroid[0]);
            return "translate(" + deltaX1 + "," + deltaY1 + ")";
        }).transition().duration(600).ease('ease').attr(
                "transform",
                function(d) {
                    var deltaAreaX = (CentroidY(d.centroid[1]) === parseFloat(0)) ? root.X : CentroidY(d.centroid[1]);
                    deltaAreaX = (deltaAreaX === parseFloat(0)) ? root.X : deltaAreaX;
                    deltaAreaX = deltaAreaX + CentroidX(d.centroid[0]) * (-1);
                    var deltaAreaY =
                            (Area(d.area) <= Area(axesDomain.areaMin)) ? m * (CentroidY(d.centroid[1]) + CentroidX(d.centroid[0])) : m * (CentroidY(d.centroid[1]) + CentroidX(d.centroid[0])) -
                                    Area(d.area);

                    return "translate(" + deltaAreaX + "," + deltaAreaY + ")";
                });
        circles.on('mouseover', function(d) {
            _spider._showTooltip(d.entity);
        }).on('mouseout', function(d) {
            _spider._hideTooltip(d.entity);
        }).on('click', click);

        function click(d) {
            // avoid backend call in case there are no details available
            var bNoValues = true, i;
            for (i = 0; i < d.entity.rawQuery.length; i++) {
                if (d.entity.rawQuery[i] !== 0) {
                    bNoValues = false;
                    break;
                }
            }
            if (bNoValues) {
                var sEntityName;
                for (i = 1; i < d.entity.entity.length; i++) {
                    if (sEntityName) {
                        sEntityName = sEntityName + " | " + d.entity.entity[i];
                    } else {
                        sEntityName = d.entity.entity[i];
                    }
                }
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, sap.secmon.ui.m.anomaly.ui.Component.getModel("i18n").getResourceBundle().getText(
                        "BU_FLOD_MSG_NODET", sEntityName));
            } else {
                _callBackFn(d, spider);
                _selectedEntity = d;
                // reset zoom
                _area.transition().duration(600).ease('ease').attr("transform", "translate(50,25)scale(1)");
            }

        }
    }

    me.width = function(value) {
        if (!arguments.length) {
            return width;
        }
        width = parseInt(value);
        return me;
    };

    me.height = function(value) {
        if (!arguments.length) {
            return height;
        }
        height = parseInt(value);
        return me;
    };
    me.selected = function(entity) {
        var entityId;
        if (entity) {
            entityId = entity[0];
        }
        _area.selectAll("circle").transition(200).style('fill', "steelblue").style("stroke-width", "0.2px").attr("r", 5.5);
        _area.selectAll("circle[id='" + entityId + "']").transition(200).style('fill', "#73AD21").style("stroke-width", "0.5px").attr("r", 11);

        return me;
    };

    me.showDetails = function(data) {
        _mySunburst(_selectedEntity, data, w, h);
    };

    me.hideDetails = function() {
        _mySunburst.hideDetails();
    };

    return me;
}