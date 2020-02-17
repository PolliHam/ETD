/* globals d3 */
$.sap.declare("sap.secmon.ui.m.anomaly.ui.SNDistribution");
$.sap.require("sap.ui.base.Event");

jQuery.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");

/**
 * Displays distributions of each dimension in a multi-dimensional data. The control aligns all the charts vertically.
 * 
 * @memberOf sap.secmon.ui.m.anomaly.ui.SNDistribution
 * @see: sap.secmon.ui.m.anomaly.ui.AnomalyObjectPanel for how to use
 */

sap.ui.core.Control.extend("sap.secmon.ui.m.anomaly.ui.SNDistribution", {

    metadata : {
        properties : {
            height : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "110px"
            },
            width : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "300px"
            },
            data : {
                type : "any",
            },
            isNonOriginal : {
                type : "boolean",
                defaultValue : "false"
            },
            // how many slots the dimension should be divided
            tickCount : {
                type : "int",
                defaultValue : 2
            },
        },

        aggregations : {
            _confidenceInterval : {
                type : "sap.ui.layout.HorizontalLayout",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {}
    },

    _aEvaluations : [],
    _isUIBuild : undefined,
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.SNDistribution
     */
    init : function() {
        var _that = this;
        // create InputField
        var oInput = new sap.m.Input({
            type : sap.m.InputType.Number,
            width : "45px",
            value : {
                path : "Threshold"
            },
            liveChange : function(oEvent) {
                var val = parseInt(oEvent.getParameter('newValue'));
                var valueState = (isNaN(val) || val > 3 || val <= 0) ? "Error" : "None";
                oEvent.getSource().setValueState(valueState);
            },
            change : function() {
                _that.rerender();
            }
        });
        var oLabel = new sap.m.Input({
            value : "Z-Score:",
            width : "70px",
            editable : false
        });

        var oCI = new sap.ui.layout.HorizontalLayout({
            content : [ oLabel, oInput ]
        });
        this.setAggregation("_confidenceInterval", oCI);
    },
    
    getText  : function(sTextKey) {
        var parameters = Array.prototype.slice.call(arguments, 0), model = this.getModel("i18n").getResourceBundle();
        return model.getText.apply(model, parameters);
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.SNDistribution
     */
    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addClass('sapEtdSNDistrib');
        oRm.writeClasses();
        oRm.write(">");
        if (oControl.getData() && oControl.getData().AggregationMethod === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.SND) {
            var oInp = oControl.getAggregation("_confidenceInterval");
            if(oControl.getIsNonOriginal() === true){
                oInp.getContent()[1].setEnabled(false);
            }
            oRm.renderControl(oInp);
        }
        oRm.write("</div>");

    },
    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.SNDistribution
     */
    onBeforeRendering : function() {
    },

    /**
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.SNDistribution
     */
    onAfterRendering : function() {

        var _that = this;
        var data = this.getData();
        var container;
        if (!data) {
            return;
        }
        if (!data.AggregationMethod) {
            return;
        }
        var confidenceIntervall, positiveThreshold, negativeThreshold;
        var margin = {
            top : 20,
            right : 20,
            bottom : 20,
            left : 20
        };

        var brush, x, y; 

        var w = parseInt(this.getWidth()) - margin.left - margin.right;
        var h = parseInt(this.getHeight()) - margin.top - margin.bottom;

        var sId = "#" + this.getId();
        var root = d3.select(sId + ".sapEtdSNDistrib");
        var tooltip = d3.select("body").append("div").style("position", "absolute").style("z-index", "10").style("visibility", "hidden").style(
                "font-weight", "bold").attr("font-size", "10px").attr("fill", "black");

        function brushed() {
            var value = brush.extent()[0];
            if (d3.event.sourceEvent) { // not a programmatic event
                value = x.invert(d3.mouse(this)[0]);
                brush.extent([ value, value ]);
                var val = Math.round(Math.abs(value) * Math.pow(10, 2)) / Math.pow(10, 2);
                negativeThreshold.attr("x1", function(d) {
                    if(_that.getData().IncludeNegativeScore === 0){
                        return x(0 * (-1));
                    }else{
                        if (val > 3) {
                            val = 3.0;
                        } else if (val < 1) {
                            val = 1.0;
                        }
                        return x(val * (-1));
                    }
                }).attr("y1", h).attr("x2", function(d) {
                    if(_that.getData().IncludeNegativeScore === 0){
                        return x(0 * (-1));
                    }else{
                        return x(val * (-1));
                    }
                }).attr("y2", function(d) {
                    return y(0.4);
                });
                positiveThreshold.attr("x1", function(d) {
                    return x(val);
                }).attr("y1", h).attr("x2", function(d) {
                    return x(val);
                }).attr("y2", function(d) {
                    return y(0.4);
                });
                confidenceIntervall.text(function(d) {
                    _that.getBindingContext().getModel().setProperty("Threshold", val, _that.getBindingContext());
                    _that._aEvaluations[0].marker = val;
                });
            }
        }

        if (data.AggregationMethod === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.SND) {
            // prepare the data for drawing
            // key is the axis name
            var aValues = [];
            for (var i = -4; i < 4; i = i + 0.1) {
                aValues.push({
                    x : i,
                    // density function: f(x)= 1/ Wurzel(2*PI) * e^(-1/2*x²)
                    y : (1 / (Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow(i, 2))
                });
            }

            this._aEvaluations = [];
            this._aEvaluations.push({
                key : data.Id,
                name : data.Name,
                namespace : data.Namespace,
                values : aValues,
                marker : data.Threshold
            });
            // DRAW COORDINATE SYSTEM
            // 1. Set the domains and ranges
            x = d3.scale.linear().domain(d3.extent(this._aEvaluations[0].values, function(d) {
                return d.x;
            })).range([ 0, w ]).clamp(true);
            y = d3.scale.linear().domain(d3.extent(this._aEvaluations[0].values, function(d) {
                return d.y;
            })).range([ h, 0 ]);

            // 2. axis orientation
            var xAxis = d3.svg.axis().scale(x).orient("bottom");

            // 3. ticks for x axis
            xAxis.scale(x).ticks(1);

            // 4. line function
            var line = d3.svg.line().x(function(d) {
                return x(d.x);
            }).y(function(d) {
                return y(d.y);
            });

            // ENABLE THRESHOLD SLIDER
            brush = d3.svg.brush().x(x).extent([ 0, 0 ]).on("brush", brushed);

            // DRAW ELEMENTS
            // 1.1 container in which the coordinate system is drawn
            container = root.selectAll("svg").data(this._aEvaluations).enter().append("svg").attr("id", function(d, i) {
                return d.key;
            })
            // 1.2 setup scalable viewbox for SVG
            .attr("viewBox", "0 15 " + (w + margin.left + margin.right) + " " + (h + margin.top + margin.bottom)).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // 2. draw axis
            container.append("g").attr("class", "x sapETDFeatureAxis").attr("transform", "translate(0," + h + ")").call(xAxis);

            // 3. draw density function
            container.append("path").datum(this._aEvaluations[0].values).attr("class", "sapEtdLine").attr("d", line);

            // 5. confidence intervall
            confidenceIntervall = container.append("text");
            
            // 6.slider
            var slider = container.append("g").attr("class", "sapEtdSlider").call(brush);
            slider.selectAll(".extent,.resize").remove();

            // 4. draw threshold
            // 4.1 positiv deviation
            positiveThreshold = slider.append("line").attr("stroke-width", 2).attr("stroke", "#666666").style("stroke-dasharray", "3, 3").attr("x1", function(d) {
                return x(_that._aEvaluations[0].marker);
            }).attr("y1", h).attr("x2", function(d) {
                return x(_that._aEvaluations[0].marker);
            }).attr("y2", function(d) {
                return y(0.4);
            }).on('mouseover', function(d) {
                return tooltip.style("visibility", "visible").text(_that.getText("Slide2ChangeTH_TXT"));
            }).on('mousemove', function() {
                return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
            }).on('mouseout', function() {
                return tooltip.style("visibility", "hidden");
            }).attr("class", "sapEtdHover");
            // 4.2 negative deviation
            negativeThreshold = slider.append("line").attr("stroke-width", 2).attr("stroke", "#666666").style("stroke-dasharray", "3, 3").attr("x1", function(d) {
                var iTH = _that._aEvaluations[0].marker;
                if(_that.getData().IncludeNegativeScore === 0){
                    iTH = 0;
                }
                return x(iTH * (-1));
            }).attr("y1", h).attr("x2", function(d) {
                var iTH = _that._aEvaluations[0].marker;
                if(_that.getData().IncludeNegativeScore === 0){
                    iTH = 0;
                }
                return x(iTH * (-1));
            }).attr("y2", function(d) {
                return y(0.4);
            }).on('mouseover', function(d) {
                return tooltip.style("visibility", "visible").text(_that.getText("Slide2ChangeTH_TXT"));
            }).on('mousemove', function() {
                return tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px");
            }).on('mouseout', function() {
                return tooltip.style("visibility", "hidden");
            }).attr("class", "sapEtdHover");

            slider.call(brush.event).transition() // gratuitous intro!
            .duration(750).call(brush.extent([ this._aEvaluations[0].marker * (-1), this._aEvaluations[0].marker * (-1) ])).call(brush.event);
        } else if (data.AggregationMethod === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM) {
            this._aEvaluations = [];
            this._aEvaluations.push({
                key : data.Id,
                name : data.Name,
                namespace : data.Namespace,
                values : [],
                marker : data.Threshold
            });
            container = root.selectAll("svg").data(this._aEvaluations).enter().append("svg").attr("id", function(d, i) {
                return d.key;
            }).attr("viewBox", "0 0 " + (w + margin.left + margin.right) + " " + (h + margin.top + margin.bottom)).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            container.append("text").attr("x", w / 2).attr("y", h / 2).style("text-anchor", "middle").style("font-size", "17px").style('fill', '#00679e').text(
                    function(d) {
                        return _that.getText("RVM_TXT");
                    });

        }

    }
});
