/* globals d3 */
$.sap.declare("sap.secmon.ui.m.anomaly.ui.BrushSlider");
$.sap.require("sap.ui.base.Event");
jQuery.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");

/**
 * 
 * @memberOf sap.secmon.ui.m.anomaly.ui.BrushSlider
 */
sap.ui.core.Control.extend("sap.secmon.ui.m.anomaly.ui.BrushSlider", {

    metadata : {
        properties : {
            height : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "100px"
            },
            width : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "1000px"
            },
            data : {
                type : "any",
            },
            func : {
                type : "any"
            },
            outliersOnly : {
                type : "any"
            }
        },

        aggregations : {},

        events : {
            slide : {
                selectedData : "any"
            },
        }
    },
    /**
     * variables
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.BrushSlider
     */
    _data : undefined,
    _sId : undefined,
    _svg : undefined,
    _margin : {
        top : 25,
        right : 50,
        bottom : 75,
        left : 50
    },
    _w : undefined,
    _h : undefined,

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.BrushSlider
     */
    init : function() {
        this._sId = "#" + this.getId();
    },
    
    getText : function(sTextKey) {
        var parameters = Array.prototype.slice.call(arguments, 0), model = this.getModel("i18n").getResourceBundle();
        return model.getText.apply(model, parameters);
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.BrushSlider
     */
    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass('sapEtdBrushSlider');
        oRm.writeClasses();
        oRm.write(">");
        oRm.write("</div>");
    },
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.BrushSlider
     */
    onBeforeRendering : function() {
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.BrushSlider
     */
    onAfterRendering : function() {
        this._data = this.getData();
        if (!this._data) {
            return;
        }
        // points can be empty, but axis can be build up already
        if ($.isEmptyObject(this._data.features)) {
            return;
        }
        if (!this._data.points) {
            return;
        }

        // definde sizes
        this._w = parseInt(this.getWidth()) - this._margin.left - this._margin.right;
        this._h = parseInt(this.getHeight()) - this._margin.top - this._margin.bottom;

        this._update();
    },
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.BrushSlider
     */
    _update : function() {
        this._cleanUp();
        this._buildBrushSlider();
    },

    /**
     * build brush slider
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.BrushSlider
     */
    _buildBrushSlider : function() {
        var _that = this;
        var sFunc = this.getFunc();
        var sNorm;
        var bOutliersOnly = this.getOutliersOnly();
        switch (sFunc) {
        case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MAX:
            sNorm = "max";
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.MIN:
            sNorm = "min";
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_SCOREFUNCTION.AVG:
            sNorm = "avg";
            break;
        }
        // only allow entities with values
        var aPoints = this._data.points.filter(function(d, i) { 
            if(d.entity && d.entity.length !== 0){
                return d.entity[0]; 
            }else{
                console.log("Entity empty: " + i );
            }
            });
        // selection interval containing entities which are most unlikely
        var selectionTo, selectionFrom;
        if ($.isEmptyObject(aPoints)) {
            selectionTo = 1;
            selectionFrom = 0.0;
        } else if (aPoints.length > 10 && (aPoints[0].distances[sNorm] ) !== aPoints[9].distances[sNorm]) {
            selectionTo = aPoints[0].distances[sNorm];
            // 10 entities that are most unlikely
            selectionFrom = aPoints[9].distances[sNorm];
        }else {
            selectionTo = aPoints[0].distances[sNorm];
            selectionFrom = (aPoints[0].distances[sNorm]) - 0.1;
        }
        if (selectionFrom < 0) {
            selectionFrom = 0.0;
        }

        // functions
        var x = d3.scale.linear().domain([ 0, 1 ]).range([ this._margin.left, this._w + this._margin.left ]);
        var y = d3.random.normal((this._h + this._margin.top) / 2, (this._h + this._margin.top) / 8);
        var brush = d3.svg.brush().x(x).extent([ selectionFrom, selectionTo ]).on("brushstart", brushstart).on("brush", brushmove).on("brushend", brushend);

        // SVG
        this._svg = d3.select(this._sId + ".sapEtdBrushSlider").select("svg");
        if (this._svg.empty()) {
            this._svg = d3.select(this._sId + ".sapEtdBrushSlider").append("svg").attr("width", parseInt(this.getWidth())).attr("height", parseInt(this.getHeight())).append("g")
                    .attr("width", this._w).attr("height", this._h).attr("transform", "translate(" + 0 + "," + 0 + ")");
        }

        // X-Axis
        this._svg.append("g").attr("class", "x sapETDFeatureAxis").attr("transform", "translate(" + 0 + "," + (this._margin.top + this._h) + ")").style("font-size", "14px").call(
                d3.svg.axis().scale(x).orient("bottom").tickFormat(function(d) {
                    if ((d * 10) % 2 === 0) {
                        return d * 100;
                    }
                }));
        
        this._svg.append("line").attr("stroke-width", 1.5).attr("stroke", "#666666").style("stroke-dasharray", "3, 3").attr("x1", function(d) {
            return x(0.63);
        }).attr("y1", 0).attr("x2", function(d) {
            return x(0.63);
        }).attr("y2", function(d) {
            return _that._h + _that._margin.top;
        });
        // get number of outliers
        var iNumbersOfOutliers = 0;
        for (var j=0; j<aPoints.length; j++){
            if(aPoints[j].isOutlier){
                iNumbersOfOutliers++;
            }
        }
        // add label for number of outliers
        this._svg.append("text").style("font-size", "14px").attr("x", ((parseInt(this.getWidth()) / 2) - 50)).attr("y", this._h + this._margin.top + 30).text(
                function(d) {
                    return _that.getText("BU_FLOD_TXT_Total") + ": " + aPoints.length + "; " + _that.getText("BU_FLOD_TXT_Anomalies") + ": " + iNumbersOfOutliers;
                });

        // plot entities
        var circle = this._svg.append("g").selectAll("circle").data(aPoints).enter().append("circle").filter(function(d) { 
            if(bOutliersOnly === false){
                return true; 
            }else{
                return d.isOutlier;
            }}).attr("transform", function(d) {
            return "translate(" + x(d.distances[sNorm]) + "," + y() + ")";
        }).attr("r", 4.5).attr("fill", function(d){ 
            if(d.isOutlier){
                return '#e31c1c';
            }else{
                return 'steelblue';
            }
            
            
        });

        var brushg = this._svg.append("g").attr("class", "sapETDFeatureBrush").call(brush);
        brushg.selectAll(".resize").append("path").attr("transform", "translate(0," + (_that._h + _that._margin.top) * -1 + ")").attr("d", resizePath);
        brushg.selectAll("rect").attr("height", this._h + _that._margin.top);

        brushstart(this._svg);
        brushmove();

        function resizePath(d) {
            var e = +(d === "e"), x = e ? 1 : -1, y = _that._h + _that._margin.top;
            return "M" + (0.5 * x) + "," + y + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6) + "V" + (2 * y - 6) + "A6,6 0 0 " + e + " " + (0.5 * x) + "," + (2 * y) +
                 "Z" + "M" + (2.5 * x) + ","  + (y + 8) + "V" + (2 * y - 8) + "M" + (4.5 * x) + "," + (y + 8) + "V" + (2 * y - 8);
        }
        function brushstart() {
            _that._svg.classed("sapETDFeatureBrushSelecting", true);
        }

        function brushmove() {
            var s = brush.extent();
            var aSelectedArea = [ s[0], s[1] ];
            var aSelectedData = [];
            circle.classed("selected", function(d) {
                d.isSelected = false;
                if (s[0] <= d.distances[sNorm] && d.distances[sNorm] <= s[1]) {
                    aSelectedData.push(d);
                    return true;
                }
                
            });
            _that.fireSlide({
                selectedArea : aSelectedArea,
                selectedData : aSelectedData
            });
        }
        function brushend() {
            _that._svg.classed("selecting", !d3.event.target.empty());
        }
    },
    /**
     * @memberOf sap.secmon.ui.m.anomaly.ui.BrushSlider
     */
    _cleanUp : function() {
        var svg = d3.select(this._sId + ".sapEtdBrushSlider").select("svg");
        if (!svg.empty()) {
            svg.remove();
        }
    }
});
